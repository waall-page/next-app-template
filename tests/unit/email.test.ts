import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nodemailer from "nodemailer";
import { sendEmail } from "@/lib/email";

// nodemailer のモック作成
const mockSendMail = vi.fn();
vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn(),
    },
  };
});

describe("lib/email.ts - sendEmail", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockSendMail.mockResolvedValue({ messageId: "test-message-id-123" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("正常系", () => {
    it("Mailpit設定（ローカル開発 / 認証なし / ポート1025）で正常にメール送信できること", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "1025";
      process.env.SMTP_FROM = "Local Sender <noreply@email.local>";
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.SMTP_SECURE;

      const result = await sendEmail({
        to: "user@example.com",
        subject: "テスト件名",
        html: "<p>テスト本文</p>",
      });

      // トランスポート生成オプションの検証（認証なし、secure: false）
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "localhost",
        port: 1025,
        secure: false,
      });

      // sendMail の呼び出し検証
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Local Sender <noreply@email.local>",
        to: "user@example.com",
        subject: "テスト件名",
        html: "<p>テスト本文</p>",
        text: "テスト本文",
      });

      expect(result.messageId).toBe("test-message-id-123");
    });

    it("Resend本番設定（SSL / 認証あり / ポート465）で secure: true と auth が設定されること", async () => {
      process.env.SMTP_HOST = "smtp.resend.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "resend";
      process.env.SMTP_PASS = "re_test_api_key_12345";
      process.env.SMTP_FROM = "Sender Name <onboarding@resend.dev>";

      await sendEmail({
        to: "user@example.com",
        subject: "本番テスト件名",
        html: "<p>本番テスト本文</p>",
      });

      // ポート465では自動的に secure: true になり、auth が渡されること
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: "re_test_api_key_12345",
        },
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Sender Name <onboarding@resend.dev>",
        to: "user@example.com",
        subject: "本番テスト件名",
        html: "<p>本番テスト本文</p>",
        text: "本番テスト本文",
      });
    });

    it("Resend設定（TLS / 認証あり / ポート587）で secure: false と auth が設定されること", async () => {
      process.env.SMTP_HOST = "smtp.resend.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "resend";
      process.env.SMTP_PASS = "re_test_api_key_12345";
      process.env.SMTP_FROM = "Sender Name <onboarding@resend.dev>";

      await sendEmail({
        to: "user@example.com",
        subject: "TLSテスト",
        html: "<p>TLSテスト本文</p>",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.resend.com",
        port: 587,
        secure: false,
        auth: {
          user: "resend",
          pass: "re_test_api_key_12345",
        },
      });
    });

    it("SMTP_SECURE が明示された場合はポート番号に関わらずその値が優先されること", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_SECURE = "true";
      process.env.SMTP_FROM = "noreply@example.com";

      await sendEmail({
        to: "user@example.com",
        subject: "Secure Test",
        html: "<p>Secure</p>",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: true,
      });
    });

    it("カスタムの from アドレスが指定された場合はそれが優先されること", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "1025";
      process.env.SMTP_FROM = "Default <default@example.com>";

      await sendEmail({
        from: "Custom Sender <custom@example.com>",
        to: "user@example.com",
        subject: "Custom From",
        html: "<p>Custom</p>",
        text: "Custom Text",
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Custom Sender <custom@example.com>",
        to: "user@example.com",
        subject: "Custom From",
        html: "<p>Custom</p>",
        text: "Custom Text",
      });
    });
  });

  describe("異常系", () => {
    it("SMTP_HOST が未設定の場合はエラーをスローすること", async () => {
      delete process.env.SMTP_HOST;
      process.env.SMTP_PORT = "1025";
      process.env.SMTP_FROM = "noreply@example.com";

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow('[Env Error] 必須の環境変数 "SMTP_HOST" が設定されていません。');
    });

    it("SMTP_PORT が未設定の場合はエラーをスローすること", async () => {
      process.env.SMTP_HOST = "localhost";
      delete process.env.SMTP_PORT;
      process.env.SMTP_FROM = "noreply@example.com";

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow('[Env Error] 必須の環境変数 "SMTP_PORT" が設定されていません。');
    });

    it("SMTP_PORT が有効な数値でない場合はエラーをスローすること", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "invalid-port";
      process.env.SMTP_FROM = "noreply@example.com";

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow('[Env Error] SMTP_PORT ("invalid-port") が有効な数値ではありません。');
    });

    it("SMTP_FROM が未設定の場合はエラーをスローすること", async () => {
      process.env.SMTP_HOST = "localhost";
      process.env.SMTP_PORT = "1025";
      delete process.env.SMTP_FROM;

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow('[Env Error] 必須の環境変数 "SMTP_FROM" が設定されていません。');
    });
  });
});
