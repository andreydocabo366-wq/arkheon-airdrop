import assert from "node:assert/strict";
import test from "node:test";

async function renderHome() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Arabic-first ARKHÉON demo experience", async () => {
  const response = await renderHome();

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /ARKHÉON AIRDROP/i);
  assert.match(html, /اكتشف الفرص مبكرًا/);
  assert.match(html, /DEMO/);
  assert.match(html, /dir=["']rtl["']/i);
});

test("does not expose private agent architecture in the public HTML", async () => {
  const response = await renderHome();
  const html = await response.text();
  for (const forbidden of ["SCOUT", "AUDITOR", "FARMER", "HARVESTER", "TREASURY", "LARI Orchestrator", "Policy Engine", "Signer Service"]) {
    assert.doesNotMatch(html, new RegExp(forbidden, "i"));
  }
});
