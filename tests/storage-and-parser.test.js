import assert from "node:assert/strict";
import test from "node:test";
import { mergeStates, normalizeState } from "../src/storage.js";
import { normalizeText, parseIncomingMessage, splitMessages } from "../src/message-parser.js";

test("remove registros marcados como excluídos durante a normalização", () => {
  const normalized = normalizeState({
    _deleted: { products: { p2: "2026-09-28T10:00:00.000Z" } },
    products: [{ id: "p1", name: "A" }, { id: "p2", name: "B" }],
  });
  assert.deepEqual(normalized.products.map((item) => item.id), ["p1"]);
});

test("mescla estado da nuvem e local sem ressuscitar exclusões", () => {
  const cloud = {
    _meta: { revision: 2, updatedAt: "2026-09-27T10:00:00.000Z" },
    products: [{ id: "p1", name: "Nome antigo", stock: 2 }, { id: "p2", name: "Excluído" }],
  };
  const local = {
    _meta: { revision: 3, updatedAt: "2026-09-28T10:00:00.000Z" },
    _deleted: { products: { p2: "2026-09-28T09:00:00.000Z" } },
    products: [{ id: "p1", name: "Nome atualizado", stock: 5 }],
  };

  const merged = mergeStates(cloud, local);
  assert.equal(merged.products.length, 1);
  assert.deepEqual(merged.products[0], { id: "p1", name: "Nome atualizado", stock: 5 });
  assert.equal(merged._meta.revision, 3);
});

test("interpreta uma mensagem de venda recebida", () => {
  const result = parseIncomingMessage(
    "Cliente: Ana\nTelefone: 11999998888\nProduto: Essência Floral\nQtd: 2\nValor: R$ 89,90\nPagamento: PIX",
    "WhatsApp",
    { products: [{ id: "p1", name: "Essência Floral", price: 89.9 }], people: [] },
  );
  assert.equal(result.draft.customer, "Ana");
  assert.equal(result.draft.customerPhone, "11999998888");
  assert.equal(result.draft.paymentMethod, "PIX");
  assert.deepEqual(result.draft.items[0], {
    productId: "p1",
    productName: "Essência Floral",
    quantity: 2,
    unitPrice: 89.9,
  });
});

test("normaliza acentos e separa mensagens em lote", () => {
  assert.equal(normalizeText("  Essência FLORAL  "), "essencia floral");
  assert.deepEqual(splitMessages("Primeira\n\nSegunda\n\n"), ["Primeira", "Segunda"]);
});
