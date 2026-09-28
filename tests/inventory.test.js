import assert from "node:assert/strict";
import test from "node:test";
import { calculateCourierStockBalances, planSaleFulfillmentForState } from "../src/inventory-engine.js";

function state(overrides = {}) {
  return {
    products: [{ id: "p1", name: "Perfume A", stock: 4 }],
    people: [{ id: "d1", name: "Entregador 1" }],
    stockTransfers: [{ delivererId: "d1", productId: "p1", type: "Saida", quantity: 5 }],
    sales: [],
    ...overrides,
  };
}

test("calcula o saldo em posse do entregador", () => {
  const balances = calculateCourierStockBalances(state({
    stockTransfers: [
      { delivererId: "d1", productId: "p1", type: "Saida", quantity: 5 },
      { delivererId: "d1", productId: "p1", type: "Devolucao", quantity: 1 },
    ],
    sales: [{
      delivererId: "d1",
      status: "Entregue",
      items: [{ productId: "p1", quantity: 2, fulfillmentDelivererQty: 2 }],
    }],
  }));

  assert.equal(balances[0].out, 5);
  assert.equal(balances[0].returned, 1);
  assert.equal(balances[0].sold, 2);
  assert.equal(balances[0].balance, 2);
});

test("ignora venda cancelada no estoque do entregador", () => {
  const balances = calculateCourierStockBalances(state({
    sales: [{
      delivererId: "d1",
      status: "Cancelada",
      items: [{ productId: "p1", quantity: 3, fulfillmentDelivererQty: 3 }],
    }],
  }));
  assert.equal(balances[0].balance, 5);
});

test("consome primeiro o estoque do entregador e depois o depósito", () => {
  const result = planSaleFulfillmentForState(state(), {
    delivererId: "d1",
    items: [{ productId: "p1", productName: "Perfume A", quantity: 7 }],
  });
  assert.deepEqual(result, {
    ok: true,
    items: [{ productId: "p1", courierQty: 5, warehouseQty: 2 }],
  });
});

test("rejeita venda quando a soma de itens ultrapassa o estoque", () => {
  const result = planSaleFulfillmentForState(state(), {
    delivererId: "d1",
    items: [
      { productId: "p1", productName: "Perfume A", quantity: 6 },
      { productId: "p1", productName: "Perfume A", quantity: 4 },
    ],
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /Estoque insuficiente/);
});
