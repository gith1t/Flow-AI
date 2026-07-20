import json
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

try:
    from backend import main
except ModuleNotFoundError:
    import main


class FakeResponse:
    def __init__(self, payload):
        self.choices = [
            type(
                "Choice",
                (),
                {"message": type("Message", (), {"content": json.dumps(payload)})()},
            )
        ]


class FakeCompletions:
    def __init__(self, payloads, calls):
        self.payloads = payloads
        self.calls = calls

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if not self.payloads:
            raise AssertionError("The test did not provide a fake OpenAI response.")
        return FakeResponse(self.payloads.pop(0))


class FakeClient:
    def __init__(self, payloads, calls):
        self.chat = type(
            "Chat",
            (),
            {"completions": FakeCompletions(payloads, calls)},
        )()


class FrontendBackendContractTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.state_path = Path(self.temporary_directory.name) / "workspace_state.json"
        self.original_state_file = main.STATE_FILE
        self.original_get_openai_client = main.get_openai_client
        self.original_client = main.client
        self.model_payloads = []
        self.model_calls = []
        main.STATE_FILE = str(self.state_path)
        main.client = None
        main.get_openai_client = lambda _api_key=None: FakeClient(
            self.model_payloads, self.model_calls
        )
        self.client = TestClient(main.app)

    def tearDown(self):
        self.client.close()
        main.STATE_FILE = self.original_state_file
        main.get_openai_client = self.original_get_openai_client
        main.client = self.original_client
        self.temporary_directory.cleanup()

    def queue_model_response(self, payload):
        self.model_payloads.append(payload)

    def create_finding_from_frontend_payload(self):
        source_text = "Solar panels reduce household electricity demand in summer."
        self.queue_model_response(
            {
                "suggested_layout": "graph",
                "proposals": [
                    {
                        "title": "Solar demand reduction",
                        "details": "Solar generation reduces the summer household demand.",
                        "confidence_score": 91,
                        "evidence": [{"quote": source_text}],
                        "relations": [],
                    }
                ],
            }
        )
        research = self.client.post(
            "/api/research",
            json={
                "query": "How does solar affect demand?",
                "text": source_text,
                "target_lang": "uk",
                "topic_id": None,
                "topic_title": "Household solar",
                "source_title": "Solar study.md",
                "source_page_count": 0,
                "source_policy": "smart",
                "api_key": "session-only-test-key",
            },
        )
        self.assertEqual(research.status_code, 200, research.text)
        research_body = research.json()
        self.assertEqual(research_body["suggested_layout"], "graph")
        self.assertEqual(research_body["topic"]["title"], "Household solar")
        self.assertEqual(len(research_body["new_proposals"]), 1)
        self.assertEqual(research_body["new_proposals"][0]["confidence_score"], 91)
        self.assertIn(
            "strictly in the uk language",
            self.model_calls[-1]["messages"][0]["content"],
        )

        proposal = research_body["new_proposals"][0]
        committed = self.client.post(f"/api/proposals/{proposal['id']}/commit")
        self.assertEqual(committed.status_code, 200, committed.text)
        return research_body["topic"], committed.json()["committed_finding"], source_text

    def test_ui_state_source_import_research_and_history_contracts(self):
        cors_preflight = self.client.options(
            "/api/workspace",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(cors_preflight.status_code, 200, cors_preflight.text)
        self.assertEqual(
            cors_preflight.headers.get("access-control-allow-origin"),
            "http://localhost:5173",
        )

        configuration = self.client.get("/api/config/openai")
        self.assertEqual(configuration.status_code, 200, configuration.text)
        self.assertIn("configured", configuration.json())

        initial_workspace = self.client.get("/api/workspace")
        self.assertEqual(initial_workspace.status_code, 200, initial_workspace.text)
        self.assertEqual(initial_workspace.json()["findings"], [])

        extracted = self.client.post(
            "/api/sources/extract",
            files={"file": ("notes.md", b"# Notes\nExact source evidence.", "text/markdown")},
        )
        self.assertEqual(extracted.status_code, 200, extracted.text)
        self.assertEqual(extracted.json()["source_title"], "notes.md")
        self.assertEqual(extracted.json()["page_count"], 0)

        ui_state = {
            "mode": "graph",
            "selected_node_id": "finding-pending",
            "node_positions": [{"id": "finding-pending", "x": 140, "y": 260}],
            "manual_edges": [
                {"id": "manual-pending", "source": "topic-pending", "target": "finding-pending"}
            ],
            "context_layers": [
                {"id": "layer-pending", "memberIds": ["finding-pending", "finding-next"]}
            ],
        }
        persisted = self.client.put("/api/workspace/ui-state", json={"ui_state": ui_state})
        self.assertEqual(persisted.status_code, 200, persisted.text)
        self.assertEqual(persisted.json()["ui_state"]["node_positions"][0]["x"], 140)

        topic, finding, _ = self.create_finding_from_frontend_payload()
        workspace = self.client.get("/api/workspace")
        self.assertEqual(workspace.status_code, 200, workspace.text)
        workspace_body = workspace.json()
        self.assertEqual(workspace_body["findings"][0]["id"], finding["id"])
        self.assertEqual(workspace_body["topics"][0]["id"], topic["id"])
        self.assertEqual(workspace_body["ui_state"]["mode"], "graph")

        revision = workspace_body["history"][-1]["revision"]
        checkout = self.client.post(
            f"/api/workspace/checkout/{revision}",
            json={
                "ui_state": {
                    "mode": "tree",
                    "node_positions": [],
                    "manual_edges": [],
                    "context_layers": [],
                }
            },
        )
        self.assertEqual(checkout.status_code, 200, checkout.text)
        self.assertEqual(checkout.json()["ui_state"]["mode"], "graph")

    def test_relation_and_socratic_contracts(self):
        topic, first_finding, first_text = self.create_finding_from_frontend_payload()
        second_text = "Battery storage shifts solar energy into the evening peak."
        self.queue_model_response(
            {
                "suggested_layout": "timeline",
                "topic_fit": {
                    "score": 92,
                    "verdict": "aligned",
                    "reason": "Both sources examine household solar demand.",
                },
                "proposals": [
                    {
                        "title": "Storage shifts the peak",
                        "details": "Storage moves solar energy into evening demand.",
                        "confidence_score": 88,
                        "evidence": [{"quote": second_text}],
                        "relations": [
                            {
                                "target_id": first_finding["id"],
                                "type": "extends",
                                "confidence_score": 84,
                                "reason": "Storage extends the solar-demand mechanism.",
                                "evidence": second_text,
                            }
                        ],
                    }
                ],
            }
        )
        research = self.client.post(
            "/api/research",
            json={
                "query": topic["query"],
                "text": second_text,
                "target_lang": "en",
                "topic_id": topic["id"],
                "topic_title": None,
                "source_title": "Storage study.txt",
                "source_page_count": 0,
                "source_policy": "smart",
                "api_key": "session-only-test-key",
            },
        )
        self.assertEqual(research.status_code, 200, research.text)
        second_proposal = research.json()["new_proposals"][0]
        self.assertEqual(second_proposal["relations"][0]["status"], "candidate")
        self.assertEqual(research.json()["suggested_layout"], "timeline")

        committed = self.client.post(f"/api/proposals/{second_proposal['id']}/commit")
        self.assertEqual(committed.status_code, 200, committed.text)
        second_finding = committed.json()["committed_finding"]
        candidate_relation = second_finding["relations"][0]

        approved = self.client.post(
            f"/api/findings/{second_finding['id']}/relations/{candidate_relation['id']}/approve"
        )
        self.assertEqual(approved.status_code, 200, approved.text)
        self.assertEqual(approved.json()["relation"]["status"], "verified")

        manual = self.client.post(
            f"/api/findings/{first_finding['id']}/relations",
            json={"target_id": second_finding["id"], "type": "manual link"},
        )
        self.assertEqual(manual.status_code, 200, manual.text)
        self.assertEqual(manual.json()["relation"]["origin"], "manual")
        removed_manual = self.client.delete(
            f"/api/findings/{first_finding['id']}/relations/{manual.json()['relation']['id']}"
        )
        self.assertEqual(removed_manual.status_code, 200, removed_manual.text)

        self.queue_model_response(
            {
                "relations": [
                    {
                        "source_id": first_finding["id"],
                        "target_id": second_finding["id"],
                        "type": "explains",
                        "confidence_score": 78,
                        "reason": "The source finding explains storage's baseline mechanism.",
                        "evidence": first_text,
                    }
                ]
            }
        )
        discovered = self.client.post(
            f"/api/topics/{topic['id']}/relations/discover",
            json={"target_lang": "en", "api_key": "session-only-test-key"},
        )
        self.assertEqual(discovered.status_code, 200, discovered.text)
        self.assertEqual(discovered.json()["created"], 1)
        discovered_relation = discovered.json()["relations"][0]
        rejected = self.client.delete(
            f"/api/findings/{first_finding['id']}/relations/{discovered_relation['id']}"
        )
        self.assertEqual(rejected.status_code, 200, rejected.text)

        draft_payload = {
            "identified_gap": "The claim needs evidence about the evening peak.",
            "socratic_questions": [
                "What baseline demand was measured?",
                "Does the evidence cover the evening peak?",
            ],
            "proposed_hypothesis": {
                "title": "Storage may explain the peak shift",
                "details": "Storage can move solar output into evening demand.",
                "confidence_score": 74,
                "evidence": first_text,
            },
        }
        self.queue_model_response(draft_payload)
        review = self.client.post(
            "/api/socratic/review",
            json={
                "target_lang": "en",
                "fact_id": first_finding["id"],
                "fact_text": first_finding["details"],
                "topic_id": topic["id"],
                "api_key": "session-only-test-key",
            },
        )
        self.assertEqual(review.status_code, 200, review.text)
        self.assertEqual(review.json()["proposed_hypothesis"]["confidence_score"], 74)
        self.assertIn("Target fact ID", self.model_calls[-1]["messages"][0]["content"])
        self.assertIn(
            "strictly in the en language",
            self.model_calls[-1]["messages"][0]["content"],
        )

        self.queue_model_response(draft_payload)
        text_only_review = self.client.post(
            "/api/socratic/review",
            json={
                "target_lang": "en",
                "fact_id": None,
                "fact_text": "A selected visual node can be reviewed without a saved fact id.",
                "topic_id": topic["id"],
                "api_key": "session-only-test-key",
            },
        )
        self.assertEqual(text_only_review.status_code, 200, text_only_review.text)
        self.assertIn(
            "Target fact supplied by the interface",
            self.model_calls[-1]["messages"][1]["content"],
        )

        merged = self.client.post(
            "/api/socratic/commit",
            json={**draft_payload["proposed_hypothesis"], "topic_id": topic["id"]},
        )
        self.assertEqual(merged.status_code, 200, merged.text)
        self.assertEqual(merged.json()["committed_finding"]["topic_id"], topic["id"])

        deleted_topic = self.client.delete(f"/api/topics/{topic['id']}")
        self.assertEqual(deleted_topic.status_code, 200, deleted_topic.text)
        self.assertEqual(deleted_topic.json()["topics"], [])

        reset = self.client.post("/api/workspace/reset")
        self.assertEqual(reset.status_code, 200, reset.text)
        self.assertEqual(reset.json()["findings"], [])


if __name__ == "__main__":
    unittest.main()
