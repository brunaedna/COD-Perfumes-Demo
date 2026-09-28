const state = {
  seen: new Set(),
  observer: null,
};

bootstrap();

async function bootstrap() {
  const stored = await chrome.storage.local.get({ seenMessageHashes: [] });
  state.seen = new Set(stored.seenMessageHashes);
  const settings = await getSettings();
  if (settings.enabled) {
    observeConversation(settings);
    setTimeout(() => scanAndSend(settings, "initial"), 1500);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "WA_SCAN_NOW") return false;

  getSettings()
    .then((settings) => scanAndSend(settings, "manual"))
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

function observeConversation(settings) {
  if (state.observer) state.observer.disconnect();

  state.observer = new MutationObserver(() => {
    window.clearTimeout(observeConversation.timer);
    observeConversation.timer = window.setTimeout(async () => {
      const currentSettings = await getSettings();
      scanAndSend(currentSettings, "observer");
    }, 900);
  });

  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

async function scanAndSend(settings, trigger) {
  if (!settings.enabled) return { ok: true, captured: 0, reason: "disabled" };

  const groupName = getCurrentChatName();
  if (settings.authorizedGroup && normalizeText(groupName) !== normalizeText(settings.authorizedGroup)) {
    return {
      ok: false,
      captured: 0,
      error: `Grupo aberto: ${groupName || "nao identificado"}. Grupo autorizado: ${settings.authorizedGroup}.`,
    };
  }

  const messages = collectVisibleMessages(settings.keywords);
  const freshMessages = messages.filter((text) => !state.seen.has(hashText(text)));

  if (!freshMessages.length) return { ok: true, captured: 0 };

  const delivery = await chrome.runtime.sendMessage({
    type: "WA_SALE_MESSAGES",
    messages: freshMessages,
    meta: {
      trigger,
      groupName,
      sourceName: groupName ? `WhatsApp - ${groupName}` : "Extensao WhatsApp",
      pageTitle: document.title,
      capturedAt: new Date().toISOString(),
      url: location.href,
    },
  });

  if (!delivery?.ok) {
    return {
      ok: false,
      captured: 0,
      error: delivery?.error || "O ERP nao confirmou o recebimento.",
    };
  }

  freshMessages.forEach((text) => state.seen.add(hashText(text)));
  await persistSeen();

  return {
    ...delivery,
    captured: freshMessages.length,
    groupName,
  };
}

function getCurrentChatName() {
  const selectors = [
    "header [data-testid='conversation-info-header-chat-title']",
    "header span[title]",
    "header h1",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const value = element?.getAttribute("title") || element?.textContent;
    if (value?.trim()) return value.trim();
  }

  return "";
}

function collectVisibleMessages(keywords) {
  const normalizedKeywords = keywords.map(normalizeText).filter(Boolean);
  const nodes = [
    ...document.querySelectorAll("[data-pre-plain-text], .copyable-text, [role='row']"),
  ];

  return nodes
    .map((node) => extractMessageText(node))
    .filter(Boolean)
    .filter((text) => {
      const normalized = normalizeText(text);
      return normalizedKeywords.every((keyword) => normalized.includes(keyword));
    })
    .slice(-20);
}

function extractMessageText(node) {
  const metadata = node.getAttribute("data-pre-plain-text") || "";
  const text = node.innerText || node.textContent || "";
  const clean = `${metadata}\n${text}`.replace(/\s+\n/g, "\n").trim();
  return clean.length > 12 ? clean : "";
}

function getSettings() {
  return chrome.storage.sync.get({
    enabled: true,
    erpUrl: "http://127.0.0.1:4173/index.html",
    authorizedGroup: "",
    keywords: ["venda finalizada", "cliente:", "produto:"],
  });
}

async function persistSeen() {
  const values = [...state.seen].slice(-300);
  state.seen = new Set(values);
  await chrome.storage.local.set({ seenMessageHashes: values });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hashText(value) {
  let hash = 0;
  const text = normalizeText(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return String(hash);
}
