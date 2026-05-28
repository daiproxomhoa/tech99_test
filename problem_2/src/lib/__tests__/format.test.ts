import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatUsd,
  parseAmount,
  sanitizeAmountInput,
} from "../format";

describe("sanitizeAmountInput", () => {
  it("strips non-numeric characters", () => {
    expect(sanitizeAmountInput("1a2b3")).toBe("123");
    expect(sanitizeAmountInput("$1,234.50")).toBe("1234.50");
  });

  it("keeps only the first dot", () => {
    expect(sanitizeAmountInput("1.2.3")).toBe("1.23");
    expect(sanitizeAmountInput("..5")).toBe(".5");
  });

  it("treats comma as decimal separator (vi/fr)", () => {
    expect(sanitizeAmountInput("1,5")).toBe("1.5");
  });

  it("strips leading zeros but preserves 0.x", () => {
    expect(sanitizeAmountInput("007")).toBe("7");
    expect(sanitizeAmountInput("0.5")).toBe("0.5");
    expect(sanitizeAmountInput("0")).toBe("0");
  });
});

describe("parseAmount", () => {
  it("returns NaN for empty or dot-only input", () => {
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount(".")).toBeNaN();
  });

  it("parses valid numbers", () => {
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount("0")).toBe(0);
  });
});

describe("formatUsd (en)", () => {
  it("formats standard amounts with currency", () => {
    expect(formatUsd(1234.5, "en-US")).toMatch(/\$1,234\.50/);
  });

  it("shows <$0.01 for tiny non-zero values", () => {
    expect(formatUsd(0.001, "en-US")).toBe("<$0.01");
  });

  it("compacts values above 1M", () => {
    expect(formatUsd(2_500_000, "en-US")).toMatch(/2\.50?M/);
  });

  it("handles non-finite gracefully", () => {
    expect(formatUsd(Number.NaN, "en-US")).toMatch(/\$0\.00/);
  });
});

describe("formatUsd (vi)", () => {
  it("groups with a dot in Vietnamese locale", () => {
    // vi-VN uses '.' as the thousands separator and ',' as the decimal mark.
    expect(formatUsd(1234.5, "vi-VN")).toMatch(/1\.234,50/);
  });
});

describe("formatAmount", () => {
  it("uses 6 fraction digits for typical numbers", () => {
    expect(formatAmount(1.23456789, "en-US")).toBe("1.234568");
  });

  it("uses precision for tiny numbers", () => {
    expect(formatAmount(0.00001234, "en-US")).toBe("0.0000123");
  });

  it("compacts very large numbers", () => {
    expect(formatAmount(2_500_000, "en-US")).toMatch(/2\.5M/);
  });
});
