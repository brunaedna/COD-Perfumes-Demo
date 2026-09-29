import { money, roundMoney } from "./formatters.js";

export function productSalesSummary(sales, products) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const totals = new Map();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = productsById.get(item.productId);
      const name = product?.name || item.productName || "Produto removido";
      const key = item.productId || name;

      if (!totals.has(key)) {
        totals.set(key, { name, quantity: 0, revenue: 0, salesCodes: new Set() });
      }

      const row = totals.get(key);
      row.quantity += Number(item.quantity || 0);
      row.revenue = roundMoney(row.revenue + Number(item.quantity || 0) * Number(item.unitPrice || 0));
      row.salesCodes.add(sale.code || sale.id);
    });
  });

  return [...totals.values()]
    .map((row) => ({ ...row, salesCount: row.salesCodes.size }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue || a.name.localeCompare(b.name));
}

export function filterSales(sales, filters) {
  if (!filters.type || !filters.value) return sales;
  if (filters.type === "seller") return sales.filter((sale) => sale.sellerId === filters.value);
  if (filters.type === "deliverer") return sales.filter((sale) => sale.delivererId === filters.value);
  if (filters.type === "product") {
    return sales.filter((sale) => sale.items.some((item) => item.productId === filters.value));
  }
  if (filters.type === "amount") {
    const minimum = Number(filters.value || 0);
    return sales.filter((sale) => Number(sale.total || 0) >= minimum);
  }
  return sales;
}

export function saleCodeNumber(code) {
  const number = Number(String(code || "").replace(/\D/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function compareSalesByCodeDesc(a, b) {
  return saleCodeNumber(b.code) - saleCodeNumber(a.code);
}

export function salePaymentEntries(sale) {
  if (Array.isArray(sale.payments) && sale.payments.length) {
    return sale.payments.map((payment) => ({
      method: payment.method || payment.paymentMethod || "Nao informado",
      amount: roundMoney(payment.amount),
    }));
  }

  const method = sale.paymentMethod || "Nao informado";
  const amount = roundMoney(sale.total);
  return amount > 0 ? [{ method, amount }] : [];
}

export function salePaymentSummary(sale) {
  const payments = salePaymentEntries(sale);
  if (!payments.length) return sale.paymentMethod || "Nao informado";
  if (payments.length === 1) return payments[0].method;
  return payments.map((payment) => `${payment.method} ${money(payment.amount)}`).join(" + ");
}

export function isCashPaymentMethod(paymentMethod) {
  return String(paymentMethod || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("dinheiro");
}

export function cashPaymentAmount(sale) {
  return salePaymentEntries(sale)
    .filter((payment) => isCashPaymentMethod(payment.method))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}
