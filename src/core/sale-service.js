import { calculateSaleCommissions } from "./commission-engine.js";
import { roundMoney } from "./formatters.js";
import { cashPaymentAmount } from "./sales-utils.js";
import { planSaleFulfillmentForState } from "../inventory-engine.js";

const MAX_AUDIT_EVENTS = 200;

export function createSaleService({ idFactory, now = () => new Date().toISOString() }) {
  if (typeof idFactory !== "function") throw new TypeError("idFactory is required");

  function commit(state, sale) {
    const result = applySale(state, sale, idFactory);
    if (result.ok) recordAudit(state, "sale.created", sale, idFactory, now);
    return result;
  }

  function replace(state, previousSale, nextSale) {
    const snapshot = transactionSnapshot(state);
    try {
      removeEffects(state, previousSale, now);
      state.sales = state.sales.filter((sale) => sale.id !== previousSale.id);

      const result = applySale(state, nextSale, idFactory);
      if (!result.ok) {
        restoreSnapshot(state, snapshot);
        return result;
      }

      recordAudit(state, "sale.updated", nextSale, idFactory, now);
      return result;
    } catch (error) {
      restoreSnapshot(state, snapshot);
      throw error;
    }
  }

  function remove(state, sale) {
    removeEffects(state, sale, now);
    markDeleted(state, "sales", sale.id, now);
    state.sales = state.sales.filter((entry) => entry.id !== sale.id);
    recordAudit(state, "sale.deleted", sale, idFactory, now);
  }

  return { commit, replace, remove };
}

export function courierFulfilledQuantity(item) {
  if (Number.isFinite(Number(item.fulfillmentDelivererQty))) {
    return Number(item.fulfillmentDelivererQty || 0);
  }
  return item.fulfillment === "deliverer" ? Number(item.quantity || 0) : 0;
}

export function warehouseFulfilledQuantity(item) {
  if (Number.isFinite(Number(item.fulfillmentWarehouseQty))) {
    return Number(item.fulfillmentWarehouseQty || 0);
  }
  if (item.fulfillment === "deliverer") return 0;
  return Number(item.quantity || 0);
}

function applySale(state, sale, idFactory) {
  if (sale.status !== "Cancelada") {
    const plan = planSaleFulfillmentForState(state, sale);
    if (!plan.ok) return plan;
    applyFulfillment(state, sale, plan);
  }

  state.ledger.push(...createLedgerEntries(state, sale, idFactory));
  state.sales.push(sale);
  return { ok: true };
}

function applyFulfillment(state, sale, plan) {
  plan.items.forEach((itemPlan, index) => {
    const item = sale.items[index];
    const product = findById(state.products, item.productId);
    item.fulfillmentDelivererQty = itemPlan.courierQty;
    item.fulfillmentWarehouseQty = itemPlan.warehouseQty;
    item.fulfillment = fulfillmentLabel(itemPlan, item.quantity);
    product.stock -= itemPlan.warehouseQty;
  });
}

function fulfillmentLabel(plan, quantity) {
  if (plan.courierQty === Number(quantity || 0)) return "deliverer";
  if (plan.warehouseQty === Number(quantity || 0)) return "warehouse";
  return "mixed";
}

function createLedgerEntries(state, sale, idFactory) {
  const seller = findById(state.people, sale.sellerId);
  const deliverer = findById(state.people, sale.delivererId);
  const commissions = calculateSaleCommissions({
    total: sale.total,
    seller,
    deliverer,
    status: sale.status,
    canceledDeliveryFee: sale.canceledDeliveryFee,
    additionalTarget: sale.additionalCommissionTarget,
    additionalAmount: sale.additionalCommissionAmount,
  });
  const entries = [];

  if (sale.status === "Cancelada") {
    if (deliverer && commissions.delivererBaseCommission > 0) {
      entries.push(ledgerEntry(idFactory("ledger"), sale, deliverer.id, {
        type: "Taxa entrega cancelada",
        description: `Taxa por tentativa de entrega cancelada ${sale.code}`,
        amount: commissions.delivererBaseCommission,
        direction: "in",
      }));
    }
  } else {
    if (seller && commissions.sellerBaseCommission > 0) {
      entries.push(ledgerEntry(idFactory("ledger"), sale, seller.id, {
        type: commissions.isOwnDeliverySale ? "Comissao venda propria" : "Comissao vendedor",
        description: commissions.isOwnDeliverySale
          ? `${seller.ownSalesCommissionRate}% sobre venda propria ${sale.code}`
          : `${seller.salesCommissionRate}% sobre venda ${sale.code}`,
        amount: commissions.sellerBaseCommission,
        direction: "in",
      }));
    }
    if (deliverer && commissions.delivererBaseCommission > 0) {
      entries.push(ledgerEntry(idFactory("ledger"), sale, deliverer.id, {
        type: "Comissao entrega",
        description: `Entrega da venda ${sale.code}`,
        amount: commissions.delivererBaseCommission,
        direction: "in",
      }));
    }
  }

  const target = sale.additionalCommissionTarget;
  const additionalAmount = roundMoney(sale.additionalCommissionAmount);
  const additionalPerson = target === "seller" ? seller : target === "deliverer" ? deliverer : null;
  if (additionalPerson && additionalAmount > 0) {
    entries.push(ledgerEntry(idFactory("ledger"), sale, additionalPerson.id, {
      type: target === "seller" ? "Comissao adicional vendedor" : "Comissao adicional entregador",
      description: `Comissao adicional da venda ${sale.code}`,
      amount: additionalAmount,
      direction: "in",
    }));
  }

  const cashAmount = sale.status === "Cancelada" ? 0 : roundMoney(cashPaymentAmount(sale));
  if (deliverer && cashAmount > 0) {
    entries.push(ledgerEntry(idFactory("ledger"), sale, deliverer.id, {
      type: "Vale",
      description: `Dinheiro recebido na entrega da venda ${sale.code}`,
      amount: cashAmount,
      direction: "out",
    }));
  }

  return entries;
}

function ledgerEntry(id, sale, personId, details) {
  return { id, date: sale.date, personId, source: sale.code, ...details };
}

function removeEffects(state, sale, now) {
  if (sale.status !== "Cancelada") {
    sale.items.forEach((item) => {
      const product = findById(state.products, item.productId);
      if (product) product.stock += warehouseFulfilledQuantity(item);
    });
  }

  state.ledger
    .filter((entry) => entry.source === sale.code)
    .forEach((entry) => markDeleted(state, "ledger", entry.id, now));
  state.ledger = state.ledger.filter((entry) => entry.source !== sale.code);
}

function recordAudit(state, action, sale, idFactory, now) {
  state.audit = [
    ...(state.audit || []),
    {
      id: idFactory("audit"),
      occurredAt: now(),
      action,
      entity: "sale",
      entityId: sale.id,
      summary: { code: sale.code, status: sale.status, total: roundMoney(sale.total) },
    },
  ].slice(-MAX_AUDIT_EVENTS);
}

function markDeleted(state, collection, id, now) {
  if (!id) return;
  state._deleted ||= {};
  state._deleted[collection] ||= {};
  state._deleted[collection][id] = now();
}

function transactionSnapshot(state) {
  return structuredClone({
    products: state.products,
    sales: state.sales,
    ledger: state.ledger,
    audit: state.audit,
    _deleted: state._deleted,
  });
}

function restoreSnapshot(state, snapshot) {
  Object.assign(state, snapshot);
}

function findById(rows, id) {
  return (rows || []).find((row) => row.id === id) || null;
}
