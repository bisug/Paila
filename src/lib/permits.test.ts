import { describe, expect, test } from "bun:test";
import {
  signPermit,
  verifyPermitQrPayload,
  generatePermitQrPayload,
  SEED_PERMITS,
} from "./permits";

describe("Trekking Permits cryptographic verification", () => {
  test("generates and verifies valid signed permit payload", async () => {
    const permit = SEED_PERMITS[0];
    const signature = await signPermit(permit);
    const token = await generatePermitQrPayload({ ...permit, signature });

    const result = await verifyPermitQrPayload(token);
    expect(result.valid).toBe(true);
    expect(result.status).toBe("authentic");
    expect(result.permit?.permitNumber).toBe(permit.permitNumber);
  });

  test("detects tampered permit payloads", async () => {
    const permit = SEED_PERMITS[0];
    const token = await generatePermitQrPayload(permit);

    // Tamper by replacing name in the raw JSON
    const decoded = Buffer.from(token.replace("paila:permit:v1:", ""), "base64").toString("utf-8");
    const tamperedObj = JSON.parse(decoded);
    tamperedObj.trekkerName = "Fraudulent Trekker";
    const tamperedToken =
      "paila:permit:v1:" + Buffer.from(JSON.stringify(tamperedObj)).toString("base64");

    const result = await verifyPermitQrPayload(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.status).toBe("tampered");
  });

  test("detects expired permits", async () => {
    const expiredPermit = {
      ...SEED_PERMITS[0],
      validTo: "2020-01-01",
    };
    const token = await generatePermitQrPayload(expiredPermit);

    const result = await verifyPermitQrPayload(token);
    expect(result.valid).toBe(false);
    expect(result.status).toBe("expired");
  });
});
