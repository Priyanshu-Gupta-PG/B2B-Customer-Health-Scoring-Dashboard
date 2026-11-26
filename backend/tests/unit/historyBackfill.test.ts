import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syntheticHistoryScores } from "../../src/bootstrap/historyBackfill.js";

describe("syntheticHistoryScores", () => {
  it("returns exactly N points ending at the final score", () => {
    const scores = syntheticHistoryScores(72, 90, 3);
    assert.equal(scores.length, 90);
    assert.equal(scores[89], 72);
  });

  it("stays within 0–100", () => {
    for (const salt of [0, 1, 11, 42]) {
      for (const final of [0, 11, 50, 100]) {
        const scores = syntheticHistoryScores(final, 60, salt);
        for (const s of scores) {
          assert.ok(s >= 0 && s <= 100);
        }
        assert.equal(scores[scores.length - 1], final);
      }
    }
  });

  it("is deterministic for the same inputs", () => {
    assert.deepEqual(syntheticHistoryScores(55, 30, 7), syntheticHistoryScores(55, 30, 7));
  });
});
