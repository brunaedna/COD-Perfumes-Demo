const brlCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function money(value) {
  return brlCurrency.format(Number(value || 0));
}

export function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function formatDate(date) {
  if (!date) return "-";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function statusPill(status) {
  const className = status === "Entregue" ? "good" : status === "Cancelada" ? "bad" : "warn";
  return `<span class="pill ${className}">${escapeHtml(status)}</span>`;
}
