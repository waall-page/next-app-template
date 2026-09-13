import { describe, it, expect, afterEach, vi } from "vitest";
import { requireEnv } from "@/lib/env";

describe("lib/env.ts - requireEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("正常系", () => {
    it("環境変数が存在する場合はその値を返すこと", () => {
      vi.stubEnv("TEST_VAR", "hello_world");
      expect(requireEnv("TEST_VAR")).toBe("hello_world");
    });

    it("前後にスペースを含む場合でもそのままの値を返すこと（仕様確認）", () => {
      vi.stubEnv("TEST_VAR", "  hello_world  ");
      expect(requireEnv("TEST_VAR")).toBe("  hello_world  ");
    });
  });

  describe("異常系", () => {
    it("環境変数が未定義の場合はエラーをスローすること（デフォルト補完しない）", () => {
      delete process.env.TEST_VAR;
      expect(() => requireEnv("TEST_VAR")).toThrow(
        '[Env Error] 必須の環境変数 "TEST_VAR" が設定されていません。'
      );
    });

    it("環境変数が空文字列またはスペースのみの場合もエラーをスローすること", () => {
      vi.stubEnv("TEST_VAR", "   ");
      expect(() => requireEnv("TEST_VAR")).toThrow(
        '[Env Error] 必須の環境変数 "TEST_VAR" が設定されていません。'
      );
    });
  });
});
