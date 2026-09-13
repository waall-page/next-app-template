import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getLegalDocument, getLatestTermsVersion } from "@/lib/legal";

describe("Legal Document Utility", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, APP_URL: "http://test.local" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getLegalDocument", () => {
    describe("正常系", () => {
      it("terms を指定した場合に利用規約のメタデータとHTMLコンテンツを取得できること", async () => {
        const doc = await getLegalDocument("terms");

        expect(doc.metadata.title).toContain("利用規約");
        expect(typeof doc.metadata.version).toBe("string");
        expect(doc.metadata.version.length).toBeGreaterThan(0);
        expect(typeof doc.html).toBe("string");
        expect(doc.html).toContain("<h1");
        expect(doc.html).toContain("第1条");
      });

      it("privacy を指定した場合にプライバシーポリシーのメタデータとHTMLコンテンツを取得できること", async () => {
        const doc = await getLegalDocument("privacy");

        expect(doc.metadata.title).toContain("プライバシーポリシー");
        expect(typeof doc.metadata.version).toBe("string");
        expect(doc.metadata.version.length).toBeGreaterThan(0);
        expect(typeof doc.html).toBe("string");
        expect(doc.html).toContain("<h1");
        expect(doc.html).toContain("1. 取得する情報");
      });
    });

    describe("異常系", () => {
      it("存在しないドキュメント種別を指定した場合はエラーをスローすること", async () => {
        await expect(
          getLegalDocument("non-existent" as "terms" | "privacy")
        ).rejects.toThrow("指定された法的ドキュメントが存在しません: non-existent");
      });
    });
  });

  describe("getLatestTermsVersion", () => {
    describe("正常系", () => {
      it("最新の利用規約バージョン文字列を取得できること", async () => {
        const version = await getLatestTermsVersion();
        const termsDoc = await getLegalDocument("terms");

        expect(typeof version).toBe("string");
        expect(version.length).toBeGreaterThan(0);
        expect(version).toBe(termsDoc.metadata.version);
      });
    });
  });
});
