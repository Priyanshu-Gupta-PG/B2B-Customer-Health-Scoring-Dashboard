import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roleForGoogleSignup } from "../../src/services/AuthService.js";

describe("roleForGoogleSignup", () => {
  it("keeps the role of an existing user", () => {
    assert.equal(
      roleForGoogleSignup({
        existingRole: "csm",
        email: "owner@company.com",
        adminEmails: ["owner@company.com"],
        hasGoogleAdmin: false,
      }),
      "csm",
    );
  });

  it("makes a listed email an admin", () => {
    assert.equal(
      roleForGoogleSignup({
        existingRole: null,
        email: "Owner@Company.com",
        adminEmails: ["owner@company.com"],
        hasGoogleAdmin: true,
      }),
      "admin",
    );
  });

  it("makes the first Google account an admin", () => {
    assert.equal(
      roleForGoogleSignup({
        existingRole: null,
        email: "first@gmail.com",
        adminEmails: [],
        hasGoogleAdmin: false,
      }),
      "admin",
    );
  });

  it("makes later Google accounts read-only", () => {
    assert.equal(
      roleForGoogleSignup({
        existingRole: null,
        email: "teammate@gmail.com",
        adminEmails: [],
        hasGoogleAdmin: true,
      }),
      "csm",
    );
  });
});
