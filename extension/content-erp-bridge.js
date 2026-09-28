chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ERP_IMPORT_MESSAGES") return false;

  window.postMessage(
    {
      source: "cod-wa-extension",
      type: "SALE_MESSAGES",
      messages: message.messages || [],
      meta: message.meta || {},
    },
    window.location.origin,
  );

  sendResponse({ ok: true, received: message.messages?.length || 0 });
  return true;
});
