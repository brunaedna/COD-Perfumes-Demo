import assert from "node:assert/strict";
import test from "node:test";
import {
  excelEscape,
  excelSheet,
  excelTotalRow,
  excelWorkbookXml,
} from "../src/excel-export.js";

test("escapa texto perigoso antes de gerar a planilha", () => {
  assert.equal(
    excelEscape('Cliente & <teste> "VIP"'),
    "Cliente &amp; &lt;teste&gt; &quot;VIP&quot;",
  );
});

test("calcula totais numéricos sem somar percentuais", () => {
  const header = ["Produto", "Quantidade", "Comissão %", "Receita"];
  const rows = [
    ["A", 2, 10, 30.5],
    ["B", 3, 15, 40],
  ];

  assert.deepEqual(excelTotalRow(header, rows), ["TOTAL", 5, "", 70.5]);
});

test("gera uma pasta de trabalho XML válida para download", () => {
  const xml = excelWorkbookXml(excelSheet("Estoque & vendas", [["Produto"], ["A"]]));

  assert.match(xml, /<Workbook/);
  assert.match(xml, /Estoque &amp; vendas/);
  assert.match(xml, /<Worksheet/);
});
