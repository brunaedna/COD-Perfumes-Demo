const WORKBOOK_STYLES = `<Styles>
  <Style ss:ID="default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F766E" ss:Pattern="Solid"/></Style>
  <Style ss:ID="money"><NumberFormat ss:Format="R$ #,##0.00"/></Style>
  <Style ss:ID="integer"><NumberFormat ss:Format="0"/></Style>
  <Style ss:ID="negative"><Font ss:Color="#B42318"/><NumberFormat ss:Format="R$ #,##0.00"/></Style>
  <Style ss:ID="total"><Font ss:Bold="1"/><Interior ss:Color="#DDEBE8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="totalMoney"><Font ss:Bold="1"/><Interior ss:Color="#DDEBE8" ss:Pattern="Solid"/><NumberFormat ss:Format="R$ #,##0.00"/></Style>
  <Style ss:ID="totalInteger"><Font ss:Bold="1"/><Interior ss:Color="#DDEBE8" ss:Pattern="Solid"/><NumberFormat ss:Format="0"/></Style>
  <Style ss:ID="totalNegative"><Font ss:Bold="1" ss:Color="#B42318"/><Interior ss:Color="#DDEBE8" ss:Pattern="Solid"/><NumberFormat ss:Format="R$ #,##0.00"/></Style>
</Styles>`;

export function excelWorkbookXml(workbook) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${WORKBOOK_STYLES}
${workbook}
</Workbook>`;
}

export function excelTotalRow(header, rows, label = "TOTAL") {
  if (!rows.length) {
    return Array.from({ length: header.length }, (_, index) => (index === 0 ? label : ""));
  }

  return header.map((title, index) => {
    if (index === 0) return label;
    if (String(title || "").includes("%")) return "";
    const values = rows
      .map((row) => row[index])
      .filter((value) => typeof value === "number" && Number.isFinite(value));
    if (!values.length) return "";
    return roundMoney(values.reduce((sum, value) => sum + value, 0));
  });
}

export function excelSheet(name, rows) {
  const safeRows = rows.length ? rows : [["Sem dados"]];
  const columnCount = Math.max(...safeRows.map((row) => row.length), 1);
  const rowCount = safeRows.length;
  return `<Worksheet ss:Name="${excelEscape(name)}">
<Table>${excelColumns(safeRows)}${safeRows.map((row, index) => excelRow(row, index, safeRows[0])).join("")}</Table>
<AutoFilter x:Range="R1C1:R${rowCount}C${columnCount}" xmlns="urn:schemas-microsoft-com:office:excel"/>
<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
  <FreezePanes/>
  <FrozenNoSplit/>
  <SplitHorizontal>1</SplitHorizontal>
  <TopRowBottomPane>1</TopRowBottomPane>
  <ActivePane>2</ActivePane>
</WorksheetOptions>
</Worksheet>`;
}

function excelColumns(rows) {
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  return Array.from({ length: columnCount }, (_, index) => {
    const width = Math.max(
      80,
      Math.min(
        240,
        rows.reduce((max, row) => Math.max(max, String(row[index] ?? "").length * 7 + 24), 80),
      ),
    );
    return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
  }).join("");
}

function excelRow(row, index, headers = []) {
  const isTotalRow = row[0] === "TOTAL";
  return `<Row>${row.map((value, columnIndex) => excelCell(value, index === 0, headers[columnIndex], isTotalRow)).join("")}</Row>`;
}

function excelCell(value, isHeader = false, header = "", isTotal = false) {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const style = isHeader ? "header" : excelStyleForValue(value, header, isTotal);
  const type = isNumber ? "Number" : "String";
  return `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="${type}">${excelEscape(value)}</Data></Cell>`;
}

function excelStyleForValue(value, header = "", isTotal = false) {
  const normalizedHeader = String(header || "").toLowerCase();
  if (typeof value !== "number" || !Number.isFinite(value)) return isTotal ? "total" : "";
  if (normalizedHeader.includes("%")) return isTotal ? "total" : "";
  if (["vendas", "quantidade", "unidades", "estoque", "produtos", "colaboradores", "qtd"].some((term) => normalizedHeader.includes(term))) {
    return isTotal ? "totalInteger" : "integer";
  }
  if (value < 0) return isTotal ? "totalNegative" : "negative";
  if (["preco", "custo", "total", "receita", "lucro", "comiss", "taxa", "entrada", "saida", "saldo", "aberto", "pagar", "descontado"].some((term) => normalizedHeader.includes(term))) {
    return isTotal ? "totalMoney" : "money";
  }
  return isTotal ? "total" : "";
}

export function excelEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
