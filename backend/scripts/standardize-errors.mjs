#!/usr/bin/env node
// One-shot script: read openapi.yaml, ensure every operation enumerates the
// error responses it can plausibly produce. Always adds 500. Writes the
// result back to openapi.yaml (via yamljs.stringify, which keeps the spec
// valid; cosmetic differences are fine — Swagger UI is the consumer).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yamljs from "yamljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = path.resolve(__dirname, "..", "openapi.yaml");
const spec = yamljs.load(SPEC_PATH);

// Keys: "METHOD path"; values: status codes that operation can produce.
// 500 is added unconditionally. 429 is added where rate limiting is actually
// configured (auth/register, auth/login).
const MATRIX = {
  "GET /health": [],
  "POST /auth/register": ["400", "409", "422", "429"],
  "POST /auth/login": ["400", "401", "422", "429"],
  "POST /auth/refresh": ["400", "401", "422"],
  "POST /auth/logout": ["400", "422"],
  "GET /auth/me": ["401", "403"],
  "PATCH /auth/switch-role": ["400", "401", "422"],

  "GET /listings": ["400"],
  "POST /listings": ["400", "401", "403", "422"],
  "GET /listings/mine": ["401", "403"],
  "GET /listings/{id}": ["400", "404"],
  "PATCH /listings/{id}": ["400", "401", "403", "404", "422"],
  "DELETE /listings/{id}": ["400", "401", "403", "404"],

  "GET /listings/{listingId}/bills": ["400", "404"],
  "POST /listings/{listingId}/bills": ["400", "401", "403", "404", "422"],
  "PATCH /bills/{id}": ["400", "401", "403", "404", "422"],
  "DELETE /bills/{id}": ["400", "401", "403", "404"],

  "POST /listings/{listingId}/applications": ["400", "401", "403", "404", "409", "422"],
  "GET /applications/me": ["401"],
  "PATCH /applications/{id}/accept": ["400", "401", "403", "404", "409"],
  "PATCH /applications/{id}/reject": ["400", "401", "403", "404", "409"],
  "PATCH /applications/{id}/withdraw": ["400", "401", "403", "404", "409"],

  "GET /favorites": ["401"],
  "POST /favorites": ["400", "401", "404", "422"],
  "GET /favorites/check": ["400", "401"],
  "DELETE /favorites/{listingId}": ["400", "401", "404"],

  "GET /saved-searches": ["401"],
  "POST /saved-searches": ["400", "401", "422"],

  "GET /admin/stats": ["401", "403"],
  "GET /admin/users": ["401", "403"],
  "PATCH /admin/users/{id}/ban": ["400", "401", "403", "404", "422"],
  "PATCH /admin/users/{id}/role": ["400", "401", "403", "404", "422"],
  "GET /admin/listings/pending": ["401", "403"],
  "PATCH /admin/listings/{id}/moderate": ["400", "401", "403", "404", "422"],
  "GET /admin/verifications/pending": ["401", "403"],
  "PATCH /admin/verifications/{id}/review": ["400", "401", "403", "404", "422"]
};

const RESPONSE_REF = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "404": { $ref: "#/components/responses/NotFound" },
  "409": { $ref: "#/components/responses/Conflict" },
  "422": { $ref: "#/components/responses/Unprocessable" },
  "429": { $ref: "#/components/responses/RateLimited" },
  "500": { $ref: "#/components/responses/ServerError" }
};

let added = 0;
let unknown = 0;
const seen = new Set();

for (const [p, methods] of Object.entries(spec.paths)) {
  for (const [m, op] of Object.entries(methods)) {
    if (!["get", "post", "patch", "put", "delete"].includes(m)) continue;
    const key = `${m.toUpperCase()} ${p}`;
    seen.add(key);
    const wanted = MATRIX[key];
    if (!wanted) {
      console.warn(`[warn] no matrix entry for ${key}`);
      unknown++;
      continue;
    }
    op.responses = op.responses || {};
    for (const code of [...wanted, "500"]) {
      if (!op.responses[code]) {
        op.responses[code] = RESPONSE_REF[code];
        added++;
      }
    }
  }
}

// Sanity: every matrix entry maps to a real operation.
for (const key of Object.keys(MATRIX)) {
  if (!seen.has(key)) {
    console.error(`[error] matrix entry references missing operation: ${key}`);
    process.exit(2);
  }
}

const out = yamljs.stringify(spec, 12, 2);
fs.writeFileSync(SPEC_PATH, out);
console.log(`Done. Added ${added} response refs across ${seen.size} operations (${unknown} unmapped).`);
