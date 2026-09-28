const DEFAULT_SETTINGS = {
  enabled: true,
  erpUrl: "http://127.0.0.1:4173/index.html",
  authorizedGroup: "",
  keywords: ["venda finalizada", "cliente:", "produto:"],
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...current });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "WA_SALE_MESSAGES") {
    deliverToErp(message.messages || [], message.meta || {})
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "SCAN_ACTIVE_WHATSAPP") {
    scanActiveWhatsApp()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function deliverToErp(messages, meta) {
  if (!messages.length) return { ok: true, delivered: 0 };

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  let erpTab = await findErpTab(settings.erpUrl);

  if (!erpTab) {
    erpTab = await chrome.tabs.create({ url: settings.erpUrl, active: false });
    await waitForTabLoad(erpTab.id);
  }

  const payload = {
    type: "ERP_IMPORT_MESSAGES",
    messages,
    meta: {
      ...meta,
      deliveredAt: new Date().toISOString(),
    },
  };

  await sendToErpWithRetry(erpTab.id, payload);

  await chrome.action.setBadgeText({ text: String(messages.length) });
  await chrome.action.setBadgeBackgroundColor({ color: "#087f8c" });
  await chrome.storage.local.set({
    lastDelivery: {
      ok: true,
      count: messages.length,
      groupName: meta.groupName || "",
      at: new Date().toISOString(),
    },
  });
  return { ok: true, delivered: messages.length };
}

async function findErpTab(erpUrl) {
  const tabs = await chrome.tabs.query({});
  const expected = normalizeUrl(erpUrl);
  return tabs.find((tab) => normalizeUrl(tab.url) === expected);
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "/index.html");
  } catch {
    return String(url || "").split(/[?#]/)[0];
  }
}

async function sendToErpWithRetry(tabId, payload) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await chrome.tabs.sendMessage(tabId, payload);
    } catch (error) {
      lastError = error;
      await delay(500 + attempt * 350);
    }
  }
  throw lastError || new Error("Nao foi possivel conectar ao ERP.");
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function scanActiveWhatsApp() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://web.whatsapp.com/")) {
    return { ok: false, error: "Abra o grupo no WhatsApp Web antes de capturar." };
  }

  return chrome.tabs.sendMessage(tab.id, { type: "WA_SCAN_NOW" });
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(resolve, 2500);
  });
}
