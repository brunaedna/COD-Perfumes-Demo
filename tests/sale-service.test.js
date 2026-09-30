import assert from "node:assert/strict";
import test from "node:test";

import { createSaleService } from "../src/core/sale-service.js";

function fixture() {
  return {
    products: [{ id: "product-1", name: "Perfume A", stock: 5 }],
    people: [
      { id: "seller-1", name: "Vendedora", salesCommissionRate: 10, ownSalesCommissionRate: 15 },
      { id: "courier-1", name: "Entregador", deliveryCommission: 12 },
    ],
    stockTransfers: [{ id: "transfer-1", delivererId: "courier-1", productId: "product-1", type: "Saida", quantity: 1 }],
    sales: [],
    ledger: [],
    audit: [],
    _deleted: { sales: {}, ledger: {} },
  };
}

function sale(overrides = {}) {
  return {
    id: "sale-1",
    code: "V0001",
    date: "2026-09-30",
    status: "Entregue",
    sellerId: "seller-1",
    delivererId: "courier-1",
    payments: [{ method: "Dinheiro", amount: 200 }],
    items: [{ productId: "product-1", productName: "Perfume A", quantity: 2, unitPrice: 100 }],
    total: 200,
    ...overrides,
  };
}

function service() {
  let sequence = 0;
  return createSaleService({
    idFactory: (prefix) => `${prefix}-${++sequence}`,
    now: () => "2026-09-30T12:00:00.000Z",
  });
}

test("registra venda, origem do estoque, comissões, dinheiro e auditoria", () => {
  const state = fixture();
  const currentSale = sale();
  const result = service().commit(state, currentSale);

  assert.equal(result.ok, true);
  assert.equal(state.products[0].stock, 4);
  assert.equal(currentSale.items[0].fulfillment, "mixed");
  assert.equal(currentSale.items[0].fulfillmentDelivererQty, 1);
  assert.equal(currentSale.items[0].fulfillmentWarehouseQty, 1);
  assert.deepEqual(state.ledger.map((entry) => entry.type), [
    "Comissao vendedor",
    "Comissao entrega",
    "Vale",
  ]);
  assert.equal(state.audit[0].action, "sale.created");
  assert.deepEqual(state.audit[0].summary, { code: "V0001", status: "Entregue", total: 200 });
});

test("substituição inválida restaura toda a transação anterior", () => {
  const state = fixture();
  const saleService = service();
  const previousSale = sale();
  saleService.commit(state, previousSale);
  const snapshot = structuredClone(state);

  const result = saleService.replace(state, previousSale, sale({
    items: [{ productId: "product-1", productName: "Perfume A", quantity: 99, unitPrice: 100 }],
    total: 9_900,
  }));

  assert.equal(result.ok, false);
  assert.match(result.message, /Estoque insuficiente/);
  assert.deepEqual(state, snapshot);
});

test("substituição válida recalcula estoque e lançamentos uma única vez", () => {
  const state = fixture();
  const saleService = service();
  const previousSale = sale();
  saleService.commit(state, previousSale);

  const result = saleService.replace(state, previousSale, sale({
    payments: [{ method: "PIX", amount: 100 }],
    items: [{ productId: "product-1", productName: "Perfume A", quantity: 1, unitPrice: 100 }],
    total: 100,
  }));

  assert.equal(result.ok, true);
  assert.equal(state.products[0].stock, 5);
  assert.equal(state.sales.length, 1);
  assert.deepEqual(state.ledger.map((entry) => entry.amount), [10, 12]);
  assert.equal(state.audit.at(-1).action, "sale.updated");
});

test("exclusão reverte apenas o estoque do depósito e remove lançamentos vinculados", () => {
  const state = fixture();
  const saleService = service();
  const currentSale = sale();
  saleService.commit(state, currentSale);

  saleService.remove(state, currentSale);

  assert.equal(state.products[0].stock, 5);
  assert.equal(state.sales.length, 0);
  assert.equal(state.ledger.length, 0);
  assert.ok(state._deleted.sales["sale-1"]);
  assert.equal(Object.keys(state._deleted.ledger).length, 3);
  assert.equal(state.audit.at(-1).action, "sale.deleted");
});

test("venda cancelada não altera estoque e registra taxa e comissão adicional", () => {
  const state = fixture();
  const result = service().commit(state, sale({
    status: "Cancelada",
    canceledDeliveryFee: 8,
    additionalCommissionTarget: "seller",
    additionalCommissionAmount: 5,
    payments: [],
  }));

  assert.equal(result.ok, true);
  assert.equal(state.products[0].stock, 5);
  assert.deepEqual(state.ledger.map((entry) => entry.type), [
    "Taxa entrega cancelada",
    "Comissao adicional vendedor",
  ]);
});
