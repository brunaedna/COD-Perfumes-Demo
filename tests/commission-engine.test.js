import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaleCommissions } from "../src/core/commission-engine.js";

const seller = {
  id: "seller-1",
  salesCommissionRate: 10,
  ownSalesCommissionRate: 15,
};
const deliverer = { id: "delivery-1", deliveryCommission: 12.5 };

test("calcula comissões distintas de vendedor e entregador", () => {
  assert.deepEqual(
    calculateSaleCommissions({ total: 200, seller, deliverer, status: "Entregue" }),
    {
      sellerBaseCommission: 20,
      delivererBaseCommission: 12.5,
      sellerCommission: 20,
      delivererCommission: 12.5,
      totalCommission: 32.5,
      isOwnDeliverySale: false,
    },
  );
});

test("usa a taxa de venda própria quando vendedor também entrega", () => {
  const sellerAndDeliverer = { ...seller, deliveryCommission: 8 };
  const result = calculateSaleCommissions({
    total: 200,
    seller: sellerAndDeliverer,
    deliverer: sellerAndDeliverer,
    status: "Entregue",
  });
  assert.equal(result.sellerCommission, 30);
  assert.equal(result.delivererCommission, 8);
  assert.equal(result.isOwnDeliverySale, true);
});

test("em venda cancelada paga somente a taxa de tentativa de entrega", () => {
  const result = calculateSaleCommissions({
    total: 200,
    seller,
    deliverer,
    status: "Cancelada",
    canceledDeliveryFee: 7.5,
  });
  assert.equal(result.sellerCommission, 0);
  assert.equal(result.delivererCommission, 7.5);
});

test("adiciona comissão extra ao destinatário escolhido", () => {
  const result = calculateSaleCommissions({
    total: 100,
    seller,
    deliverer,
    status: "Entregue",
    additionalTarget: "seller",
    additionalAmount: 5.555,
  });
  assert.equal(result.sellerBaseCommission, 10);
  assert.equal(result.sellerCommission, 15.56);
  assert.equal(result.totalCommission, 28.06);
});
