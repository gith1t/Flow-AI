import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const API_URL = "http://localhost:8000";

const UI_COPY = {
  en: {
    verifiedFact: "Verified Fact",
    verified: "Verified",
    evidenceConfidence: "Evidence confidence",
    unscored: "Unscored",
    reviewBranch: "Socratic Review Draft",
    socraticDraft: "Socratic Draft",
    reviewBadge: "Review",
    critiques: "Critiques",
    workspaceAssumptions: "workspace assumptions",
    mergeRequiresEvidence: "Merge requires an exact source evidence quote.",
    merging: "Merging...",
    resolveMerge: "Resolve & Merge",
    dismissReview: "Dismiss Review",
    contextLayer: "Context Layer",
    facts: "facts",
    researchTopic: "Research Topic",
    sources: "sources",
    addPaperSource: "+ Add paper / source",
    manual: "● Manual",
    review: "◉ Review",
    magic: "✦ Magic",
    graph: "Graph",
    tree: "Tree",
    timeline: "Timeline",
    compare: "Compare",
    workspaceMode: "Workspace mode",
    layoutMode: "Graph layout mode",
    copilotThinking: "Co-Pilot thinking...",
    runCopilot: "Run Context Co-Pilot",
    exportReport: "📥 Export Skill / Download Report",
    openIngestion: "Open research ingestion",
    spotlight: "Spotlight Ingestion",
    addEvidenceTo: (title) => `Add evidence to ${title || "research topic"}`,
    startNewTopic: "Start a new research topic",
    importEvidenceDescription: "Import another paper, note, or dataset. New findings will connect to the active topic and relevant verified facts.",
    newTopicDescription: "Define a concrete question and the first source. Flow-AI will create a dedicated topic root on the canvas.",
    close: "Close",
    sessionKey: "Session-only OpenAI key",
    sessionReady: "Session ready",
    backendReady: "Backend ready",
    keyRequired: "Key required",
    sessionReadyDescription: "Ready for this browser session only. It is not written to disk or browser storage.",
    backendReadyDescription: "A local backend key is available. You may enter a session key to use it instead.",
    keyRequiredDescription: "Paste a key to enable AI analysis. File extraction itself works without one.",
    freshRunHint: "Need a clean run? Clear previous test topics, findings, graph links, and history.",
    clearing: "Clearing...",
    startFresh: "Start fresh workspace",
    responseLanguage: "Response language",
    responseLanguageDescription: "Choose the language for findings, questions, hypotheses, relation labels, and the interface.",
    auto: "Auto",
    sourceLanguage: "Source language",
    english: "English",
    englishOutput: "English output",
    ukrainian: "Ukrainian",
    ukrainianOutput: "Ukrainian output",
    firewallPolicy: "Relation Firewall policy",
    firewallDescription: "Choose how a source with uncertain topical fit should affect this research topic.",
    smartFirewall: "Smart firewall",
    smartFirewallDescription: "Recommended: isolate unrelated sources and block weak AI links.",
    isolateUncertain: "Keep uncertain isolated",
    isolateUncertainDescription: "Only strongly aligned sources join this topic.",
    importWithoutLinks: "Import without links",
    importWithoutLinksDescription: "Keep facts here, but disable all automatic AI relations.",
    activeQuery: "Active Query",
    queryPlaceholder: "What should Flow-AI investigate?",
    sourcePaperTitle: "Source / paper title",
    sourceTitlePlaceholder: "e.g. paper title, dataset name, or source label",
    researchDocument: "Research Document",
    documentPlaceholder: "Paste source material, notes, transcripts, or evidence...",
    importSource: "Import source file",
    importDescription: "PDF, DOCX, TXT, Markdown, CSV, TSV, JSON or LOG. PDF and DOCX are extracted by the backend and mapped back to evidence.",
    extracting: "Extracting readable text from the source…",
    pagesReady: (count) => `${count} PDF pages ready for evidence mapping.`,
    cancel: "Cancel",
    analyzing: "Analyzing research...",
    analyzeSource: "Analyze Source → Connect Findings",
    analyzeResearch: "Analyze Research → Create Topic",
    aiInbox: "AI Inbox",
    proposals: "Proposals",
    loadingInbox: "Loading inbox...",
    noProposalsTopic: "No proposals for this topic yet. Add a paper or another source.",
    noProposalsWorkspace: "Inbox is empty. Create a research topic to start analysis.",
    source: "Source",
    mergeWorkspace: "Merge to Workspace",
    canvasLabel: "Knowledge graph canvas",
    activeTopic: "Active research topic",
    selectTopic: "Select a topic",
    newTopic: "+ New topic",
    addPaper: "+ Add paper",
    deleting: "Deleting...",
    deleteTopic: "Delete topic",
    graphIntro: "New analysis creates proposals in AI Inbox. Merge verified facts, then discover evidence-grounded links or switch to Manual to draw your own.",
    graphFilters: "Graph filters & legend",
    searchFindings: "Search findings…",
    filterBySource: "Filter graph by source",
    allSources: "All sources",
    minimumConfidence: "Minimum finding confidence",
    anyConfidence: "Any confidence",
    highConfidence: "High confidence · 85%+",
    mediumConfidence: "Medium confidence · 65%+",
    focusedTopic: "Focused: active topic",
    focusTopic: "Focus active topic",
    trail: "Trail",
    reviewEdge: "Socratic review",
    selected: "selected",
    group: "Group",
    graphLegend: "Cyan = verified AI link · yellow dashed = review required · purple dashed = cross-topic hypothesis · yellow review edge = Socratic review.",
    socraticCopilot: "Socratic Co-Pilot",
    languageSetInIngestion: "Language · set in ingestion",
    magicLayout: "⚡ Magic Layout",
    downloadReport: "📥 Download Report",
    discovering: "Discovering evidence links...",
    discoverConnections: "✦ Discover Connections",
    mergeMore: (count) => `Merge ${count} more proposal${count === 1 ? "" : "s"} to enable AI connection discovery.`,
    inspector: "Inspector",
    contextGitState: "Context Git State",
    draft: "DRAFT",
    inbox: "INBOX",
    pendingLink: "PENDING LINK",
    hypothesis: "HYPOTHESIS",
    relation: "RELATION",
    state: "State",
    history: "History",
    snapshots: "Workspace Snapshots",
    restoreDescription: "Restore a previous verified Context Git state.",
    revisions: "revisions",
    firstSnapshot: "The first snapshot appears after analysis, merge, or a relation change.",
    timestampUnavailable: "timestamp unavailable",
    restoring: "Restoring...",
    restore: (revision) => `Restore r${revision}`,
    relationPath: "Relation Path",
    relationEvidence: "Relation Evidence · Strict Evidence Mapping",
    sourceEvidence: "Source Evidence · Strict Evidence Mapping",
    noEvidence: "No evidence available.",
    page: "Page",
    textSource: "Text source",
    character: "char",
    firewallReview: "Relation Firewall · Human Review Required",
    aiSuggestion: "AI suggestions stay provisional until you approve their evidence mapping.",
    pending: "pending",
    confidence: "Confidence",
    notScored: "not scored",
    saving: "Saving...",
    approveEvidence: "Approve evidence link",
    rejectLink: "Reject link",
    aiReasoning: "AI Reasoning",
    socraticQuestions: "Socratic Questions",
    proposedHypothesis: "Proposed Hypothesis",
    noSelection: "Select a proposal in AI Inbox or a verified fact on the canvas to inspect its Context Git State.",
    rawState: "Pydantic State · Raw JSON",
    requiresKey: "Enter an OpenAI API key in Spotlight Ingestion before AI analysis.",
    waitForExtraction: "Wait for source extraction to finish.",
    fillResearchFields: "Fill in Active Query and Research Document before analysis.",
    analysisFailed: "AI analysis failed.",
    topicDeleted: "Research topic deleted. A previous revision remains available in History.",
    chooseTopic: "Select a research topic before discovering connections.",
    noKeyForConnections: "Enter an OpenAI API key in Spotlight Ingestion before discovering connections.",
    relationApproved: "AI relation approved and marked as a verified evidence link.",
    relationRejected: "AI relation candidate rejected. The graph now contains the remaining links.",
    reviewFailed: "Context Co-Pilot could not create a draft.",
    mergeFailed: "Resolve & Merge failed.",
    relationUnavailable: "This relation is no longer available. The workspace was refreshed.",
    groupSelection: "Select at least two ungrouped Fact Nodes for a Context Layer.",
    uiSaveFailed: "Could not save the canvas state.",
    workspaceLoadFailed: "Could not load Context Git State.",
    backendUnavailable: "Could not connect to the local backend.",
    openAiConfigUnavailable: "OpenAI configuration is unavailable.",
    sourceExtractionFailed: "Could not extract readable text from the source.",
    confirmReset: "Clear all previous topics, findings, proposals, graph links, and history? This cannot be undone.",
    resetFailed: "Could not clear the previous workspace.",
    chooseTopicToDelete: "Select a topic to delete first.",
    confirmDeleteTopic: (title) => `Delete “${title}” and all of its sources, proposals, findings, and graph links? You can restore an earlier revision from History.`,
    deleteTopicFailed: "Could not delete the research topic.",
    topicFitVerdict: (verdict) => ({ aligned: "aligned", uncertain: "uncertain", unrelated: "unrelated" }[verdict] || verdict),
    topicFit: (score, verdict, reason) => {
      const labels = { aligned: "aligned", uncertain: "uncertain", unrelated: "unrelated" };
      return `Topic fit ${score}/100 · ${labels[verdict] || verdict}. ${reason || ""}`;
    },
    sourceQuarantined: (summary) => `Relation Firewall isolated this source in a separate topic. ${summary}`,
    createdProposals: (count, summary) => `Created ${count} evidence-grounded proposal${count === 1 ? "" : "s"} in AI Inbox. ${summary}`,
    noProposalsAnalysis: (summary) => `Analysis completed. No evidence-grounded proposals were returned for this source. ${summary}`,
    proposalCommitFailed: "Could not merge the proposal into Workspace.",
    proposalMerged: "Finding merged into Workspace. Merge at least two findings in this topic to enable AI connection discovery.",
    noConnections: "No additional evidence-grounded connections were found between the verified facts.",
    discoveryCreated: (count) => `Created ${count} evidence-grounded AI relation candidate${count === 1 ? "" : "s"}. Review it before it becomes verified.`,
    connectionDiscoveryFailed: "Could not discover connections between the facts.",
    aiApproveFailed: "Could not approve the AI evidence link.",
    aiRejectFailed: "Could not reject the AI evidence link.",
    manualRelationFailed: "Could not save the manual connection.",
    checkoutFailed: "Could not restore the revision.",
    importWithoutLinksNotice: "Source imported without automatic AI relations, as requested by the import policy.",
    sourceFitNotice: (score, verdict) => `Source fit is ${score}/100 (${verdict}), so Flow-AI kept its facts separate from existing facts and created no AI relations.`,
    noEvidenceMappedNotice: "AI returned proposals, but none contained a quote that could be mapped back to the uploaded source. The source was saved; try a more focused excerpt or run the analysis again.",
    acceptedSkippedNotice: (accepted, skipped) => `Accepted ${accepted} evidence-grounded proposal${accepted === 1 ? "" : "s"}; skipped ${skipped} item${skipped === 1 ? "" : "s"} without valid source evidence.`,
    analysisWarning: "Analysis completed with a warning. Check the source and topic fit.",
  },
  uk: {
    verifiedFact: "Підтверджений факт",
    verified: "Підтверджено",
    evidenceConfidence: "Надійність доказу",
    unscored: "Без оцінки",
    reviewBranch: "Гілка сократичного огляду",
    socraticDraft: "Сократичний драфт",
    reviewBadge: "Огляд",
    critiques: "Критикує",
    workspaceAssumptions: "припущення робочого простору",
    mergeRequiresEvidence: "Для злиття потрібна точна цитата з джерела.",
    merging: "Злиття...",
    resolveMerge: "Вирішити й об’єднати",
    dismissReview: "Закрити огляд",
    contextLayer: "Контекстний шар",
    facts: "фактів",
    researchTopic: "Тема дослідження",
    sources: "джерел",
    addPaperSource: "+ Додати paper / джерело",
    manual: "● Ручний",
    review: "◉ Огляд",
    magic: "✦ Магія",
    graph: "Граф",
    tree: "Дерево",
    timeline: "Хронологія",
    compare: "Порівняння",
    workspaceMode: "Режим роботи",
    layoutMode: "Режим структури графа",
    copilotThinking: "Co-Pilot аналізує...",
    runCopilot: "Запустити Context Co-Pilot",
    exportReport: "📥 Експорт у Skill / звіт",
    openIngestion: "Відкрити імпорт дослідження",
    spotlight: "Spotlight-імпорт",
    addEvidenceTo: (title) => `Додати докази до ${title || "теми дослідження"}`,
    startNewTopic: "Почати нову тему дослідження",
    importEvidenceDescription: "Імпортуйте paper, нотатку або dataset. Нові факти з’єднаються з активною темою та релевантними підтвердженими фактами.",
    newTopicDescription: "Сформулюйте конкретне питання та додайте перше джерело. Flow-AI створить окремий кореневий вузол теми.",
    close: "Закрити",
    sessionKey: "Сесійний OpenAI ключ",
    sessionReady: "Сесія готова",
    backendReady: "Backend готовий",
    keyRequired: "Потрібен ключ",
    sessionReadyDescription: "Ключ діє лише в цій сесії браузера й не записується на диск або в browser storage.",
    backendReadyDescription: "Локальний backend-ключ доступний. За бажанням можна ввести сесійний ключ замість нього.",
    keyRequiredDescription: "Вставте ключ для AI-аналізу. Витягування файлів працює і без нього.",
    freshRunHint: "Потрібен чистий прогін? Очистіть попередні теми, факти, зв’язки та історію.",
    clearing: "Очищення...",
    startFresh: "Почати з чистого workspace",
    responseLanguage: "Мова відповіді",
    responseLanguageDescription: "Оберіть мову фактів, питань, гіпотез, підписів зв’язків та інтерфейсу.",
    auto: "Авто",
    sourceLanguage: "Мова джерела",
    english: "Англійська",
    englishOutput: "Відповідь англійською",
    ukrainian: "Українська",
    ukrainianOutput: "Відповідь українською",
    firewallPolicy: "Політика Relation Firewall",
    firewallDescription: "Оберіть, як джерело з невизначеною тематичною відповідністю впливатиме на цю тему.",
    smartFirewall: "Розумний firewall",
    smartFirewallDescription: "Рекомендовано: ізолювати нерелевантні джерела та блокувати слабкі AI-зв’язки.",
    isolateUncertain: "Ізолювати невизначені",
    isolateUncertainDescription: "До теми потрапляють лише джерела з високою відповідністю.",
    importWithoutLinks: "Імпорт без зв’язків",
    importWithoutLinksDescription: "Залишити факти в темі, але вимкнути автоматичні AI-зв’язки.",
    activeQuery: "Активний запит",
    queryPlaceholder: "Що має дослідити Flow-AI?",
    sourcePaperTitle: "Назва джерела / paper",
    sourceTitlePlaceholder: "наприклад, назва paper, dataset або джерела",
    researchDocument: "Документ дослідження",
    documentPlaceholder: "Вставте матеріали, нотатки, транскрипт або докази...",
    importSource: "Імпорт файлу джерела",
    importDescription: "PDF, DOCX, TXT, Markdown, CSV, TSV, JSON або LOG. PDF і DOCX витягуються backend-ом і прив’язуються до доказів.",
    extracting: "Витягування тексту з джерела…",
    pagesReady: (count) => `${count} сторінок PDF готові для мапування доказів.`,
    cancel: "Скасувати",
    analyzing: "Аналіз дослідження...",
    analyzeSource: "Аналізувати джерело → з’єднати факти",
    analyzeResearch: "Аналізувати → створити тему",
    aiInbox: "AI Inbox",
    proposals: "Пропозиції",
    loadingInbox: "Завантаження inbox...",
    noProposalsTopic: "У цій темі ще немає пропозицій. Додайте paper або інше джерело.",
    noProposalsWorkspace: "Inbox порожній. Створіть тему дослідження, щоб почати аналіз.",
    source: "Джерело",
    mergeWorkspace: "Об’єднати з workspace",
    canvasLabel: "Полотно графа знань",
    activeTopic: "Активна тема дослідження",
    selectTopic: "Оберіть тему",
    newTopic: "+ Нова тема",
    addPaper: "+ Додати paper",
    deleting: "Видалення...",
    deleteTopic: "Видалити тему",
    graphIntro: "Новий аналіз створює пропозиції в AI Inbox. Об’єднайте підтверджені факти, потім знайдіть доказові зв’язки або перемкніться в ручний режим.",
    graphFilters: "Фільтри графа та легенда",
    searchFindings: "Пошук фактів…",
    filterBySource: "Фільтр графа за джерелом",
    allSources: "Усі джерела",
    minimumConfidence: "Мінімальна надійність факту",
    anyConfidence: "Будь-яка надійність",
    highConfidence: "Висока надійність · 85%+",
    mediumConfidence: "Середня надійність · 65%+",
    focusedTopic: "Фокус: активна тема",
    focusTopic: "Фокус на активній темі",
    trail: "Траєкторія",
    reviewEdge: "Сократичний огляд",
    selected: "вибрано",
    group: "Групувати",
    graphLegend: "Ціанова лінія = підтверджений AI-зв’язок · жовта пунктирна = потрібен огляд · фіолетова пунктирна = гіпотеза між темами · жовта лінія = сократичний огляд.",
    socraticCopilot: "Сократичний Co-Pilot",
    languageSetInIngestion: "Мова · задається в імпорті",
    magicLayout: "⚡ Магічне компонування",
    downloadReport: "📥 Завантажити звіт",
    discovering: "Пошук доказових зв’язків...",
    discoverConnections: "✦ Знайти зв’язки",
    mergeMore: (count) => `Об’єднайте ще ${count} ${count === 1 ? "пропозицію" : "пропозиції"}, щоб увімкнути пошук AI-зв’язків.`,
    inspector: "Inspector",
    contextGitState: "Стан Context Git",
    draft: "ДРАФТ",
    inbox: "INBOX",
    pendingLink: "ОЧІКУЄ ЗВ’ЯЗОК",
    hypothesis: "ГІПОТЕЗА",
    relation: "ЗВ’ЯЗОК",
    state: "Стан",
    history: "Історія",
    snapshots: "Знімки workspace",
    restoreDescription: "Відновіть попередній підтверджений стан Context Git.",
    revisions: "ревізій",
    firstSnapshot: "Перший знімок з’явиться після аналізу, об’єднання або зміни зв’язку.",
    timestampUnavailable: "час недоступний",
    restoring: "Відновлення...",
    restore: (revision) => `Відновити r${revision}`,
    relationPath: "Шлях зв’язку",
    relationEvidence: "Доказ зв’язку · Strict Evidence Mapping",
    sourceEvidence: "Доказ джерела · Strict Evidence Mapping",
    noEvidence: "Докази відсутні.",
    page: "Сторінка",
    textSource: "Текстове джерело",
    character: "симв",
    firewallReview: "Relation Firewall · Потрібен людський огляд",
    aiSuggestion: "AI-пропозиції залишаються попередніми, доки ви не підтвердите їхнє мапування доказів.",
    pending: "очікує",
    confidence: "Надійність",
    notScored: "без оцінки",
    saving: "Збереження...",
    approveEvidence: "Підтвердити доказовий зв’язок",
    rejectLink: "Відхилити зв’язок",
    aiReasoning: "AI-обґрунтування",
    socraticQuestions: "Сократичні питання",
    proposedHypothesis: "Запропонована гіпотеза",
    noSelection: "Оберіть пропозицію в AI Inbox або підтверджений факт на полотні, щоб переглянути його стан Context Git.",
    rawState: "Стан Pydantic · Raw JSON",
    requiresKey: "Введіть OpenAI API key у Spotlight-імпорті перед AI-аналізом.",
    waitForExtraction: "Дочекайтеся завершення витягування тексту з джерела.",
    fillResearchFields: "Заповніть активний запит і документ дослідження перед аналізом.",
    analysisFailed: "AI-аналіз не виконався.",
    topicDeleted: "Тему дослідження видалено. Попередню ревізію можна відновити в історії.",
    chooseTopic: "Спочатку виберіть тему дослідження для пошуку зв’язків.",
    noKeyForConnections: "Введіть OpenAI API key у Spotlight-імпорті перед пошуком зв’язків.",
    relationApproved: "AI-зв’язок підтверджено як перевірений доказовий зв’язок.",
    relationRejected: "Кандидатний AI-зв’язок відхилено. На графі залишилися інші зв’язки.",
    reviewFailed: "Context Co-Pilot не зміг створити драфт.",
    mergeFailed: "Не вдалося виконати Resolve & Merge.",
    relationUnavailable: "Цей зв’язок більше недоступний. Workspace оновлено.",
    groupSelection: "Виділіть щонайменше дві непогруповані Fact Nodes для Context Layer.",
    uiSaveFailed: "Не вдалося зберегти стан полотна.",
    workspaceLoadFailed: "Не вдалося завантажити стан Context Git.",
    backendUnavailable: "Не вдалося підключитися до локального backend.",
    openAiConfigUnavailable: "Конфігурація OpenAI недоступна.",
    sourceExtractionFailed: "Не вдалося витягнути читабельний текст із джерела.",
    confirmReset: "Очистити всі попередні теми, факти, пропозиції, зв’язки та історію? Це неможливо скасувати.",
    resetFailed: "Не вдалося очистити попередній workspace.",
    chooseTopicToDelete: "Спочатку виберіть тему для видалення.",
    confirmDeleteTopic: (title) => `Видалити “${title}” та всі її джерела, пропозиції, факти й зв’язки? Попередню ревізію можна відновити в історії.`,
    deleteTopicFailed: "Не вдалося видалити тему дослідження.",
    topicFitVerdict: (verdict) => ({ aligned: "відповідає", uncertain: "невизначена", unrelated: "не відповідає" }[verdict] || verdict),
    topicFit: (score, verdict, reason) => {
      const labels = { aligned: "відповідає", uncertain: "невизначена", unrelated: "не відповідає" };
      return `Відповідність темі ${score}/100 · ${labels[verdict] || verdict}. ${reason || ""}`;
    },
    sourceQuarantined: (summary) => `Relation Firewall ізолював це джерело в окремій темі. ${summary}`,
    createdProposals: (count, summary) => `Створено ${count} доказов${count === 1 ? "у пропозицію" : "их пропозицій"} в AI Inbox. ${summary}`,
    noProposalsAnalysis: (summary) => `Аналіз завершено. Для цього джерела не повернуто доказових пропозицій. ${summary}`,
    proposalCommitFailed: "Не вдалося об’єднати пропозицію з Workspace.",
    proposalMerged: "Факт об’єднано з Workspace. Об’єднайте щонайменше два факти в темі, щоб увімкнути пошук AI-зв’язків.",
    noConnections: "Між підтвердженими фактами не знайдено додаткових доказових зв’язків.",
    discoveryCreated: (count) => `Створено ${count} кандидат${count === 1 ? "" : "ів"} доказових AI-зв’язків. Перевірте їх перед підтвердженням.`,
    connectionDiscoveryFailed: "Не вдалося знайти зв’язки між фактами.",
    aiApproveFailed: "Не вдалося підтвердити AI-доказовий зв’язок.",
    aiRejectFailed: "Не вдалося відхилити AI-доказовий зв’язок.",
    manualRelationFailed: "Не вдалося зберегти ручний зв’язок.",
    checkoutFailed: "Не вдалося відновити ревізію.",
    importWithoutLinksNotice: "Джерело імпортовано без автоматичних AI-зв’язків відповідно до політики імпорту.",
    sourceFitNotice: (score, verdict) => `Відповідність джерела ${score}/100 (${verdict}), тому Flow-AI залишив факти окремо й не створив AI-зв’язків.`,
    noEvidenceMappedNotice: "AI повернув пропозиції, але жодна цитата не мапується назад на завантажене джерело. Джерело збережено; спробуйте сфокусованіший уривок або повторіть аналіз.",
    acceptedSkippedNotice: (accepted, skipped) => `Прийнято ${accepted} доказов${accepted === 1 ? "у пропозицію" : "их пропозицій"}; пропущено ${skipped} елемент${skipped === 1 ? "" : "ів"} без валідного доказу з джерела.`,
    analysisWarning: "Аналіз завершено з попередженням. Перевірте джерело та його відповідність темі.",
  },
};

