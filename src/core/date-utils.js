export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStart(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

export function yearStart(dateString) {
  return `${dateString.slice(0, 4)}-01-01`;
}

export function isDateInside(date, startDate, endDate) {
  if (!date) return false;
  const start = startDate || endDate || "";
  const end = endDate || startDate || "";
  return (!start || date >= start) && (!end || date <= end);
}
