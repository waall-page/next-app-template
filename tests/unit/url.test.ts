import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getBaseUrl } from "@/lib/url";

describe("lib/url.ts - getBaseUrl", () => {
  beforeEach(() => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("正常系", () => {
    it("APP_URL が設定されている場合はその値を返すこと", () => {
      vi.stubEnv("APP_URL", "https://example.com");
      expect(getBaseUrl()).toBe("https://example.com");
    });

    it("APP_URL の末尾にスラッシュが含まれる場合はトリムして返すこと", () => {
      vi.stubEnv("APP_URL", "https://example.com///");
      expect(getBaseUrl()).toBe("https://example.com");
    });

    it("APP_URL が未設定で VERCEL_URL が設定されている場合は https:// を付与して返すこと", () => {
      vi.stubEnv("VERCEL_URL", "my-app-preview.vercel.app");
      expect(getBaseUrl()).toBe("https://my-app-preview.vercel.app");
    });

    it("VERCEL_URL にプロトコルが含まれている場合も正常に処理できること", () => {
      vi.stubEnv("VERCEL_URL", "https://my-app-preview.vercel.app/");
      expect(getBaseUrl()).toBe("https://my-app-preview.vercel.app");
    });

    it("APP_URL と VERCEL_URL の両方が設定されている場合は APP_URL が優先されること", () => {
      vi.stubEnv("APP_URL", "https://custom-domain.com");
      vi.stubEnv("VERCEL_URL", "my-app-preview.vercel.app");
      expect(getBaseUrl()).toBe("https://custom-domain.com");
    });
  });

  describe("異常系", () => {
    it("APP_URL と VERCEL_URL が両方未設定の場合はエラーをスローすること（Fail-Fast）", () => {
      expect(() => getBaseUrl()).toThrow(
        "[Env Error] APP_URL (または VERCEL_URL) が設定されていません。"
      );
    });

    it("APP_URL が空文字列または空白のみで VERCEL_URL も未設定の場合はエラーをスローすること", () => {
      vi.stubEnv("APP_URL", "   ");
      expect(() => getBaseUrl()).toThrow(
        "[Env Error] APP_URL (または VERCEL_URL) が設定されていません。"
      );
    });
  });
});
