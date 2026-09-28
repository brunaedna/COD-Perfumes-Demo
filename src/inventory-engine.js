function byId(rows, id) {
  return (rows || []).find((row) => row.id === id) || null;
}

function courierQuantity(item) {
  if (Number.isFinite(Number(item.fulfillmentDelivererQty))) {
    return Number(item.fulfillmentDelivererQty || 0);
  }
  return item.fulfillment === "deliverer" ? Number(item.quantity || 0) : 0;
}

export function calculateCourierStockBalances(state) {
  const balances = new Map();
  const ensure = (delivererId, productId) => {
    const key = `${delivererId}|${productId}`;
    if (!balances.has(key)) {
      balances.set(key, {
        delivererId,
        productId,
        delivererName: byId(state.people, delivererId)?.name || "Entregador removido",
        productName: byId(state.products, productId)?.name || "Produto removido",
        out: 0,
        returned: 0,
        sold: 0,
        balance: 0,
      });
    }
    return balances.get(key);
  };

  (state.stockTransfers || []).forEach((entry) => {
    const row = ensure(entry.delivererId, entry.productId);
    if (entry.type === "Devolucao") row.returned += Number(entry.quantity || 0);
    else row.out += Number(entry.quantity || 0);
  });

  (state.sales || [])
    .filter((sale) => sale.status !== "Cancelada" && sale.delivererId)
    .forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const quantity = courierQuantity(item);
        if (quantity <= 0) return;
        ensure(sale.delivererId, item.productId).sold += quantity;
      });
    });

  balances.forEach((row) => {
    row.balance = row.out - row.returned - row.sold;
  });
  return [...balances.values()].sort(
    (a, b) => a.delivererName.localeCompare(b.delivererName) || a.productName.localeCompare(b.productName),
  );
}

export function planSaleFulfillmentForState(state, sale) {
  const balances = calculateCourierStockBalances(state);
  const courierUsage = new Map();
  const warehouseUsage = new Map();
  const items = [];

  for (const item of sale.items || []) {
    const product = byId(state.products, item.productId);
    if (!product) {
      return { ok: false, message: `Produto nao encontrado: ${item.productName || "produto selecionado"}.` };
    }

    const quantity = Number(item.quantity || 0);
    const key = `${sale.delivererId || ""}|${item.productId}`;
    const usedCourier = courierUsage.get(key) || 0;
    const availableAtCourier = sale.delivererId
      ? Math.max(Number(balances.find((row) => row.delivererId === sale.delivererId && row.productId === item.productId)?.balance || 0) - usedCourier, 0)
      : 0;
    const courierQty = Math.min(quantity, availableAtCourier);
    const warehouseQty = quantity - courierQty;
    const usedWarehouse = warehouseUsage.get(item.productId) || 0;

    if (warehouseQty > Number(product.stock || 0) - usedWarehouse) {
      return { ok: false, message: `Estoque insuficiente para ${item.productName || product.name}.` };
    }

    courierUsage.set(key, usedCourier + courierQty);
    warehouseUsage.set(item.productId, usedWarehouse + warehouseQty);
    items.push({ productId: item.productId, courierQty, warehouseQty });
  }

  return { ok: true, items };
}
