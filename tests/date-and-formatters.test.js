import assert from "node:assert/strict";
import test from "node:test";
import { addDays, isDateInside, monthStart, yearStart } from "../src/core/date-utils.js";
import { escapeHtml, formatDate, money, roundMoney, statusPill } from "../src/core/formatters.js";

test("calcula intervalos usando datas no formato do sistema", () => {
  assert.equal(addDays("2026-09-29", 1), "2026-09-30");
  assert.equal(monthStart("2026-09-29"), "2026-09-01");
  assert.equal(yearStart("2026-09-29"), "2026-01-01");
  assert.equal(isDateInside("2026-09-15", "2026-09-01", "2026-09-30"), true);
  assert.equal(isDateInside("2026-10-01", "2026-09-01", "2026-09-30"), false);
});

test("formata valores e protege conteúdo exibido em HTML", () => {
  assert.equal(roundMoney(10.555), 10.56);
  assert.match(money(10), /10,00/);
  assert.equal(formatDate("2026-09-29"), "29/09/2026");
  assert.equal(escapeHtml('<script>alert("x")</script>'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  assert.match(statusPill("Entregue"), /pill good/);
});
