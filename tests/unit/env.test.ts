import { describe, it, expect, afterEach, vi } from "vitest";
import {
  requireEnv,
  getRegistrationMode,
  isPublicRegistrationEnabled,
  isInvitationEnabled,
} from "@/lib/env";

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

describe("lib/env.ts - Registration Mode Helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getRegistrationMode & mode helpers", () => {
    it("未設定の場合はデフォルトで public モードになること", () => {
      delete process.env.REGISTRATION_MODE;
      delete process.env.AUTH_REGISTRATION_MODE;
      delete process.env.ENABLE_INVITATION;
      delete process.env.ENABLE_PUBLIC_REGISTRATION;

      expect(getRegistrationMode()).toBe("public");
      expect(isPublicRegistrationEnabled()).toBe(true);
      expect(isInvitationEnabled()).toBe(false);
    });

    it("REGISTRATION_MODE=invitation の場合は招待制モードになること", () => {
      vi.stubEnv("REGISTRATION_MODE", "invitation");

      expect(getRegistrationMode()).toBe("invitation");
      expect(isPublicRegistrationEnabled()).toBe(false);
      expect(isInvitationEnabled()).toBe(true);
    });

    it("REGISTRATION_MODE=disabled の場合は受付停止モードになること", () => {
      vi.stubEnv("REGISTRATION_MODE", "disabled");

      expect(getRegistrationMode()).toBe("disabled");
      expect(isPublicRegistrationEnabled()).toBe(false);
      expect(isInvitationEnabled()).toBe(false);
    });

    it("後方互換性: ENABLE_INVITATION=true かつ ENABLE_PUBLIC_REGISTRATION=false の場合は invitation モードになること", () => {
      delete process.env.REGISTRATION_MODE;
      vi.stubEnv("ENABLE_INVITATION", "true");
      vi.stubEnv("ENABLE_PUBLIC_REGISTRATION", "false");

      expect(getRegistrationMode()).toBe("invitation");
      expect(isPublicRegistrationEnabled()).toBe(false);
      expect(isInvitationEnabled()).toBe(true);
    });
  });
});

