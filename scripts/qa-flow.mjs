import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

async function shot(url, path, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await page.screenshot({ path, fullPage: false });
  const text = (await page.locator("body").innerText()).slice(0, 200);
  return { url, path, overflow, errors, text };
}

const results = [];
results.push(await shot("http://127.0.0.1:8080/", "/workspace/screenshots/mobile-home.png", { width: 390, height: 844 }));
results.push(await shot("http://127.0.0.1:8080/queue", "/workspace/screenshots/mobile-queue.png", { width: 390, height: 844 }));
results.push(await shot("http://127.0.0.1:8080/queue/INC-1839", "/workspace/screenshots/incident-secret.png", { width: 1280, height: 900 }));
results.push(await shot("http://127.0.0.1:8080/audit", "/workspace/screenshots/audit.png", { width: 1280, height: 800 }));
results.push(await shot("http://127.0.0.1:8080/inbox", "/workspace/screenshots/inbox.png", { width: 1280, height: 800 }));

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://127.0.0.1:8080/queue/INC-1834", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const approve = page.getByRole("button", { name: /Approve/ });
if (await approve.count()) {
  await approve.click();
  await page.waitForTimeout(600);
  const after = await page.locator("body").innerText();
  results.push({ flow: "approve", ok: after.includes("MOBILE-4086") || after.includes("created") });
  await page.screenshot({ path: "/workspace/screenshots/approved.png" });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
