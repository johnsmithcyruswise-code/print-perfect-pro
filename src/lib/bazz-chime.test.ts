import { describe, expect, it } from "vitest";
import { findNewIds } from "./bazz-chime";
describe("findNewIds", () => {
  it("returns only unseen orders", () => { expect(findNewIds(new Set(["a"]), ["a", "b"])).toEqual(["b"]); });
});
