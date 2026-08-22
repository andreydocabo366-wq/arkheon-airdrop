import assert from "node:assert/strict";
import test from "node:test";
import { sign } from "@tma.js/init-data-node";
import { handleApiRequest } from "../../server/api/router";
import { resetRateLimitForTests } from "../../server/api/security";
import { FakeRepository } from "./fake-repository";

const origin = "https://arkheon.example";
const botToken = "123456789:TEST_TOKEN_FOR_UNIT_TESTS_ONLY";

function initData() {
  return sign(
    {
      query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
      user: { id: 42, first_name: "Andrey", language_code: "ar" },
    },
    botToken,
    new Date(),
  );
}

interface ApiTestBody {
  data: {
    status: string;
    service: string;
    session: { token: string };
    user: { displayName: string };
    entries: unknown[];
    demo: boolean;
  };
  error: { code: string };
}

async function json(response: Response) {
  return response.json() as Promise<ApiTestBody>;
}

test.beforeEach(() => resetRateLimitForTests());

test("health endpoint works without database or Telegram secrets", async () => {
  const response = await handleApiRequest(new Request(`${origin}/api/v1/health`), {});
  const body = await json(response);
  assert.equal(response.status, 200);
  assert.equal(body.data.status, "ok");
  assert.equal(body.data.service, "arkheon-api");
});

test("Telegram authentication is server-gated when secrets are absent", async () => {
  const response = await handleApiRequest(
    new Request(`${origin}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ initData: "untrusted" }),
    }),
    { PUBLIC_APP_ORIGIN: origin },
  );
  const body = await json(response);
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "SERVICE_NOT_CONFIGURED");
});

test("creates an opaque session after valid Telegram verification", async () => {
  const repository = new FakeRepository();
  const response = await handleApiRequest(
    new Request(`${origin}/api/v1/auth/telegram`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ initData: initData() }),
    }),
    { TELEGRAM_BOT_TOKEN: botToken, PUBLIC_APP_ORIGIN: origin },
    { repository },
  );
  const body = await json(response);

  assert.equal(response.status, 200);
  assert.match(body.data.session.token, /^[a-f0-9]{64}$/);
  assert.equal(body.data.user.displayName, "Andrey");
  assert.equal(JSON.stringify(body).includes(botToken), false);
});

test("allows a valid Telegram launch to refresh its opaque session", async () => {
  const repository = new FakeRepository();
  const signed = initData();
  const makeRequest = () => new Request(`${origin}/api/v1/auth/telegram`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ initData: signed }),
  });
  const env = { TELEGRAM_BOT_TOKEN: botToken, PUBLIC_APP_ORIGIN: origin };

  const first = await json(await handleApiRequest(makeRequest(), env, { repository }));
  const secondResponse = await handleApiRequest(makeRequest(), env, { repository });
  const second = await json(secondResponse);
  assert.equal(secondResponse.status, 200);
  assert.notEqual(first.data.session.token, second.data.session.token);
});

test("blocks cross-origin API requests", async () => {
  const repository = new FakeRepository();
  const response = await handleApiRequest(
    new Request(`${origin}/api/v1/airdrops`, {
      headers: { origin: "https://malicious.example" },
    }),
    { PUBLIC_APP_ORIGIN: origin },
    { repository },
  );
  const body = await json(response);
  assert.equal(response.status, 403);
  assert.equal(body.error.code, "ORIGIN_NOT_ALLOWED");
});

test("never creates a fake production leaderboard", async () => {
  const response = await handleApiRequest(
    new Request(`${origin}/api/v1/ranking?scope=saudi`, { headers: { origin } }),
    { PUBLIC_APP_ORIGIN: origin },
    { repository: new FakeRepository() },
  );
  const body = await json(response);
  assert.equal(response.status, 200);
  assert.deepEqual(body.data.entries, []);
  assert.equal(body.data.demo, false);
});
