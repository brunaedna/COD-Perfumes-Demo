import assert from "node:assert/strict";
import test from "node:test";
import {
  cashPaymentAmount,
  compareSalesByCodeDesc,
  filterSales,
  productSalesSummary,
  salePaymentEntries,
  salePaymentSummary,
} from "../src/core/sales-utils.js";

const sales = [
  {
    id: "s1",
    code: "V0002",
    sellerId: "seller-1",
    delivererId: "delivery-1",
    total: 150,
    items: [{ productId: "p1", productName: "Perfume A", quantity: 2, unitPrice: 75 }],
  },
  {
    id: "s2",
    code: "V0010",
    sellerId: "seller-2",
    delivererId: "delivery-2",
    total: 80,
    items: [{ productId: "p2", productName: "Perfume B", quantity: 1, unitPrice: 80 }],
  },
];

test("filtra vendas sem depender do estado da interface", () => {
  assert.deepEqual(filterSales(sales, { type: "seller", value: "seller-1" }), [sales[0]]);
  assert.deepEqual(filterSales(sales, { type: "product", value: "p2" }), [sales[1]]);
  assert.deepEqual(filterSales(sales, { type: "amount", value: "100" }), [sales[0]]);
});

test("ordena vendas pelo número do código", () => {
  assert.deepEqual([...sales].sort(compareSalesByCodeDesc).map((sale) => sale.code), ["V0010", "V0002"]);
});

test("resume vendas por produto e preserva nomes de produtos removidos", () => {
  const summary = productSalesSummary(sales, [{ id: "p1", name: "Perfume Atualizado" }]);
  assert.deepEqual(summary.map(({ name, quantity, revenue, salesCount }) => ({ name, quantity, revenue, salesCount })), [
    { name: "Perfume Atualizado", quantity: 2, revenue: 150, salesCount: 1 },
    { name: "Perfume B", quantity: 1, revenue: 80, salesCount: 1 },
  ]);
});

test("normaliza pagamentos antigos e múltiplos pagamentos", () => {
  assert.deepEqual(salePaymentEntries({ paymentMethod: "PIX", total: 19.999 }), [{ method: "PIX", amount: 20 }]);

  const splitSale = {
    payments: [
      { method: "Dinheiro", amount: 30 },
      { method: "Cartão", amount: 20 },
    ],
  };
  assert.equal(cashPaymentAmount(splitSale), 30);
  assert.match(salePaymentSummary(splitSale), /Dinheiro/);
  assert.match(salePaymentSummary(splitSale), /Cartão/);
});
