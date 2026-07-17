"""Тест ендпоінту /api/research на запущеному сервері Yomirai (http://localhost:8000)."""
import json
import urllib.request
import urllib.error

URL = "http://localhost:8000/api/research"
PAYLOAD = {
    "query": "Троянська війна: ключові події",
    "text": "Лекція про Троянську війну: Ахіль вбив Гектора біля стін Трої, але Одіссей придумав коня.",
}


def post(url: str, payload: dict) -> tuple[int, dict]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


if __name__ == "__main__":
    status, body = post(URL, PAYLOAD)
    print(f"Статус відповіді: {status}")
    proposals = body.get("new_proposals", [])
    print(f"Отримано карток-proposals: {len(proposals)}")
    print(json.dumps(proposals, ensure_ascii=False, indent=2))
