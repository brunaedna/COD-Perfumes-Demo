import { roundMoney } from "./formatters.js";

export function calculateSaleCommissions({
  total,
  seller,
  deliverer,
  status,
  canceledDeliveryFee = 0,
  additionalTarget = "",
  additionalAmount = 0,
}) {
  const isCanceled = status === "Cancelada";
  const isOwnDeliverySale = Boolean(seller && deliverer && seller.id === deliverer.id);
  let sellerBaseCommission = 0;
  let delivererBaseCommission = 0;

  if (isCanceled) {
    delivererBaseCommission = deliverer ? roundMoney(canceledDeliveryFee) : 0;
  } else {
    const sellerRate = isOwnDeliverySale ? seller?.ownSalesCommissionRate : seller?.salesCommissionRate;
    if (seller && Number(sellerRate) > 0) {
      sellerBaseCommission = roundMoney(Number(total || 0) * (Number(sellerRate) / 100));
    }
    if (deliverer && Number(deliverer.deliveryCommission) > 0) {
      delivererBaseCommission = roundMoney(deliverer.deliveryCommission);
    }
  }

  const extra = roundMoney(additionalAmount);
  let sellerCommission = sellerBaseCommission;
  let delivererCommission = delivererBaseCommission;
  if (extra > 0) {
    if (additionalTarget === "seller" && seller) sellerCommission += extra;
    if (additionalTarget === "deliverer" && deliverer) delivererCommission += extra;
  }

  return {
    sellerBaseCommission,
    delivererBaseCommission,
    sellerCommission: roundMoney(sellerCommission),
    delivererCommission: roundMoney(delivererCommission),
    totalCommission: roundMoney(sellerCommission + delivererCommission),
    isOwnDeliverySale,
  };
}
