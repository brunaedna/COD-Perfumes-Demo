import { expect, test } from "@playwright/test";

test("cadastra um produto e registra uma venda", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#storageStatus")).not.toContainText("Abrindo banco local");
  await page.getByRole("button", { name: "Estoque", exact: true }).click();
  await expect(page.locator("#products")).toBeVisible();

  const productForm = page.locator("#productForm");
  await productForm.locator('[name="name"]').fill("Perfume E2E");
  await productForm.locator('[name="sku"]').fill("E2E-001");
  await productForm.locator('[name="price"]').fill("150");
  await productForm.locator('[name="cost"]').fill("80");
  await productForm.locator('[name="stock"]').fill("10");
  await productForm.getByRole("button", { name: "Salvar produto" }).click();

  await expect(page.locator("#productRows")).toContainText("Perfume E2E");

  await page.getByRole("button", { name: "Nova venda" }).click();
  const saleForm = page.locator("#saleForm");
  await saleForm.locator('[name="customer"]').fill("Cliente E2E");
  const productSelect = saleForm.locator('.sale-item select[name="productId"]');
  await expect(productSelect).toContainText("Perfume E2E");
  await saleForm.locator('.sale-item input[name="quantity"]').fill("2");
  await expect(saleForm.locator('[name="paymentAmount"]')).toHaveValue("300.00");
  await saleForm.getByRole("button", { name: "Registrar venda" }).click();

  await expect(page.locator("#saleModal")).not.toBeVisible();
  await page.getByRole("button", { name: "Vendas", exact: true }).click();
  await expect(page.locator("#salesRows")).toContainText("Cliente E2E");
  await expect(page.locator("#salesRows")).toContainText("R$ 300,00");
});
