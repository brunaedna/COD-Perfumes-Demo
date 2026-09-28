const defaults = {
  enabled: true,
  erpUrl: "http://127.0.0.1:4173/index.html",
  authorizedGroup: "",
  keywords: ["venda finalizada", "cliente:", "produto:"],
};

const fields = {
  enabled: document.querySelector("#enabled"),
  erpUrl: document.querySelector("#erpUrl"),
  authorizedGroup: document.querySelector("#authorizedGroup"),
  keywords: document.querySelector("#keywords"),
  status: document.querySelector("#status"),
};

document.querySelector("#save").addEventListener("click", saveSettings);
document.querySelector("#scan").addEventListener("click", scanNow);

loadSettings();

async function loadSettings() {
  const [settings, localState] = await Promise.all([
    chrome.storage.sync.get(defaults),
    chrome.storage.local.get({ lastDelivery: null }),
  ]);
  fields.enabled.checked = Boolean(settings.enabled);
  fields.erpUrl.value = settings.erpUrl;
  fields.authorizedGroup.value = settings.authorizedGroup || "";
  fields.keywords.value = settings.keywords.join("\n");

  if (localState.lastDelivery?.ok) {
    const time = new Date(localState.lastDelivery.at).toLocaleString("pt-BR");
    setStatus(`Ultima entrega: ${localState.lastDelivery.count} mensagem(ns), ${time}.`);
  }
}

async function saveSettings() {
  await chrome.storage.sync.set({
    enabled: fields.enabled.checked,
    erpUrl: fields.erpUrl.value.trim() || defaults.erpUrl,
    authorizedGroup: fields.authorizedGroup.value.trim(),
    keywords: fields.keywords.value
      .split("\n")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  });

  setStatus("Configuracao salva.");
}

async function scanNow() {
  await saveSettings();
  const response = await chrome.runtime.sendMessage({ type: "SCAN_ACTIVE_WHATSAPP" });
  if (response?.ok) {
    setStatus(response.captured ? `${response.captured} mensagem(ns) enviada(s).` : "Nenhuma nova venda encontrada.");
  } else {
    setStatus(response?.error || "Nao foi possivel capturar.");
  }
}

function setStatus(message) {
  fields.status.textContent = message;
}