const detectUiLanguage = (value) =>
  /[А-Яа-яІіЇїЄєҐґ]/.test(value || "") ? "uk" : "en";

const resolveUiLanguage = (targetLang, sourceText) => {
  if (targetLang === "uk" || targetLang === "en") return targetLang;
  return sourceText.trim() ? detectUiLanguage(sourceText) : "uk";
};

const RELATION_TYPE_COPY = {
  en: {
    supports: "supports",
    contradicts: "contradicts",
    explains: "explains",
    causes: "causes",
    compares_with: "compares with",
    extends: "extends",
    related: "related",
    "manual link": "manual link",
    "cross-topic hypothesis": "cross-topic hypothesis",
  },
  uk: {
    supports: "підтримує",
    contradicts: "суперечить",
    explains: "пояснює",
    causes: "спричиняє",
    compares_with: "порівнює",
    extends: "розширює",
    related: "пов’язаний",
    "manual link": "ручний зв’язок",
    "cross-topic hypothesis": "гіпотеза між темами",
  },
};

const formatRelationType = (type, language) =>
  RELATION_TYPE_COPY[language]?.[type] || type?.replaceAll("_", " ") || "relation";

const localizeBackendWarning = (warning, topicFit, copy) => {
  if (typeof warning !== "string" || !warning.trim()) return "";

  if (warning.includes("without automatic AI relations")) {
    return copy.importWithoutLinksNotice;
  }

  if (warning.startsWith("Source fit is")) {
    return copy.sourceFitNotice(
      topicFit?.score ?? "—",
      copy.topicFitVerdict(topicFit?.verdict || "unknown")
    );
  }

  if (warning.startsWith("AI returned proposals")) {
    return copy.noEvidenceMappedNotice;
  }

  if (warning.startsWith("Accepted ")) {
    const accepted = Number(warning.match(/^Accepted (\d+)/)?.[1]) || 0;
    const skipped = Number(warning.match(/skipped (\d+)/)?.[1]) || 0;
    return copy.acceptedSkippedNotice(accepted, skipped);
  }

  return copy.analysisWarning;
};

const getLocalizedRequestError = (_requestError, fallback) => fallback;

const RELATION_STATUS_COPY = {
  en: {
    ai: "AI",
    manual: "Manual",
    candidate: "Candidate",
    verified: "Verified",
    hypothesis: "Hypothesis",
  },
  uk: {
    ai: "AI",
    manual: "Ручний",
    candidate: "Кандидат",
    verified: "Підтверджено",
    hypothesis: "Гіпотеза",
  },
};

const formatRelationStatus = (status, language) =>
  RELATION_STATUS_COPY[language]?.[status] || status || "—";

