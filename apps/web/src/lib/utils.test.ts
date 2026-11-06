import { describe, expect, it } from "vitest";
import { cn, formatCompact, formatCurrency } from "./utils";

describe("utils", () => {
  it("merges class names and dedupes conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false, "font-medium")).toBe("text-sm font-medium");
  });

  it("formats currency without decimals", () => {
    expect(formatCurrency(12345)).toBe("$12,345");
  });

  it("formats compact values", () => {
    expect(formatCompact(1500000)).toBe("1.5M");
  });
});
