import { test, expect } from "@playwright/test";
test("registration, dashboard, channel setup and responsive navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Good to have you back." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Your name").fill("Preview Owner");
  await page.getByLabel("Organization name").fill("Acme Studio");
  await page
    .getByLabel("Work email")
    .fill(`browser-${testInfo.project.name}-${Date.now()}@example.com`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("browser-test-password-123");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "A little closer to your customers." }),
  ).toBeVisible();
  if (testInfo.project.name === "desktop")
    await expect(page.getByText("Acme Studio", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Your next conversation starts here"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Create campaign", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.screenshot({
    path: `/tmp/pulse-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Set up your channels" }).click();
  await expect(
    page.getByRole("heading", { name: "Channels", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect channel" }).first().click();
  await expect(page.getByLabel("Meta phone number ID")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.getByRole("link", { name: "Audience", exact: true }).click();
  await page.getByRole("button", { name: "Add contact", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Channel", exact: true })
    .selectOption("email");
  await page.getByLabel("Full name").fill("A Customer");
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByLabel("Consent evidence").fill("Browser test opt-in");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("cell", { name: "customer@example.com" }),
  ).toBeVisible();
});