const FactNode = memo(function FactNode({ data, selected }) {
  const confidenceScore = Number(data.finding.confidence_score);
  const hasConfidenceScore = Number.isFinite(confidenceScore);

  return (
    <div
      className={`min-w-60 rounded-xl border bg-slate-900/95 px-4 py-3 shadow-xl shadow-cyan-950/40 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/40"
          : data.isRelationEndpoint
            ? "border-yellow-300 ring-2 ring-yellow-400/25"
          : "border-emerald-500/70 hover:border-cyan-400"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
          {data.copy.verifiedFact}
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          {data.copy.verified}
        </span>
      </div>
      <p className="max-w-64 text-sm font-semibold leading-5 text-slate-100">
        {data.finding.title}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide">
        <span className="text-slate-500">{data.copy.evidenceConfidence}</span>
        <span className={hasConfidenceScore && confidenceScore >= 85 ? "text-emerald-300" : hasConfidenceScore && confidenceScore >= 65 ? "text-cyan-300" : "text-slate-400"}>
          {hasConfidenceScore ? `${confidenceScore}%` : data.copy.unscored}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-emerald-400"
      />
    </div>
  );
});

const DraftNode = memo(function DraftNode({ data, selected }) {
  const mergeBranch = (event) => {
    event.stopPropagation();
    if (!data.canMerge) return;
    data.onMerge();
  };

  const dismissReview = (event) => {
    event.stopPropagation();
    data.onReject();
  };

  return (
    <div
      className={`min-w-80 rounded-xl border-2 border-dashed border-yellow-500 bg-slate-900/95 p-4 shadow-xl shadow-yellow-950/30 transition ${
        selected ? "ring-2 ring-yellow-400/45" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-yellow-400"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-yellow-300">
            {data.copy.reviewBranch}
          </p>
          <h3 className="mt-1 text-sm font-bold text-yellow-100">{data.copy.socraticDraft}</h3>
        </div>
        <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
          {data.copy.reviewBadge}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-5 text-slate-100">
        {data.draft.proposed_hypothesis.title}
      </p>
      <p className="mt-1 text-xs font-medium text-yellow-300/85">
        {data.copy.critiques}: {data.targetTitle || data.copy.workspaceAssumptions}
      </p>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">
        {data.draft.identified_gap}
      </p>

      {!data.canMerge && (
        <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-2 text-xs font-medium text-rose-200">
          {data.copy.mergeRequiresEvidence}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={mergeBranch}
          disabled={data.isMerging || !data.canMerge}
          className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {data.isMerging ? data.copy.merging : data.copy.resolveMerge}
        </button>
        <button
          type="button"
          onClick={dismissReview}
          disabled={data.isMerging}
          className="rounded-lg border border-rose-400/60 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {data.copy.dismissReview}
        </button>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-yellow-400"
      />
    </div>
  );
});

const ContextLayerNode = memo(function ContextLayerNode({ data, selected }) {
  return (
    <div
      className={`h-full w-full rounded-2xl border-2 border-dashed bg-cyan-400/[0.035] p-4 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/30"
          : "border-cyan-500/35"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
            {data.copy.contextLayer}
          </p>
          <p className="mt-1 text-sm font-bold text-cyan-100">{data.label}</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-extrabold text-cyan-300">
          {data.memberCount} {data.copy.facts}
        </span>
      </div>
    </div>
  );
});

const RootNode = memo(function RootNode({ data, selected }) {
  const openIngestion = (event) => {
    event.stopPropagation();
    data.onOpenIngest();
  };

  return (
    <div
      className={`min-w-72 rounded-2xl border bg-slate-900/95 p-4 shadow-2xl shadow-cyan-950/50 transition ${
        selected
          ? "border-cyan-300 ring-2 ring-cyan-400/40"
          : "border-cyan-500/80"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
            {data.copy.researchTopic}
          </p>
          <p className="mt-1 max-w-56 text-sm font-bold leading-5 text-white">
            {data.root.title}
          </p>
          <p className="mt-1 max-w-56 text-xs leading-5 text-slate-400">
            {data.root.query}
          </p>
        </div>
        <span className="rounded-lg bg-cyan-400 px-2 py-1 text-xs font-black text-slate-950">
          F
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1">
          {data.root.source_count || 0} {data.copy.sources}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1">
          {data.root.finding_count || 0} {data.copy.facts}
        </span>
      </div>
      <button
        type="button"
        onClick={openIngestion}
        className="mt-4 rounded-lg border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
      >
        {data.copy.addPaperSource}
      </button>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-950 !bg-cyan-400"
      />
    </div>
  );
});

function TopBar({
  copy,
  activeMode,
  setActiveMode,
  layoutMode,
  setLayoutMode,
  onLayoutChange,
  onOpenIngest,
  onRunCopilot,
  onMagicLayout,
  onDownloadReport,
  isReviewing,
  error,
  notice,
}) {
  const modes = [
    { id: "manual", label: copy.manual },
    { id: "review", label: copy.review },
    { id: "magic", label: copy.magic },
  ];
  const layoutOptions = [
    { id: "graph", label: copy.graph },
    { id: "tree", label: copy.tree },
    { id: "timeline", label: copy.timeline },
    { id: "comparison", label: copy.compare },
  ];

  const handleModeChange = (mode) => {
    setActiveMode(mode);

    if (mode === "review") {
      onRunCopilot();
    }

    if (mode === "magic") {
      onMagicLayout();
    }
  };

  const changeLayout = (mode) => {
    setLayoutMode(mode);
    onLayoutChange(mode);
  };

  return (
    <header className="border-b border-slate-800 bg-[#0B1120]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={onOpenIngest}
          className="flex items-center gap-3 self-start rounded-xl text-left outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400 xl:self-auto"
          aria-label={copy.openIngestion}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">
            F
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-white">
              Flow-AI IDE
            </span>
            <span className="mt-0.5 block text-xs font-medium text-emerald-400">
              • gpt-5.6-luna - Cost-aware workspace sync
            </span>
          </span>
        </button>

        <div className="flex flex-col items-start gap-2 xl:items-center">
          <div
            className="inline-flex rounded-xl border border-slate-700 bg-slate-950/70 p-1"
            role="group"
            aria-label={copy.workspaceMode}
          >
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  activeMode === mode.id
                    ? "border border-slate-600 bg-slate-800 text-cyan-300 shadow-inner"
                    : "border border-transparent text-slate-500 hover:text-slate-200"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div
            className="inline-flex rounded-lg border border-slate-800 bg-slate-950/70 p-0.5"
            role="group"
            aria-label={copy.layoutMode}
          >
            {layoutOptions.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => changeLayout(layout.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                  layoutMode === layout.id
                    ? "bg-cyan-400 text-slate-950"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onRunCopilot}
            disabled={isReviewing}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-950/40 transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
              {isReviewing ? copy.copilotThinking : copy.runCopilot}
          </button>
          <button
            type="button"
            onClick={onDownloadReport}
            className="rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-400/70 hover:text-cyan-300"
          >
            {copy.exportReport}
          </button>
        </div>
      </div>
      {error && (
        <div className="mx-auto mt-3 max-w-[1920px] rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="mx-auto mt-3 max-w-[1920px] rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          {notice}
        </div>
      )}
    </header>
  );
}

function IngestResearchModal({
  copy,
  isOpen,
  ingestMode,
  activeTopicTitle,
  query,
  setQuery,
  text,
  setText,
  sourceTitle,
  setSourceTitle,
  sourcePageCount,
  setSourcePageCount,
  sourcePolicy,
  setSourcePolicy,
  targetLang,
  setTargetLang,
  apiKey,
  setApiKey,
  isOpenAiConfigured,
  error,
  notice,
  isResettingWorkspace,
  onStartFreshWorkspace,
  isExtractingSource,
  onExtractFile,
  isAnalyzing,
  onAnalyze,
  onClose,
  spotlightInputRef,
}) {
  const hasSessionApiKey = Boolean(apiKey.trim());
  const canUseOpenAi = hasSessionApiKey || isOpenAiConfigured;

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSourceTitle(file.name);

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if ([".pdf", ".docx"].includes(extension)) {
      onExtractFile(file);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const uploadedText = typeof reader.result === "string" ? reader.result : "";

      setText((currentText) =>
        currentText.trim()
          ? `${currentText.trim()}\n\n${uploadedText}`
          : uploadedText
      );
      setSourcePageCount(0);
      event.target.value = "";
    };

    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-2 backdrop-blur-md sm:items-center sm:p-4">
      <section
        className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#0f172a]/95 p-4 shadow-2xl shadow-cyan-950/50 sm:max-h-[calc(100dvh-2rem)] sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingest-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-400">
            {copy.spotlight}
            </p>
            <h2 id="ingest-modal-title" className="mt-2 text-2xl font-bold text-white">
              {ingestMode === "source"
                ? copy.addEvidenceTo(activeTopicTitle)
                : copy.startNewTopic}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {ingestMode === "source"
                ? copy.importEvidenceDescription
                : copy.newTopicDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-800 hover:text-slate-100"
            aria-label={copy.close}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mt-4 shrink-0 rounded-xl border border-rose-400/45 bg-rose-950/35 px-3 py-2.5 text-sm font-medium text-rose-100">
            {error}
          </div>
        )}
        {notice && (
          <div className="mt-4 shrink-0 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-3 py-2.5 text-sm font-medium text-cyan-100">
            {notice}
          </div>
        )}

        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 sm:mt-6 sm:pr-2">
          <section className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-300">
                  {copy.sessionKey}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {hasSessionApiKey
                    ? copy.sessionReadyDescription
                    : isOpenAiConfigured
                      ? copy.backendReadyDescription
                      : copy.keyRequiredDescription}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                  canUseOpenAi
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-amber-400/15 text-amber-300"
                }`}
              >
                {hasSessionApiKey
                  ? copy.sessionReady
                  : isOpenAiConfigured
                    ? copy.backendReady
                    : copy.keyRequired}
              </span>
            </div>
            <div className="mt-3">
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck="false"
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
            </div>
            {ingestMode === "topic" && (
              <div className="mt-3 flex flex-col gap-2 border-t border-violet-400/15 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  {copy.freshRunHint}
                </p>
                <button
                  type="button"
                  onClick={onStartFreshWorkspace}
                  disabled={isResettingWorkspace || isAnalyzing}
                  className="shrink-0 rounded-lg border border-rose-400/55 bg-rose-400/10 px-3 py-2 text-xs font-extrabold text-rose-200 transition hover:bg-rose-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResettingWorkspace ? copy.clearing : copy.startFresh}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-cyan-400/35 bg-cyan-400/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                  {copy.responseLanguage}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {copy.responseLanguageDescription}
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/25 bg-slate-950/60 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200">
                {targetLang === "uk" ? copy.ukrainian : targetLang === "en" ? copy.english : copy.auto}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: "auto", label: copy.auto, description: copy.sourceLanguage },
                { value: "en", label: copy.english, description: copy.englishOutput },
                { value: "uk", label: copy.ukrainian, description: copy.ukrainianOutput },
              ].map((language) => (
                <button
                  key={language.value}
                  type="button"
                  onClick={() => setTargetLang(language.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    targetLang === language.value
                      ? "border-cyan-300 bg-cyan-400 text-slate-950"
                      : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-cyan-400/60"
                  }`}
                >
                  <span className="block text-sm font-extrabold">{language.label}</span>
                  <span className={`mt-1 block text-[11px] font-medium ${
                    targetLang === language.value ? "text-slate-800" : "text-slate-500"
                  }`}>
                    {language.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {ingestMode === "source" && (
            <section className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-yellow-300">
                {copy.firewallPolicy}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {copy.firewallDescription}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    value: "smart",
                    label: copy.smartFirewall,
                    description: copy.smartFirewallDescription,
                  },
                  {
                    value: "isolate_uncertain",
                    label: copy.isolateUncertain,
                    description: copy.isolateUncertainDescription,
                  },
                  {
                    value: "import_without_links",
                    label: copy.importWithoutLinks,
                    description: copy.importWithoutLinksDescription,
                  },
                ].map((policy) => (
                  <button
                    key={policy.value}
                    type="button"
                    onClick={() => setSourcePolicy(policy.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      sourcePolicy === policy.value
                        ? "border-yellow-300 bg-yellow-400 text-slate-950"
                        : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-yellow-300/70"
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{policy.label}</span>
                    <span className={`mt-1 block text-[10px] leading-4 ${
                      sourcePolicy === policy.value ? "text-slate-800" : "text-slate-500"
                    }`}>
                      {policy.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              {copy.activeQuery}
            </span>
            <input
              type="text"
              ref={spotlightInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.queryPlaceholder}
              autoFocus
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              {copy.sourcePaperTitle}
            </span>
            <input
              type="text"
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder={copy.sourceTitlePlaceholder}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">
              {copy.researchDocument}
            </span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={copy.documentPlaceholder}
              className="mt-2 h-40 min-h-40 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:h-52 sm:min-h-52"
            />
          </label>

          <label className="block rounded-xl border border-dashed border-cyan-400/35 bg-cyan-400/5 p-3 transition hover:border-cyan-400/70 hover:bg-cyan-400/10">
            <span className="block text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">
              {copy.importSource}
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {copy.importDescription}
            </span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md,.csv,.tsv,.json,.log"
              onChange={handleFileUpload}
              disabled={isAnalyzing || isExtractingSource}
              className="mt-3 block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-400 file:mr-3 file:cursor-pointer file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-950 hover:file:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isExtractingSource && (
              <span className="mt-2 block text-xs font-semibold text-cyan-300">
                {copy.extracting}
              </span>
            )}
            {!isExtractingSource && sourcePageCount > 0 && (
              <span className="mt-2 block text-xs font-semibold text-emerald-300">
                {copy.pagesReady(sourcePageCount)}
              </span>
            )}
          </label>
        </div>

        <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="rounded-xl px-4 py-3 text-sm font-bold text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || isExtractingSource}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing
              ? copy.analyzing
              : ingestMode === "source"
                ? copy.analyzeSource
                : copy.analyzeResearch}
          </button>
        </div>
      </section>
    </div>
  );
}

const nodeTypes = {
  fact: FactNode,
  draft: DraftNode,
  contextLayer: ContextLayerNode,
  root: RootNode,
};

const readError = async (response, fallback) => {
  try {
    await response.json();
    return fallback;
  } catch {
    return fallback;
  }
};

const getEvidence = (item, isDraft) => {
  if (!item) return [];

  if (isDraft && item.proposed_hypothesis?.evidence) {
    return [
      {
        id: "draft-evidence",
        title: "Socratic hypothesis evidence",
        quote: item.proposed_hypothesis.evidence,
      },
    ];
  }

  if (Array.isArray(item.evidence)) {
    return item.evidence.filter((evidence) => evidence?.quote);
  }

  if (typeof item.evidence === "string" && item.evidence) {
    return [{ id: "evidence", title: "Source evidence", quote: item.evidence }];
  }

  return [];
};

const getConfidenceScore = (proposal) => {
  const score = proposal.confidence_score;
  return Number.isFinite(Number(score)) ? Number(score) : "—";
};

const getConfidenceTier = (item) => {
  const score = Number(item?.confidence_score);

  if (!Number.isFinite(score)) {
    return { label: "Unscored", className: "text-slate-500" };
  }
  if (score >= 85) {
    return { label: "High", className: "text-emerald-300" };
  }
  if (score >= 65) {
    return { label: "Medium", className: "text-cyan-300" };
  }
  return { label: "Needs review", className: "text-amber-300" };
};

const GRAPH_UI_STORAGE_KEY = "flow-ai-graph-ui-v5";
const LAYOUT_MODES = ["graph", "tree", "timeline", "comparison"];

const isUsablePosition = (position) =>
  Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y));

const readGraphUiState = () => {
  try {
    const storedValue = window.localStorage.getItem(GRAPH_UI_STORAGE_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : {};

    return {
      nodePositions:
        parsed.nodePositions && typeof parsed.nodePositions === "object"
          ? parsed.nodePositions
          : {},
      manualEdges: Array.isArray(parsed.manualEdges) ? parsed.manualEdges : [],
      contextLayers: Array.isArray(parsed.contextLayers) ? parsed.contextLayers : [],
      layoutMode: LAYOUT_MODES.includes(parsed.layoutMode)
        ? parsed.layoutMode
        : "graph",
    };
  } catch {
    return {
      nodePositions: {},
      manualEdges: [],
      contextLayers: [],
      layoutMode: "graph",
    };
  }
};

const getSavedPosition = (positions, nodeId, fallback) => {
  const storedPosition = positions[nodeId];

  return isUsablePosition(storedPosition)
    ? { x: Number(storedPosition.x), y: Number(storedPosition.y) }
    : fallback;
};

const getAbsoluteNodePosition = (nodes, nodeId) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let current = nodeById.get(nodeId);
  let x = 0;
  let y = 0;
  const visited = new Set();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    x += Number(current.position?.x) || 0;
    y += Number(current.position?.y) || 0;
    current = current.parentId ? nodeById.get(current.parentId) : null;
  }

  return { x, y };
};

const getAbsolutePositionFromChange = (nodes, nodeId, change) => {
  if (isUsablePosition(change.positionAbsolute)) {
    return {
      x: Number(change.positionAbsolute.x),
      y: Number(change.positionAbsolute.y),
    };
  }

  if (!isUsablePosition(change.position)) {
    return null;
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let currentNode = nodeById.get(nodeId);
  let x = Number(change.position.x);
  let y = Number(change.position.y);
  const visited = new Set();

  while (currentNode?.parentId && !visited.has(currentNode.id)) {
    visited.add(currentNode.id);
    const parentNode = nodeById.get(currentNode.parentId);

    if (!parentNode || !isUsablePosition(parentNode.position)) {
      break;
    }

    x += Number(parentNode.position.x);
    y += Number(parentNode.position.y);
    currentNode = parentNode;
  }

  return {
    x: Number.isFinite(x) ? x : 100,
    y: Number.isFinite(y) ? y : 100,
  };
};

const getTopicPosition = (index) => ({
  x: 130 + (index % 2) * 760,
  y: 60 + Math.floor(index / 2) * 620,
});

const getFactPosition = (topicIndex, factIndex) => {
  const topicPosition = getTopicPosition(topicIndex);

  return {
    x: topicPosition.x + (factIndex % 2) * 320,
    y: topicPosition.y + 230 + Math.floor(factIndex / 2) * 210,
  };
};

const getDraftPosition = (topicIndex, findingCount) => {
  const topicPosition = getTopicPosition(topicIndex);

  return {
    x: topicPosition.x + 660,
    y: topicPosition.y + 230 + findingCount * 70,
  };
};

export default function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourcePageCount, setSourcePageCount] = useState(0);
  const [sourcePolicy, setSourcePolicy] = useState("smart");
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestMode, setIngestMode] = useState("topic");
  const [researchTopics, setResearchTopics] = useState([]);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [activeMode, setActiveMode] = useState("review");
  const persistedGraphRef = useRef(readGraphUiState());
  const [layoutMode, setLayoutMode] = useState(
    () => persistedGraphRef.current.layoutMode
  );
  const [proposals, setProposals] = useState([]);
  const [findings, setFindings] = useState([]);
  const [socraticDraft, setSocraticDraft] = useState(null);
  const [draftTargetFindingId, setDraftTargetFindingId] = useState(null);
  const [draftTopicId, setDraftTopicId] = useState(null);
  const [contextLayers, setContextLayers] = useState(
    () => persistedGraphRef.current.contextLayers
  );
  const [nodePositions, setNodePositions] = useState(
    () => persistedGraphRef.current.nodePositions
  );
  const [manualEdges, setManualEdges] = useState(
    () => persistedGraphRef.current.manualEdges
  );
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDraftNodeId, setSelectedDraftNodeId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState("state");
  const [graphSearch, setGraphSearch] = useState("");
  const [graphSourceFilter, setGraphSourceFilter] = useState("all");
  const [minimumConfidence, setMinimumConfidence] = useState("all");
  const [focusActiveTopic, setFocusActiveTopic] = useState(false);
  const [edgeVisibility, setEdgeVisibility] = useState({
    evidenceTrails: true,
    verified: true,
    candidates: true,
    manual: true,
    hypotheses: true,
    drafts: true,
  });
  const [targetLang, setTargetLang] = useState("auto");
  const uiLanguage = useMemo(() => {
    const activeResearchTopic = researchTopics.find(
      (topic) => topic.id === activeTopicId
    );
    const languageSample =
      text.trim() ||
      sourceTitle.trim() ||
      query.trim() ||
      activeResearchTopic?.query ||
      findings[0]?.details ||
      "";

    return resolveUiLanguage(targetLang, languageSample);
  }, [
    activeTopicId,
    findings,
    query,
    researchTopics,
    sourceTitle,
    targetLang,
    text,
  ]);
  const copy = UI_COPY[uiLanguage];
  const [apiKey, setApiKey] = useState("");
  const [isOpenAiConfigured, setIsOpenAiConfigured] = useState(false);
  const [workspaceHistory, setWorkspaceHistory] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingSource, setIsExtractingSource] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDiscoveringConnections, setIsDiscoveringConnections] = useState(false);
  const [reviewingRelationId, setReviewingRelationId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isResettingWorkspace, setIsResettingWorkspace] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);
  const [committingProposalId, setCommittingProposalId] = useState(null);
  const [isMergingDraft, setIsMergingDraft] = useState(false);
  const [notice, setNotice] = useState("");
  const layerCounter = useRef(1);
  const spotlightInputRef = useRef(null);
  const applyMagicLayoutRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const nodesRef = useRef([]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const buildUiState = useCallback(() => {
    const positionsById = { ...nodePositions };
    const currentNodes = nodesRef.current;

    currentNodes.forEach((node) => {
      if (node.type === "contextLayer") return;

      const absolute = getAbsoluteNodePosition(currentNodes, node.id);

      if (isUsablePosition(absolute)) {
        positionsById[node.id] = absolute;
      }
    });

    return {
      mode: layoutMode,
      selected_node_id: selectedNodeIds?.[0] || null,
      node_positions: Object.entries(positionsById)
        .filter(([, position]) => isUsablePosition(position))
        .map(([id, position]) => ({
          id,
          x: Number(position.x),
          y: Number(position.y),
        })),
      manual_edges: manualEdges,
      context_layers: contextLayers,
    };
  }, [contextLayers, layoutMode, manualEdges, nodePositions, selectedNodeIds]);

  const applyRestoredUiState = useCallback(
    (uiState) => {
      const restored = {};

      if (Array.isArray(uiState?.node_positions)) {
        uiState.node_positions.forEach((position) => {
          if (position?.id && isUsablePosition(position)) {
            restored[position.id] = {
              x: Number(position.x),
              y: Number(position.y),
            };
          }
        });
      }

      const restoredManualEdges = Array.isArray(uiState?.manual_edges)
        ? uiState.manual_edges
        : [];
      const restoredContextLayers = Array.isArray(uiState?.context_layers)
        ? uiState.context_layers
        : [];
      const restoredLayoutMode = LAYOUT_MODES.includes(uiState?.mode)
        ? uiState.mode
        : "graph";

      setNodePositions(restored);
      setManualEdges(restoredManualEdges);
      setContextLayers(restoredContextLayers);
      setLayoutMode(restoredLayoutMode);
      setSelectedNodeIds(
        uiState?.selected_node_id ? [uiState.selected_node_id] : []
      );

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const restoredPosition = restored[node.id];

          if (
            !restoredPosition ||
            node.type === "contextLayer" ||
            node.parentId
          ) {
            return node;
          }

          return { ...node, position: restoredPosition };
        })
      );
    },
    [setNodePositions, setNodes]
  );

  const persistUiState = useCallback(async (uiStateOverride) => {
    const response = await fetch(`${API_URL}/api/workspace/ui-state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ui_state: uiStateOverride || buildUiState() }),
    });

    if (!response.ok) {
      throw new Error(
        await readError(response, copy.uiSaveFailed)
      );
    }

    return response.json();
  }, [buildUiState, copy]);

  const loadWorkspace = useCallback(async () => {
    try {
      setIsLoadingWorkspace(true);
      setError("");

      const response = await fetch(`${API_URL}/api/workspace`);

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.workspaceLoadFailed)
        );
      }

      const workspace = await response.json();
      if (workspace?.ui_state) {
        applyRestoredUiState(workspace.ui_state);
      }
      setProposals(Array.isArray(workspace.proposals) ? workspace.proposals : []);
      setFindings(Array.isArray(workspace.findings) ? workspace.findings : []);
      setWorkspaceHistory(Array.isArray(workspace.history) ? workspace.history : []);
      const nextTopics = Array.isArray(workspace.topics) ? workspace.topics : [];
      setResearchTopics(nextTopics);
      setActiveTopicId((currentTopicId) =>
        nextTopics.some((topic) => topic.id === currentTopicId)
          ? currentTopicId
          : nextTopics[0]?.id || null
      );
      return workspace;
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.backendUnavailable)
      );
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [applyRestoredUiState, copy]);

  const loadOpenAiConfiguration = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/openai`);

      if (!response.ok) {
        throw new Error(copy.openAiConfigUnavailable);
      }

      const configuration = await response.json();
      setIsOpenAiConfigured(Boolean(configuration?.configured));
    } catch {
      setIsOpenAiConfigured(false);
    }
  }, [copy]);

  useEffect(() => {
    void loadWorkspace();
    void loadOpenAiConfiguration();
  }, [loadOpenAiConfiguration, loadWorkspace]);

  useEffect(() => {
    if (!isLoadingWorkspace && researchTopics.length === 0 && findings.length === 0) {
      setIngestMode("topic");
      setIsIngestModalOpen(true);
    }
  }, [findings.length, isLoadingWorkspace, researchTopics.length]);

  useEffect(() => {
    window.localStorage.setItem(
      GRAPH_UI_STORAGE_KEY,
      JSON.stringify({
        nodePositions,
        manualEdges,
        contextLayers,
        layoutMode,
      })
    );
  }, [contextLayers, layoutMode, manualEdges, nodePositions]);

  const activeTopic = useMemo(
    () => researchTopics.find((topic) => topic.id === activeTopicId) || null,
    [activeTopicId, researchTopics]
  );

  const graphSources = useMemo(() => {
    const uniqueSources = new Map();

    findings.forEach((finding) => {
      if (!finding.source_id) return;
      uniqueSources.set(finding.source_id, finding.source_title || "Research document");
    });

    return [...uniqueSources.entries()].map(([id, title]) => ({ id, title }));
  }, [findings]);

  const visibleFindings = useMemo(() => {
    const searchQuery = graphSearch.trim().toLowerCase();
    const minimumScore = minimumConfidence === "all" ? null : Number(minimumConfidence);

    return findings.filter((finding) => {
      if (focusActiveTopic && activeTopicId && finding.topic_id !== activeTopicId) {
        return false;
      }
      if (graphSourceFilter !== "all" && finding.source_id !== graphSourceFilter) {
        return false;
      }
      if (
        minimumScore !== null &&
        (!Number.isFinite(Number(finding.confidence_score)) ||
          Number(finding.confidence_score) < minimumScore)
      ) {
        return false;
      }
      if (!searchQuery) return true;

      return `${finding.title || ""} ${finding.details || ""}`
        .toLowerCase()
        .includes(searchQuery);
    });
  }, [activeTopicId, findings, focusActiveTopic, graphSearch, graphSourceFilter, minimumConfidence]);

  const visibleTopicIds = useMemo(
    () =>
      new Set(
        (focusActiveTopic && activeTopicId
          ? [activeTopicId]
          : researchTopics.map((topic) => topic.id)
        ).filter(Boolean)
      ),
    [activeTopicId, focusActiveTopic, researchTopics]
  );

  const visibleTopics = useMemo(
    () => researchTopics.filter((topic) => visibleTopicIds.has(topic.id)),
    [researchTopics, visibleTopicIds]
  );

  const visibleFindingIds = useMemo(
    () => new Set(visibleFindings.map((finding) => finding.id)),
    [visibleFindings]
  );

  const toggleEdgeVisibility = useCallback((key) => {
    setEdgeVisibility((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const openNewTopic = useCallback(() => {
    setIngestMode("topic");
    setActiveTopicId(null);
    setQuery("");
    setText("");
    setSourceTitle("");
    setSourcePageCount(0);
    setSourcePolicy("smart");
    setError("");
    setIsIngestModalOpen(true);
  }, []);

  const openSourceIngestion = useCallback(
    (topicId = activeTopicId) => {
      const topic = researchTopics.find((item) => item.id === topicId);

      if (!topic) {
        openNewTopic();
        return;
      }

      setIngestMode("source");
      setActiveTopicId(topic.id);
      setQuery(topic.query || topic.title);
      setText("");
      setSourceTitle("");
      setSourcePageCount(0);
      setSourcePolicy("smart");
      setError("");
      setIsIngestModalOpen(true);
    },
    [activeTopicId, openNewTopic, researchTopics]
  );

  const handleSourceExtraction = useCallback(async (file) => {
    try {
      setIsExtractingSource(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/sources/extract`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.sourceExtractionFailed)
        );
      }

      const extractedSource = await response.json();
      setText((currentText) =>
        currentText.trim()
          ? `${currentText.trim()}\n\n${extractedSource.text}`
          : extractedSource.text
      );
      setSourceTitle(extractedSource.source_title || file.name);
      setSourcePageCount(Number(extractedSource.page_count) || 0);
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.sourceExtractionFailed)
      );
    } finally {
      setIsExtractingSource(false);
    }
  }, [copy]);

  const handleStartFreshWorkspace = useCallback(async () => {
    const shouldReset = window.confirm(
      copy.confirmReset
    );

    if (!shouldReset) return;

    try {
      setIsResettingWorkspace(true);
      setError("");
      setNotice("");

      const response = await fetch(`${API_URL}/api/workspace/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.resetFailed)
        );
      }

      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      setDraftTopicId(null);
      setSelectedItem(null);
      setSelectedNodeIds([]);
      setSelectedDraftNodeId(null);
      setActiveTopicId(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.resetFailed)
      );
    } finally {
      setIsResettingWorkspace(false);
    }
  }, [copy, loadWorkspace]);

  const handleDeleteActiveTopic = useCallback(async () => {
    if (!activeTopic) {
      setError(copy.chooseTopicToDelete);
      return;
    }

    const shouldDelete = window.confirm(
      copy.confirmDeleteTopic(activeTopic.title)
    );

    if (!shouldDelete) return;

    try {
      setIsDeletingTopic(true);
      setError("");
      setNotice("");
      await persistUiState();

      const response = await fetch(
        `${API_URL}/api/topics/${encodeURIComponent(activeTopic.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(await readError(response, copy.deleteTopicFailed));
      }

      setSelectedItem(null);
      setSelectedNodeIds([]);
      setSelectedDraftNodeId(null);
      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      setDraftTopicId(null);
      setActiveTopicId(null);
      await loadWorkspace();
      setNotice(copy.topicDeleted);
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.deleteTopicFailed)
      );
    } finally {
      setIsDeletingTopic(false);
    }
  }, [activeTopic, copy, loadWorkspace, persistUiState]);

  const handleResearch = useCallback(async () => {
    const sessionApiKey = apiKey.trim();

    if (!sessionApiKey && !isOpenAiConfigured) {
      setError(copy.requiresKey);
      return;
    }

    if (isExtractingSource) {
      setError(copy.waitForExtraction);
      return;
    }

    if (!query.trim() || !text.trim()) {
      setError(copy.fillResearchFields);
      return;
    }

    try {
      setIsAnalyzing(true);
      setError("");
      setNotice("");
      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      await persistUiState();

      const response = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          text: text.trim(),
          target_lang: targetLang,
          topic_id: ingestMode === "source" ? activeTopicId : null,
          topic_title: ingestMode === "topic" ? query.trim() : null,
          source_title: sourceTitle.trim() || "Research document",
          source_page_count: sourcePageCount,
          source_policy: sourcePolicy,
          api_key: sessionApiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, copy.analysisFailed));
      }

      const data = await response.json();
      const acceptedProposalCount = Array.isArray(data?.new_proposals)
        ? data.new_proposals.length
        : 0;
      const suggestedLayout =
        ["graph", "tree", "timeline", "comparison"].includes(
          data?.suggested_layout
        )
          ? data.suggested_layout
          : null;

      if (data?.topic?.id) {
        setActiveTopicId(data.topic.id);
        setResearchTopics((currentTopics) => {
          const existingTopicIndex = currentTopics.findIndex(
            (topic) => topic.id === data.topic.id
          );

          if (existingTopicIndex < 0) return [...currentTopics, data.topic];

          return currentTopics.map((topic) =>
            topic.id === data.topic.id ? data.topic : topic
          );
        });
      }

      setIsIngestModalOpen(false);
      setText("");
      setSourceTitle("");
      setSourcePageCount(0);
      const topicFit = data?.topic_fit;
      const topicFitSummary = topicFit
        ? copy.topicFit(topicFit.score, topicFit.verdict, topicFit.reason)
        : "";

      setNotice(
        data?.source_quarantined
          ? copy.sourceQuarantined(topicFitSummary)
          : data?.warning
            ? `${localizeBackendWarning(data.warning, topicFit, copy)}${topicFitSummary ? ` ${topicFitSummary}` : ""}`
            : acceptedProposalCount > 0
              ? copy.createdProposals(acceptedProposalCount, topicFitSummary)
              : copy.noProposalsAnalysis(topicFitSummary)
      );

      await loadWorkspace();

      if (suggestedLayout) {
        setLayoutMode(suggestedLayout);
        requestAnimationFrame(() => applyMagicLayoutRef.current?.(suggestedLayout));
      }
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.analysisFailed)
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    activeTopicId,
    apiKey,
    ingestMode,
    isExtractingSource,
    isOpenAiConfigured,
    loadWorkspace,
    persistUiState,
    query,
    sourcePageCount,
    sourcePolicy,
    sourceTitle,
    targetLang,
    text,
    copy,
  ]);

  const handleProposalCommit = async (proposalId) => {
    try {
      setCommittingProposalId(proposalId);
      setError("");
      setNotice("");
      await persistUiState();

      const response = await fetch(
        `${API_URL}/api/proposals/${encodeURIComponent(proposalId)}/commit`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.proposalCommitFailed)
        );
      }

      setSelectedItem(null);
      await loadWorkspace();
      setNotice(copy.proposalMerged);
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.proposalCommitFailed)
      );
    } finally {
      setCommittingProposalId(null);
    }
  };

  const handleDiscoverConnections = useCallback(async () => {
    if (!activeTopicId) {
      setError(copy.chooseTopic);
      return;
    }

    const sessionApiKey = apiKey.trim();
    if (!sessionApiKey && !isOpenAiConfigured) {
      setError(copy.noKeyForConnections);
      return;
    }

    const activeTopicFindingCount = findings.filter(
      (finding) => finding.topic_id === activeTopicId
    ).length;
    if (activeTopicFindingCount < 2) {
      setNotice(copy.mergeMore(2 - activeTopicFindingCount));
      return;
    }

    try {
      setIsDiscoveringConnections(true);
      setError("");
      setNotice("");
      await persistUiState();
      const response = await fetch(
        `${API_URL}/api/topics/${encodeURIComponent(activeTopicId)}/relations/discover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_lang: targetLang,
            api_key: sessionApiKey || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.connectionDiscoveryFailed)
        );
      }

      const discovery = await response.json();
      const workspace = await loadWorkspace();
      const firstCandidateSourceId = discovery?.relations?.[0]?.source_id;
      const candidateSource = Array.isArray(workspace?.findings)
        ? workspace.findings.find((finding) => finding.id === firstCandidateSourceId)
        : null;

      if (candidateSource) {
        setSelectedItem({ kind: "finding", item: candidateSource });
        setInspectorTab("state");
      }
      setNotice(
        discovery?.created > 0
          ? copy.discoveryCreated(discovery.created)
          : copy.noConnections
      );
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.connectionDiscoveryFailed)
      );
    } finally {
      setIsDiscoveringConnections(false);
    }
  }, [activeTopicId, apiKey, copy, findings, isOpenAiConfigured, loadWorkspace, persistUiState, targetLang]);

  const handleApproveRelation = useCallback(
    async (sourceFindingId, relationId) => {
      try {
        setReviewingRelationId(relationId);
        setError("");
        await persistUiState();

        const response = await fetch(
          `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations/${encodeURIComponent(relationId)}/approve`,
          { method: "POST", headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          throw new Error(await readError(response, copy.aiApproveFailed));
        }

        setSelectedItem(null);
        await loadWorkspace();
        setNotice(copy.relationApproved);
      } catch (requestError) {
        setError(
          getLocalizedRequestError(requestError, copy.aiApproveFailed)
        );
      } finally {
        setReviewingRelationId(null);
      }
    },
    [copy, loadWorkspace, persistUiState]
  );

  const handleRejectRelation = useCallback(
    async (sourceFindingId, relationId) => {
      try {
        setReviewingRelationId(relationId);
        setError("");
        await persistUiState();

        const response = await fetch(
          `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations/${encodeURIComponent(relationId)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error(await readError(response, copy.aiRejectFailed));
        }

        setSelectedItem(null);
        await loadWorkspace();
        setNotice(copy.relationRejected);
      } catch (requestError) {
        setError(
          getLocalizedRequestError(requestError, copy.aiRejectFailed)
        );
      } finally {
        setReviewingRelationId(null);
      }
    },
    [copy, loadWorkspace, persistUiState]
  );

  const handleSocraticReview = useCallback(async () => {
    const selectedNode = nodes.find(
      (node) => node.selected && node.type === "fact"
    );
    const sessionApiKey = apiKey.trim();

    if (!sessionApiKey && !isOpenAiConfigured) {
      setError(copy.requiresKey);
      return;
    }

    try {
      setIsReviewing(true);
      setError("");

      const response = await fetch(`${API_URL}/api/socratic/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_lang: targetLang,
          fact_id: selectedNode?.data?.finding?.id,
          fact_text:
            selectedNode?.data?.finding?.details ||
            selectedNode?.data?.label ||
            undefined,
          topic_id: selectedNode?.data?.finding?.topic_id || activeTopicId,
          api_key: sessionApiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.reviewFailed)
        );
      }

      const draft = await response.json();

      setDraftTargetFindingId(selectedNode?.id || null);
      setDraftTopicId(selectedNode?.data?.finding?.topic_id || activeTopicId || null);
      setSocraticDraft(draft);
      setSelectedItem({ kind: "draft", item: draft });
      setInspectorTab("state");
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.reviewFailed)
      );
    } finally {
      setIsReviewing(false);
    }
  }, [activeTopicId, apiKey, copy, isOpenAiConfigured, nodes, targetLang]);

  const handleSocraticCommit = useCallback(async () => {
    if (!socraticDraft?.proposed_hypothesis) return;

    try {
      setIsMergingDraft(true);
      setError("");
      await persistUiState();
      const response = await fetch(`${API_URL}/api/socratic/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...socraticDraft.proposed_hypothesis,
          topic_id: draftTopicId || activeTopicId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, copy.mergeFailed)
        );
      }

      setSocraticDraft(null);
      setDraftTargetFindingId(null);
      setDraftTopicId(null);
      setSelectedItem(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(
        getLocalizedRequestError(requestError, copy.mergeFailed)
      );
    } finally {
      setIsMergingDraft(false);
    }
  }, [
    activeTopicId,
    copy,
    draftTopicId,
    loadWorkspace,
    persistUiState,
    socraticDraft,
  ]);

  const handleRejectDraft = useCallback(() => {
    setSocraticDraft(null);
    setDraftTargetFindingId(null);
    setDraftTopicId(null);
    setSelectedDraftNodeId(null);
    setSelectedItem((current) => (current?.kind === "draft" ? null : current));
  }, []);

  useEffect(() => {
    const topicIndexById = new Map(
      researchTopics.map((topic, index) => [topic.id, index])
    );
    const topicFlowNodes = visibleTopics.map((topic) => {
      const index = topicIndexById.get(topic.id) ?? 0;

      return {
      id: `topic-${topic.id}`,
      type: "root",
      position: getSavedPosition(
        nodePositions,
        `topic-${topic.id}`,
        getTopicPosition(index)
      ),
      data: {
        root: topic,
        copy,
        onOpenIngest: () => openSourceIngestion(topic.id),
      },
      zIndex: 3,
      };
    });

    const factCountByTopic = new Map();
    const baseFactNodes = visibleFindings.map((finding, index) => {
      const topicIndex = topicIndexById.get(finding.topic_id) ?? 0;
      const factIndex = factCountByTopic.get(finding.topic_id) ?? index;
      factCountByTopic.set(finding.topic_id, factIndex + 1);
      const nodeId = `finding-${finding.id}`;

      return {
        id: nodeId,
        type: "fact",
        position: getSavedPosition(
          nodePositions,
          nodeId,
          getFactPosition(topicIndex, factIndex)
        ),
        data: {
          finding,
          copy,
          label: finding.details,
          isRelationEndpoint:
            selectedItem?.kind === "relation" &&
            (selectedItem.item.source_finding_id === finding.id ||
              selectedItem.item.target_id === finding.id),
        },
        zIndex: 1,
      };
    });

    const layersWithMembers = contextLayers
      .map((layer) => ({
        ...layer,
        members: baseFactNodes.filter((node) => layer.memberIds.includes(node.id)),
      }))
      .filter((layer) => layer.members.length > 1);

    const membership = new Map();
    const layerNodes = layersWithMembers.map((layer) => {
      const xCoordinates = layer.members.map((node) => node.position.x);
      const yCoordinates = layer.members.map((node) => node.position.y);
      const left = Math.min(...xCoordinates) - 36;
      const top = Math.min(...yCoordinates) - 58;
      const right = Math.max(...xCoordinates) + 270;
      const bottom = Math.max(...yCoordinates) + 150;
      const frame = {
        id: layer.id,
        position: { x: left, y: top },
        width: right - left,
        height: bottom - top,
      };

      layer.members.forEach((node) => membership.set(node.id, frame));

      return {
        id: layer.id,
        type: "contextLayer",
        draggable: false,
        position: frame.position,
        style: { width: frame.width, height: frame.height },
        data: { label: layer.label, memberCount: layer.members.length, copy },
        zIndex: 0,
      };
    });

    const factNodes = baseFactNodes.map((node) => {
      const parent = membership.get(node.id);

      if (!parent) return node;

      return {
        ...node,
        parentId: parent.id,
        extent: "parent",
        position: {
          x: node.position.x - parent.position.x,
          y: node.position.y - parent.position.y,
        },
      };
    });

    const draftTarget = findings.find(
      (finding) => `finding-${finding.id}` === draftTargetFindingId
    );
    const draftTopicIndex = topicIndexById.get(draftTarget?.topic_id || activeTopicId) ?? 0;
    const draftNode = socraticDraft && edgeVisibility.drafts &&
      (!draftTargetFindingId || visibleFindingIds.has(draftTarget?.id))
      ? [
          {
            id: "socratic-draft",
            type: "draft",
            position: getSavedPosition(
              nodePositions,
              "socratic-draft",
              getDraftPosition(draftTopicIndex, findings.length)
            ),
            data: {
              draft: socraticDraft,
              copy,
              targetTitle: draftTarget?.title,
              onMerge: handleSocraticCommit,
              onReject: handleRejectDraft,
              isMerging: isMergingDraft,
              canMerge: Boolean(
                socraticDraft.proposed_hypothesis?.evidence?.trim()
              ),
            },
            zIndex: 2,
          },
        ]
      : [];

    setNodes([...topicFlowNodes, ...layerNodes, ...factNodes, ...draftNode]);
  }, [
    activeTopicId,
    contextLayers,
    copy,
    draftTargetFindingId,
    edgeVisibility.drafts,
    findings,
    handleRejectDraft,
    handleSocraticCommit,
    isMergingDraft,
    nodePositions,
    openSourceIngestion,
    researchTopics,
    selectedItem,
    setNodes,
    socraticDraft,
    visibleFindingIds,
    visibleFindings,
    visibleTopics,
  ]);

  useEffect(() => {
    const findingIds = new Set(visibleFindings.map((finding) => finding.id));
    const findingNodeIds = new Set(visibleFindings.map((finding) => `finding-${finding.id}`));
    const topicNodeIds = new Set(visibleTopics.map((topic) => `topic-${topic.id}`));
    const topicEdges = edgeVisibility.evidenceTrails
      ? visibleFindings
      .filter(
        (finding) =>
          finding.topic_id && topicNodeIds.has(`topic-${finding.topic_id}`)
      )
      .map((finding) => ({
        id: `topic-${finding.topic_id}-finding-${finding.id}`,
        source: `topic-${finding.topic_id}`,
        target: `finding-${finding.id}`,
        label: "evidence trail",
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
        style: { stroke: "#38bdf8", strokeWidth: 1.4, opacity: 0.82 },
        labelStyle: { fill: "#7dd3fc", fontSize: 10 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
        data: { system: "topic" },
      }))
      : [];
    const relationEdges = visibleFindings.flatMap((finding) =>
      (finding.relations || [])
        .filter((relation) => findingIds.has(relation.target_id))
        .filter((relation) => {
          if (relation.status === "candidate") return edgeVisibility.candidates;
          if (relation.status === "hypothesis") return edgeVisibility.hypotheses;
          if (relation.origin === "manual") return edgeVisibility.manual;
          return edgeVisibility.verified;
        })
        .map((relation) => {
          const isManualRelation = relation.origin === "manual";
          const isCandidateRelation = relation.status === "candidate";
          const isCrossTopicHypothesis = relation.status === "hypothesis";
          const edgeColor = isCandidateRelation
            ? "#facc15"
            : isManualRelation
              ? "#a78bfa"
              : "#22d3ee";
          const relationId = relation.id || `${relation.target_id}-${relation.type}`;
          const displayLabel = isCandidateRelation
            ? `${copy.review} · ${formatRelationType(relation.type, uiLanguage)}${relation.confidence_score ? ` · ${relation.confidence_score}%` : ""}`
            : isCrossTopicHypothesis
              ? formatRelationType("cross-topic hypothesis", uiLanguage)
              : relation.confidence_score
                ? `${formatRelationType(relation.type, uiLanguage)} · ${relation.confidence_score}%`
                : formatRelationType(relation.type, uiLanguage);

          return {
            id: `relation-${finding.id}-${relationId}`,
            source: `finding-${finding.id}`,
            target: `finding-${relation.target_id}`,
            label: displayLabel,
            type: "smoothstep",
            animated: isCandidateRelation,
            deletable: isManualRelation,
            markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
            style: {
              stroke: edgeColor,
              strokeWidth: isCandidateRelation || isManualRelation ? 2 : 1.5,
              ...(isCandidateRelation || isCrossTopicHypothesis
                ? { strokeDasharray: "5, 5" }
                : {}),
            },
            labelStyle: {
              fill: isCandidateRelation
                ? "#fde047"
                : isManualRelation
                  ? "#c4b5fd"
                  : "#94a3b8",
              fontSize: 11,
            },
            labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
            data: {
              system: isCandidateRelation
                ? "candidate-relation"
                : isManualRelation
                  ? "manual-persisted"
                  : "relation",
              sourceFindingId: finding.id,
              targetFindingId: relation.target_id,
              relationId,
              relationStatus: relation.status || "verified",
              relationOrigin: relation.origin || "ai",
            },
          };
        }));

    const reviewEdge =
      edgeVisibility.drafts &&
      socraticDraft && draftTargetFindingId && findingNodeIds.has(draftTargetFindingId)
        ? [
            {
              id: `socratic-review-${draftTargetFindingId}`,
              source: "socratic-draft",
              target: draftTargetFindingId,
              label: copy.reviewEdge,
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
              style: {
                stroke: "#f59e0b",
                strokeWidth: 2,
                strokeDasharray: "5, 5",
              },
              labelStyle: { fill: "#fcd34d", fontSize: 11, fontWeight: 700 },
              labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
              data: { system: "socratic-review" },
            },
          ]
        : [];

    const validNodeIds = new Set([
      ...visibleTopics.map((topic) => `topic-${topic.id}`),
      ...visibleFindings.map((finding) => `finding-${finding.id}`),
      ...(socraticDraft && edgeVisibility.drafts ? ["socratic-draft"] : []),
    ]);

    setEdges(() => {
      const validManualEdges = edgeVisibility.manual
        ? manualEdges.filter(
          (edge) =>
          validNodeIds.has(edge.source) &&
          validNodeIds.has(edge.target)
        )
        : [];

      return [...topicEdges, ...relationEdges, ...reviewEdge, ...validManualEdges];
    });
  }, [
    draftTargetFindingId,
    edgeVisibility,
    manualEdges,
    setEdges,
    socraticDraft,
    visibleFindings,
    visibleTopics,
    uiLanguage,
    copy,
  ]);

  const handleNodesChange = useCallback(
    (changes) => {
      const nodeById = new Map(nodes.map((node) => [node.id, node]));

      onNodesChange(
        changes.filter((change) => {
          const changedNode = nodeById.get(change.id);

          return !(
            change.type === "position" &&
            changedNode?.type === "contextLayer"
          );
        })
      );

      setNodePositions((currentPositions) => {
        let hasPositionChange = false;
        const nextPositions = { ...currentPositions };

        changes.forEach((change) => {
          if (change.type !== "position") {
            return;
          }

          const changedNode = nodeById.get(change.id);

          if (!changedNode || changedNode.type === "contextLayer") {
            return;
          }

          const absolutePosition = getAbsolutePositionFromChange(
            nodes,
            change.id,
            change
          );

          if (!absolutePosition) {
            return;
          }

          nextPositions[change.id] = absolutePosition;
          hasPositionChange = true;
        });

        return hasPositionChange ? nextPositions : currentPositions;
      });
    },
    [nodes, onNodesChange]
  );

  const removePersistedManualRelation = useCallback(
    async (sourceFindingId, relationId) => {
      try {
        setError("");
        await persistUiState();
        const response = await fetch(
          `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations/${encodeURIComponent(relationId)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error(
            await readError(response, copy.manualRelationFailed)
          );
        }

        await loadWorkspace();
      } catch (requestError) {
        setError(
          getLocalizedRequestError(requestError, copy.manualRelationFailed)
        );
        await loadWorkspace();
      }
    },
    [copy, loadWorkspace, persistUiState]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      const removedEdgeIds = changes
        .filter((change) => change.type === "remove")
        .map((change) => change.id);

      if (removedEdgeIds.length > 0) {
        setManualEdges((currentEdges) =>
          currentEdges.filter((edge) => !removedEdgeIds.includes(edge.id))
        );

        edges
          .filter(
            (edge) =>
              removedEdgeIds.includes(edge.id) &&
              edge.data?.system === "manual-persisted"
          )
          .forEach((edge) => {
            void removePersistedManualRelation(
              edge.data.sourceFindingId,
              edge.data.relationId
            );
          });
      }
    },
    [edges, onEdgesChange, removePersistedManualRelation]
  );

  const handleConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      const duplicateExists = manualEdges.some(
        (edge) =>
          edge.source === connection.source && edge.target === connection.target
      );

      if (duplicateExists) {
        return;
      }

      const sourceFindingId = connection.source.startsWith("finding-")
        ? connection.source.replace("finding-", "")
        : null;
      const targetFindingId = connection.target.startsWith("finding-")
        ? connection.target.replace("finding-", "")
        : null;
      const sourceFinding = sourceFindingId
        ? findings.find((finding) => finding.id === sourceFindingId)
        : null;
      const targetFinding = targetFindingId
        ? findings.find((finding) => finding.id === targetFindingId)
        : null;
      const isCrossTopicHypothesis = Boolean(
        sourceFinding &&
          targetFinding &&
          sourceFinding.topic_id !== targetFinding.topic_id
      );
      const edgeId = `manual-${connection.source}-${connection.target}-${Date.now()}`;
      const nextManualEdge = {
        ...connection,
        id: edgeId,
        type: "smoothstep",
        label: formatRelationType(
          isCrossTopicHypothesis ? "cross-topic hypothesis" : "manual link",
          uiLanguage
        ),
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
        style: {
          stroke: "#a78bfa",
          strokeWidth: 2,
          ...(isCrossTopicHypothesis ? { strokeDasharray: "5, 5" } : {}),
        },
        labelStyle: { fill: "#c4b5fd", fontSize: 11 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.92 },
        data: {
          system: "manual",
          relationStatus: isCrossTopicHypothesis ? "hypothesis" : "verified",
        },
      };

      const nextManualEdges = addEdge(nextManualEdge, manualEdges);
      setManualEdges(nextManualEdges);

      const nextUiState = {
        ...buildUiState(),
        manual_edges: nextManualEdges,
      };

      if (
        connection.source.startsWith("finding-") &&
        connection.target.startsWith("finding-")
      ) {
        void (async () => {
          try {
            await persistUiState(nextUiState);
            const response = await fetch(
              `${API_URL}/api/findings/${encodeURIComponent(sourceFindingId)}/relations`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  target_id: targetFindingId,
                  type: isCrossTopicHypothesis
                    ? "cross-topic hypothesis"
                    : "manual link",
                }),
              }
            );

            if (!response.ok) {
              throw new Error(
                await readError(response, copy.manualRelationFailed)
              );
            }

            setManualEdges((currentEdges) =>
              currentEdges.filter((edge) => edge.id !== edgeId)
            );
            await loadWorkspace();
          } catch (requestError) {
            setError(
              getLocalizedRequestError(requestError, copy.manualRelationFailed)
            );
          }
        })();
      } else {
        void persistUiState(nextUiState).catch((requestError) => {
          setError(
            getLocalizedRequestError(requestError, copy.manualRelationFailed)
          );
        });
      }
    },
    [buildUiState, copy, findings, loadWorkspace, manualEdges, persistUiState, uiLanguage]
  );

  const handleNodeClick = useCallback((event, node) => {
    event.stopPropagation();

    if (node.type === "root") {
      setActiveTopicId(node.data.root.id);
      openSourceIngestion(node.data.root.id);
      return;
    }

    if (node.type === "draft") {
      setSelectedItem({ kind: "draft", item: node.data.draft });
      setSelectedDraftNodeId(node.id);
      setInspectorTab("state");
      return;
    }

    if (node.type === "fact") {
      setSelectedItem({ kind: "finding", item: node.data.finding });
      setSelectedDraftNodeId(null);
      setInspectorTab("state");
    }
  }, [openSourceIngestion]);

  const handleEdgeClick = useCallback(
    (event, edge) => {
      event.stopPropagation();
      const relationId = edge.data?.relationId;
      const sourceFindingId = edge.data?.sourceFindingId;

      if (!relationId || !sourceFindingId) {
        return;
      }

      const sourceFinding = findings.find(
        (finding) => finding.id === sourceFindingId
      );
      const relation = sourceFinding?.relations?.find(
        (item) => item.id === relationId
      );

      if (!sourceFinding || !relation) {
        setError(copy.relationUnavailable);
        return;
      }

      const targetFinding = findings.find(
        (finding) => finding.id === relation.target_id
      );
      setSelectedItem({
        kind: "relation",
        item: {
          ...relation,
          source_finding_id: sourceFinding.id,
          source_title: sourceFinding.title,
          target_title: targetFinding?.title || relation.target_id,
        },
      });
      setSelectedDraftNodeId(null);
      setInspectorTab("state");
      setError("");
    },
    [copy, findings]
  );

  const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(
      selectedNodes
        .filter((node) => node.type === "fact" && !node.parentId)
        .map((node) => node.id)
    );
    setSelectedDraftNodeId(
      selectedNodes.find((node) => node.type === "draft")?.id || null
    );
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedItem(null);
    setSelectedNodeIds([]);
    setSelectedDraftNodeId(null);
  }, []);

  useEffect(() => {
    const handleHotkey = (event) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openNewTopic();
        requestAnimationFrame(() => {
          spotlightInputRef.current?.focus();
          spotlightInputRef.current?.select();
        });
        return;
      }

      if (
        !isTyping &&
        selectedDraftNodeId &&
        (event.key === "Backspace" || event.key === "Delete")
      ) {
        event.preventDefault();
        handleRejectDraft();
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [handleRejectDraft, openNewTopic, selectedDraftNodeId]);

  const handleGroupSelection = useCallback(() => {
    const groupableNodes = nodes.filter(
      (node) =>
        selectedNodeIds.includes(node.id) && node.type === "fact" && !node.parentId
    );

    if (groupableNodes.length < 2) {
      setError(copy.groupSelection);
      return;
    }

    const layerNumber = layerCounter.current;
    layerCounter.current += 1;
    setContextLayers((currentLayers) => [
      ...currentLayers,
      {
        id: `context-layer-${Date.now()}`,
        label: `${copy.contextLayer} ${layerNumber}`,
        memberIds: groupableNodes.map((node) => node.id),
      },
    ]);
    setSelectedNodeIds([]);
    setError("");
  }, [copy, nodes, selectedNodeIds]);

  function applyMagicLayout(requestedLayoutMode = layoutMode) {
    const activeLayoutMode = ["graph", "tree", "timeline", "comparison"].includes(
      requestedLayoutMode
    )
      ? requestedLayoutMode
      : "graph";
    const nextPositions = {};
    let treeOffsetY = 60;

    researchTopics.forEach((topic, topicIndex) => {
      const topicNodeId = `topic-${topic.id}`;
      const topicFindings = findings.filter((finding) => finding.topic_id === topic.id);
      const graphTopicPosition = getTopicPosition(topicIndex);
      const rootPosition =
        activeLayoutMode === "tree"
          ? { x: 160, y: treeOffsetY }
          : activeLayoutMode === "timeline"
            ? { x: 100, y: 110 + topicIndex * 520 }
            : graphTopicPosition;

      nextPositions[topicNodeId] = rootPosition;

      topicFindings.forEach((finding, factIndex) => {
        const nodeId = `finding-${finding.id}`;
        const position =
          activeLayoutMode === "tree"
            ? { x: 160, y: rootPosition.y + 220 + factIndex * 230 }
            : activeLayoutMode === "timeline"
              ? { x: rootPosition.x + 340 + factIndex * 360, y: rootPosition.y }
              : activeLayoutMode === "comparison"
                ? {
                    x: rootPosition.x + (factIndex % 2) * 440,
                    y: rootPosition.y + 230 + Math.floor(factIndex / 2) * 230,
                  }
                : {
                x: rootPosition.x + (factIndex % 2) * 330,
                y: rootPosition.y + 230 + Math.floor(factIndex / 2) * 210,
                  };

        nextPositions[nodeId] = {
          x: Number.isFinite(position.x) ? position.x : 100,
          y: Number.isFinite(position.y) ? position.y : 100,
        };
      });

      if (activeLayoutMode === "tree") {
        treeOffsetY += Math.max(topicFindings.length, 1) * 230 + 330;
      }
    });

    if (socraticDraft) {
      const targetPosition = draftTargetFindingId
        ? nextPositions[draftTargetFindingId] || nodePositions[draftTargetFindingId]
        : null;
      const fallbackTopicIndex = Math.max(
        0,
        researchTopics.findIndex((topic) => topic.id === activeTopicId)
      );
      const fallback = getDraftPosition(fallbackTopicIndex, findings.length);
      const position = targetPosition
        ? { x: Number(targetPosition.x) + 340, y: Number(targetPosition.y) + 20 }
        : fallback;

      nextPositions["socratic-draft"] = {
        x: Number.isFinite(position.x) ? position.x : 100,
        y: Number.isFinite(position.y) ? position.y : 100,
      };
    }

    setNodePositions((currentPositions) => ({
      ...currentPositions,
      ...nextPositions,
    }));
  }

  applyMagicLayoutRef.current = applyMagicLayout;

  const generateMarkdownReport = useCallback(() => {
    const verifiedFacts = findings;

    const report = [
      "# Flow-AI Cyber Report",
      "",
      ...verifiedFacts.flatMap((finding) => {
        const evidence = Array.isArray(finding.evidence)
          ? finding.evidence
              .map((item) => item?.quote)
              .filter(Boolean)
              .join(" | ")
          : finding.evidence;

        return [
          `## Finding: ${finding.title || "Untitled finding"}`,
          `* **Analysis:** ${finding.summary || finding.details || "No analysis available."}`,
          `* **Evidence:** "${evidence || "No evidence available."}"`,
          "",
        ];
      }),
    ].join("\n");

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "FlowAI_Report.md";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [findings]);

  const selectedEvidence = selectedItem
    ? getEvidence(selectedItem.item, selectedItem.kind === "draft")
    : [];

  const pendingRelationReviews =
    selectedItem?.kind === "finding"
      ? (selectedItem.item.relations || [])
          .filter(
            (relation) =>
              relation?.origin === "ai" && relation?.status === "candidate"
          )
          .map((relation) => ({
            ...relation,
            targetTitle:
              findings.find((finding) => finding.id === relation.target_id)?.title ||
              relation.target_id,
            sourceFindingId: selectedItem.item.id,
          }))
      : selectedItem?.kind === "relation" &&
          selectedItem.item.origin === "ai" &&
          selectedItem.item.status === "candidate"
        ? [
            {
              ...selectedItem.item,
              targetTitle: selectedItem.item.target_title,
              sourceFindingId: selectedItem.item.source_finding_id,
            },
          ]
      : [];

  const inspectorState = selectedItem
    ? selectedItem.kind === "draft"
      ? {
          id: "socratic-draft",
          status: "Socratic Review Draft",
          timestamp: null,
          identified_gap: selectedItem.item.identified_gap,
          socratic_questions: selectedItem.item.socratic_questions,
          proposed_hypothesis: selectedItem.item.proposed_hypothesis,
        }
      : selectedItem.kind === "relation"
        ? {
            id: selectedItem.item.id,
            status: selectedItem.item.status || "verified",
            origin: selectedItem.item.origin || "ai",
            type: selectedItem.item.type,
            source_finding_id: selectedItem.item.source_finding_id,
            source_title: selectedItem.item.source_title,
            target_id: selectedItem.item.target_id,
            target_title: selectedItem.item.target_title,
            confidence_score: selectedItem.item.confidence_score,
            evidence: selectedItem.item.evidence || null,
            reason: selectedItem.item.reason || null,
          }
      : {
          ...selectedItem.item,
          timestamp:
            selectedItem.item.timestamp ||
            selectedItem.item.commit_state?.updated_at ||
            null,
        }
    : null;

  const inspectorReasoning = selectedItem
    ? selectedItem.kind === "draft"
      ? selectedItem.item.identified_gap
      : selectedItem.kind === "relation"
        ? selectedItem.item.reason ||
          "No additional rationale was supplied for this graph relation."
      : selectedItem.item.details
    : copy.noSelection;

  const handleCheckout = useCallback(
    async (revision) => {
      try {
        setIsCheckingOut(true);
        setError("");
        const uiState = buildUiState();
        const response = await fetch(
          `${API_URL}/api/workspace/checkout/${encodeURIComponent(revision)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ui_state: uiState }),
          }
        );

        if (!response.ok) {
          throw new Error(await readError(response, copy.checkoutFailed));
        }

        const data = await response.json();
        if (data?.ui_state) applyRestoredUiState(data.ui_state);

        setSelectedItem(null);
        setSocraticDraft(null);
        setDraftTargetFindingId(null);
        setDraftTopicId(null);
        await loadWorkspace();
      } catch (requestError) {
        setError(
          getLocalizedRequestError(requestError, copy.checkoutFailed)
        );
      } finally {
        setIsCheckingOut(false);
      }
    },
    [applyRestoredUiState, buildUiState, copy, loadWorkspace]
  );

  const historyEntries = useMemo(
    () => [...workspaceHistory].sort((left, right) => right.revision - left.revision),
    [workspaceHistory]
  );

  const visibleProposals = useMemo(
    () => {
      const scopedProposals = activeTopicId
        ? proposals.filter((proposal) => proposal.topic_id === activeTopicId)
        : proposals;

      return [...scopedProposals].sort(
        (left, right) =>
          Number(right.confidence_score ?? -1) -
          Number(left.confidence_score ?? -1)
      );
    },
    [activeTopicId, proposals]
  );

  return (
    <main className="h-screen overflow-hidden bg-[#0B1120] text-slate-100">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)]">
        <TopBar
          copy={copy}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          onLayoutChange={(mode) => {
            setLayoutMode(mode);
            applyMagicLayout(mode);
          }}
          onOpenIngest={openNewTopic}
          onRunCopilot={handleSocraticReview}
          onMagicLayout={() => applyMagicLayout()}
          onDownloadReport={generateMarkdownReport}
          isReviewing={isReviewing}
          error={error}
          notice={notice}
        />

        <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-[#0F172A]">
            <div className="border-b border-slate-800 px-4 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-400">
                {copy.aiInbox}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <h2 className="font-bold text-white">{copy.proposals}</h2>
                <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs font-bold text-orange-300">
                  {visibleProposals.length}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {isLoadingWorkspace ? (
                <p className="py-8 text-center text-sm text-slate-500">{copy.loadingInbox}</p>
              ) : visibleProposals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-500">
                  {activeTopic
                    ? copy.noProposalsTopic
                    : copy.noProposalsWorkspace}
                </div>
              ) : (
                visibleProposals.map((proposal) => {
                  const confidenceTier = getConfidenceTier(proposal);

                  return (
                    <article
                    key={proposal.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedItem({ kind: "proposal", item: proposal });
                      setInspectorTab("state");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedItem({ kind: "proposal", item: proposal });
                        setInspectorTab("state");
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      selectedItem?.kind === "proposal" &&
                      selectedItem.item.id === proposal.id
                        ? "border-orange-300 bg-orange-400/10 ring-1 ring-orange-400/30"
                        : "border-slate-700 bg-slate-900/70 hover:border-orange-400/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-5 text-slate-100">
                        {proposal.title}
                      </h3>
                      <span className="shrink-0 rounded bg-cyan-400/10 px-1.5 py-1 text-[10px] font-extrabold text-cyan-300">
                        {getConfidenceScore(proposal)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {copy.evidenceConfidence} · <span className={confidenceTier.className}>{confidenceTier.label}</span>
                    </p>
                    {proposal.source_title && (
                      <p className="mt-2 truncate text-[10px] font-semibold text-cyan-300/80">
                        {copy.source}: {proposal.source_title}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                      {proposal.details}
                    </p>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleProposalCommit(proposal.id);
                      }}
                      disabled={committingProposalId === proposal.id}
                      className="mt-3 w-full rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-2 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {committingProposalId === proposal.id
                        ? copy.merging
                        : copy.mergeWorkspace}
                    </button>
                  </article>
                  );
                })
              )}
            </div>
          </aside>

          <section className="relative min-h-0 bg-[#0B1120]" aria-label={copy.canvasLabel}>
            <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 backdrop-blur">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-400">
                {copy.activeTopic}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <select
                  value={activeTopicId || ""}
                  onChange={(event) => setActiveTopicId(event.target.value || null)}
                  className="max-w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400"
                  aria-label={copy.activeTopic}
                >
                  <option value="" disabled>
                    {copy.selectTopic}
                  </option>
                  {researchTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openNewTopic}
                  className="rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-extrabold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950"
                >
                  {copy.newTopic}
                </button>
                <button
                  type="button"
                  onClick={() => openSourceIngestion()}
                  disabled={!activeTopic}
                  className="rounded-md border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-1.5 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copy.addPaper}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteActiveTopic}
                  disabled={!activeTopic || isDeletingTopic}
                  className="rounded-md border border-rose-400/55 bg-rose-400/10 px-2.5 py-1.5 text-xs font-extrabold text-rose-200 transition hover:bg-rose-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isDeletingTopic ? copy.deleting : copy.deleteTopic}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {copy.graphIntro}
              </p>
              <details className="mt-3 border-t border-slate-700/80 pt-3">
                <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-300 marker:text-cyan-400">
                  {copy.graphFilters}
                </summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="search"
                    value={graphSearch}
                    onChange={(event) => setGraphSearch(event.target.value)}
                    placeholder={copy.searchFindings}
                    className="min-w-0 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400"
                    aria-label={copy.searchFindings}
                  />
                  <select
                    value={graphSourceFilter}
                    onChange={(event) => setGraphSourceFilter(event.target.value)}
                    className="min-w-0 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                    aria-label={copy.filterBySource}
                  >
                    <option value="all">{copy.allSources}</option>
                    {graphSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={minimumConfidence}
                    onChange={(event) => setMinimumConfidence(event.target.value)}
                    className="min-w-0 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                    aria-label={copy.minimumConfidence}
                  >
                    <option value="all">{copy.anyConfidence}</option>
                    <option value="85">{copy.highConfidence}</option>
                    <option value="65">{copy.mediumConfidence}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setFocusActiveTopic((current) => !current)}
                    disabled={!activeTopic}
                    className={`rounded-md border px-2.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      focusActiveTopic
                        ? "border-cyan-300 bg-cyan-400 text-slate-950"
                        : "border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400/70"
                    }`}
                  >
                    {focusActiveTopic ? copy.focusedTopic : copy.focusTopic}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    ["evidenceTrails", copy.trail, "bg-sky-400"],
                    ["verified", copy.verified, "bg-cyan-400"],
                    ["candidates", copy.review, "bg-yellow-400"],
                    ["manual", copy.manual, "bg-violet-400"],
                    ["hypotheses", copy.hypothesis, "bg-violet-300"],
                    ["drafts", copy.reviewBranch, "bg-yellow-400"],
                  ].map(([key, label, colorClass]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleEdgeVisibility(key)}
                      aria-pressed={edgeVisibility[key]}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold transition ${
                        edgeVisibility[key]
                          ? "border-slate-600 bg-slate-950 text-slate-200"
                          : "border-slate-800 bg-slate-950/40 text-slate-600 line-through"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${colorClass}`} />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  {copy.graphLegend}
                </p>
              </details>
            </div>

            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/90 p-2 backdrop-blur">
              <span className="px-1 text-xs font-semibold text-slate-400">
                {selectedNodeIds.length} {copy.selected}
              </span>
              <button
                type="button"
                onClick={handleGroupSelection}
                disabled={selectedNodeIds.length < 2}
                className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copy.group}
              </button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              nodesDraggable={activeMode === "manual"}
              nodesConnectable={activeMode === "manual"}
              elementsSelectable={true}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={handlePaneClick}
              onSelectionChange={handleSelectionChange}
              selectionOnDrag
              fitView
              fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
              minZoom={0.2}
              maxZoom={1.8}
              defaultEdgeOptions={{ type: "smoothstep" }}
              proOptions={{ hideAttribution: true }}
              className="bg-[#0B1120]"
            >
              <Background color="#334155" gap={16} size={1} />
              <MiniMap
                bgColor="#0f172a"
                maskColor="rgba(11, 17, 32, 0.78)"
                nodeColor={(node) => {
                  if (node.type === "draft") return "#ef4444";
                  if (node.type === "contextLayer") return "#22d3ee";
                  return "#34d399";
                }}
                nodeStrokeColor="#334155"
                nodeBorderRadius={8}
                className="!border !border-slate-700 !bg-[#0f172a] !shadow-2xl"
              />
              <Controls
                className="!overflow-hidden !rounded-xl !border !border-slate-700 !bg-[#0f172a] !shadow-2xl [&_button]:!h-9 [&_button]:!w-9 [&_button]:!border-0 [&_button]:!border-b [&_button]:!border-slate-700 [&_button]:!bg-[#0f172a] [&_button]:!text-cyan-400 [&_button:hover]:!bg-slate-800 [&_button:last-child]:!border-b-0 [&_button_svg]:!fill-cyan-400 [&_button_svg]:!stroke-cyan-400"
              />
            </ReactFlow>
          </section>

          <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-[#0F172A]">
            <div className="border-b border-slate-800 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-yellow-400">
                {copy.socraticCopilot}
              </p>
              <label className="mt-3 block">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600">
                  {copy.languageSetInIngestion}
                </span>
                <select
                  value={targetLang}
                  onChange={(event) => setTargetLang(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs font-semibold text-slate-300 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                >
                  <option value="auto">{copy.auto}</option>
                  <option value="en">{copy.english}</option>
                  <option value="uk">{copy.ukrainian}</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleSocraticReview}
                disabled={isReviewing}
                className="mt-3 w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isReviewing ? copy.copilotThinking : copy.runCopilot}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={applyMagicLayout}
                  className="rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-3 py-2.5 text-xs font-extrabold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
                >
                  {copy.magicLayout}
                </button>
                <button
                  type="button"
                  onClick={generateMarkdownReport}
                  className="rounded-lg border border-violet-400/60 bg-violet-400/10 px-3 py-2.5 text-xs font-extrabold text-violet-300 transition hover:bg-violet-400 hover:text-slate-950"
                >
                  {copy.downloadReport}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDiscoverConnections}
                disabled={
                  isDiscoveringConnections ||
                  !activeTopicId ||
                  (activeTopic?.finding_count || 0) < 2
                }
                className="mt-2 w-full rounded-lg border border-fuchsia-400/60 bg-fuchsia-400/10 px-3 py-2.5 text-xs font-extrabold text-fuchsia-200 transition hover:bg-fuchsia-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isDiscoveringConnections
                  ? copy.discovering
                  : copy.discoverConnections}
              </button>
              {activeTopic && activeTopic.finding_count < 2 && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {copy.mergeMore(2 - activeTopic.finding_count)}
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-400">
                    {copy.inspector}
                  </p>
                  <h2 className="mt-1 font-bold text-white">{copy.contextGitState}</h2>
                </div>
                {selectedItem && (
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${
                      selectedItem.kind === "draft"
                        ? "bg-yellow-400/15 text-yellow-300"
                        : selectedItem.kind === "proposal"
                          ? "bg-orange-400/15 text-orange-300"
                          : selectedItem.kind === "relation" &&
                              selectedItem.item.status === "candidate"
                            ? "bg-yellow-400/15 text-yellow-200"
                            : selectedItem.kind === "relation" &&
                                selectedItem.item.status === "hypothesis"
                              ? "bg-violet-400/15 text-violet-200"
                          : "bg-emerald-400/15 text-emerald-300"
                    }`}
                  >
                    {selectedItem.kind === "draft"
                      ? copy.draft
                      : selectedItem.kind === "proposal"
                        ? copy.inbox
                        : selectedItem.kind === "relation"
                          ? selectedItem.item.status === "candidate"
                            ? copy.pendingLink
                            : selectedItem.item.status === "hypothesis"
                              ? copy.hypothesis
                              : copy.relation
                        : copy.verified}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 rounded-lg border border-slate-700 bg-slate-950/60 p-1">
                <button
                  type="button"
                  onClick={() => setInspectorTab("state")}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                    inspectorTab === "state"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {copy.state}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorTab("history")}
                  className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                    inspectorTab === "history"
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {copy.history}
                </button>
              </div>

              {inspectorTab === "history" ? (
                <section className="mt-4 rounded-xl border border-slate-700 bg-slate-950/55 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                        {copy.snapshots}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {copy.restoreDescription}
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold text-cyan-300">
                      {historyEntries.length} {copy.revisions}
                    </span>
                  </div>

                  {historyEntries.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                      {copy.firstSnapshot}
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-3 border-l border-cyan-500/30 pl-4">
                      {historyEntries.map((entry) => (
                        <li key={entry.revision} className="relative">
                          <span className="absolute -left-[1.34rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-cyan-400" />
                          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-slate-100">{entry.action}</p>
                              <span className="shrink-0 text-xs font-extrabold text-cyan-300">
                                r{entry.revision}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {entry.timestamp || copy.timestampUnavailable}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCheckout(entry.revision)}
                              disabled={isCheckingOut}
                              className="mt-3 rounded-md border border-cyan-400/50 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isCheckingOut ? copy.restoring : copy.restore(entry.revision)}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              ) : !selectedItem ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-sm leading-6 text-slate-500">
                  {inspectorReasoning}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <section className="rounded-xl border border-slate-700 bg-slate-950/55 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      {copy.rawState}
                    </h3>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-cyan-100">
                      {JSON.stringify(inspectorState, null, 2)}
                    </pre>
                  </section>

                  {selectedItem.kind === "relation" && (
                    <section className="rounded-xl border border-slate-700 bg-slate-950/55 p-3">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                        {copy.relationPath}
                      </h3>
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                        <p className="text-sm font-bold text-slate-100">
                          {selectedItem.item.source_title}
                        </p>
                        <p className="my-2 text-center text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                          {formatRelationType(selectedItem.item.type, uiLanguage)} →
                        </p>
                        <p className="text-sm font-bold text-slate-100">
                          {selectedItem.item.target_title}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
                          {formatRelationStatus(selectedItem.item.origin || "ai", uiLanguage)}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
                          {formatRelationStatus(selectedItem.item.status || "verified", uiLanguage)}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">
                          {selectedItem.item.confidence_score ?? copy.unscored} {copy.confidence.toLowerCase()}
                        </span>
                      </div>
                    </section>
                  )}

                  <section className="rounded-xl border border-cyan-500/30 bg-cyan-400/5 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-300">
                      {selectedItem.kind === "relation"
                        ? copy.relationEvidence
                        : copy.sourceEvidence}
                    </h3>
                    {selectedEvidence.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">{copy.noEvidence}</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.map((evidence, index) => (
                          <blockquote
                            key={evidence.id || `${evidence.quote}-${index}`}
                            className="border-l-2 border-cyan-400 pl-3"
                          >
                            {evidence.title && (
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {evidence.title}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm italic leading-6 text-slate-200">
                              “{evidence.quote}”
                            </p>
                            {(evidence.page_number || evidence.start_char !== undefined) && (
                              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/80">
                                {evidence.page_number
                                  ? `${copy.page} ${evidence.page_number}`
                                  : copy.textSource}
                                {evidence.start_char !== undefined
                                  ? ` · ${copy.character} ${evidence.start_char}`
                                  : ""}
                              </p>
                            )}
                          </blockquote>
                        ))}
                      </div>
                    )}
                  </section>

                  {pendingRelationReviews.length > 0 && (
                    <section className="rounded-xl border border-dashed border-yellow-400/70 bg-yellow-400/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-yellow-300">
                            {copy.firewallReview}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {copy.aiSuggestion}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-yellow-400/15 px-2 py-1 text-[10px] font-extrabold text-yellow-200">
                          {pendingRelationReviews.length} {copy.pending}
                        </span>
                      </div>

                      <div className="mt-3 space-y-3">
                        {pendingRelationReviews.map((relation) => {
                          const isReviewingRelation = reviewingRelationId === relation.id;

                          return (
                            <article
                              key={relation.id || `${relation.target_id}-${relation.type}`}
                              className="rounded-lg border border-yellow-400/25 bg-slate-950/55 p-3"
                            >
                              <p className="text-sm font-bold text-yellow-100">
                                {formatRelationType(relation.type, uiLanguage)} → {relation.targetTitle}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {copy.confidence}: {relation.confidence_score ?? copy.notScored}
                              </p>
                              {relation.reason && (
                                <p className="mt-2 text-sm leading-5 text-slate-300">
                                  {relation.reason}
                                </p>
                              )}
                              {relation.evidence && (
                                <blockquote className="mt-2 border-l-2 border-yellow-400 pl-3 text-sm italic leading-5 text-yellow-50/90">
                                  “{relation.evidence}”
                                </blockquote>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApproveRelation(relation.sourceFindingId, relation.id)
                                  }
                                  disabled={isReviewingRelation || !relation.id}
                                  className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isReviewingRelation ? copy.saving : copy.approveEvidence}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRejectRelation(relation.sourceFindingId, relation.id)
                                  }
                                  disabled={isReviewingRelation || !relation.id}
                                  className="rounded-md border border-rose-400/60 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {copy.rejectLink}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section className="rounded-xl border border-violet-500/30 bg-violet-400/5 p-3">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-300">
                      {copy.aiReasoning}
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                      {inspectorReasoning}
                    </p>

                    {selectedItem.kind === "draft" && (
                      <>
                        <div className="mt-4 border-t border-violet-400/20 pt-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-300">
                            {copy.socraticQuestions}
                          </p>
                          <ol className="mt-2 space-y-2 text-sm leading-5 text-slate-300">
                            {selectedItem.item.socratic_questions.map((question, index) => (
                              <li key={`${question}-${index}`} className="flex gap-2">
                                <span className="font-bold text-yellow-300">{index + 1}.</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-slate-950/45 p-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-yellow-300">
                            {copy.proposedHypothesis} · {selectedItem.item.proposed_hypothesis.confidence_score}% {copy.confidence.toLowerCase()}
                          </p>
                          <p className="mt-2 font-semibold text-slate-100">
                            {selectedItem.item.proposed_hypothesis.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedItem.item.proposed_hypothesis.details}
                          </p>
                        </div>
                      </>
                    )}
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      <IngestResearchModal
        copy={copy}
        isOpen={isIngestModalOpen}
        ingestMode={ingestMode}
        activeTopicTitle={activeTopic?.title}
        query={query}
        setQuery={setQuery}
        text={text}
        setText={setText}
        sourceTitle={sourceTitle}
        setSourceTitle={setSourceTitle}
        sourcePageCount={sourcePageCount}
        setSourcePageCount={setSourcePageCount}
        sourcePolicy={sourcePolicy}
        setSourcePolicy={setSourcePolicy}
        targetLang={targetLang}
        setTargetLang={setTargetLang}
        apiKey={apiKey}
        setApiKey={setApiKey}
        isOpenAiConfigured={isOpenAiConfigured}
        error={error}
        notice={notice}
        isResettingWorkspace={isResettingWorkspace}
        onStartFreshWorkspace={handleStartFreshWorkspace}
        isExtractingSource={isExtractingSource}
        onExtractFile={handleSourceExtraction}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleResearch}
        onClose={() => setIsIngestModalOpen(false)}
        spotlightInputRef={spotlightInputRef}
      />
    </main>
  );
}
