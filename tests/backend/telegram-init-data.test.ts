import assert from "node:assert/strict";
import test from "node:test";
import { sign } from "@tma.js/init-data-node";
import {
  normalizeReferralStartParam,
  validateTelegramInitData,
} from "../../server/telegram/init-data";

const botToken = "123456789:TEST_TOKEN_FOR_UNIT_TESTS_ONLY";

function signedInitData(authDate = new Date()) {
  return sign(
    {
      query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
      start_param: "ref_ARKHEON42",
      user: {
        id: 42,
        first_name: "Andrey",
        username: "arkheon_test",
        language_code: "ar",
      },
    },
    botToken,
    authDate,
  );
}

test("validates signed Telegram initData and extracts a normalized identity", () => {
  const now = new Date();
  const identity = validateTelegramInitData({
    initData: signedInitData(now),
    botToken,
    expiresIn: 300,
    now,
  });

  assert.equal(identity.telegramId, BigInt(42));
  assert.equal(identity.firstName, "Andrey");
  assert.equal(identity.languageCode, "ar");
  assert.equal(identity.startParam, "ARKHEON42");
});

test("rejects tampered Telegram user data", () => {
  const initData = new URLSearchParams(signedInitData());
  initData.set("user", JSON.stringify({ id: 42, first_name: "Mallory" }));

  assert.throws(
    () => validateTelegramInitData({ initData: initData.toString(), botToken, expiresIn: 300 }),
    /invalid or expired/i,
  );
});

test("rejects expired Telegram initData", () => {
  const oldDate = new Date(Date.now() - 10 * 60 * 1_000);
  assert.throws(
    () => validateTelegramInitData({ initData: signedInitData(oldDate), botToken, expiresIn: 300 }),
    /invalid or expired/i,
  );
});

test("only accepts the official ref_ start parameter shape", () => {
  assert.equal(normalizeReferralStartParam("ref_abc234"), "ABC234");
  assert.equal(normalizeReferralStartParam("campaign_abc234"), undefined);
  assert.equal(normalizeReferralStartParam("ref_a"), undefined);
});
