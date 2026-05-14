import twilio from "twilio";
import { env } from "../config/env.js";

const { accountSid, authToken, verifyServiceSid } = env.twilio;

const isConfigured = Boolean(accountSid && authToken && verifyServiceSid);

let client = null;
if (isConfigured) {
  client = twilio(accountSid, authToken);
  // eslint-disable-next-line no-console
  console.log("[twilio] Verify service initialised");
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[twilio] Credentials missing — OTP runs in MOCK mode (code = 000000)"
  );
}

const MOCK_CODE = "000000";

export const isTwilioConfigured = () => isConfigured;

export const sendOtp = async (phone) => {
  if (!isConfigured) {
    return { status: "pending", mock: true };
  }
  const verification = await client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to: phone, channel: "sms" });
  return { status: verification.status, sid: verification.sid };
};

export const checkOtp = async (phone, code) => {
  if (!isConfigured) {
    return { status: code === MOCK_CODE ? "approved" : "denied", mock: true };
  }
  const check = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to: phone, code });
  return { status: check.status, valid: check.valid };
};
