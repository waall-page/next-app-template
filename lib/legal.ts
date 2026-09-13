import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { getBaseUrl } from "@/lib/url";

export type LegalDocType = "terms" | "privacy";

export interface LegalMetadata {
  title: string;
  version: string;
  effectiveDate: string;
  updatedAt: string;
}

export interface LegalDocument {
  metadata: LegalMetadata;
  html: string;
  rawMarkdown: string;
}

/**
 * 指定された法的ドキュメント（利用規約 / プライバシーポリシー）を読み込み、
 * FrontmatterとHTMLに変換した本文を返します。
 */
export async function getLegalDocument(type: LegalDocType): Promise<LegalDocument> {
  const allowedTypes: LegalDocType[] = ["terms", "privacy"];
  if (!allowedTypes.includes(type)) {
    throw new Error(`指定された法的ドキュメントが存在しません: ${type}`);
  }

  const filePath = path.join(process.cwd(), "content", "legal", `${type}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const metadata: LegalMetadata = {
    title: (data.title as string) || "",
    version: (data.version as string) || "1.0.0",
    effectiveDate: (data.effectiveDate as string) || "",
    updatedAt: (data.updatedAt as string) || "",
  };

  // ドメインを環境変数（APP_URL / VERCEL_URL）から動的に取得
  const baseUrl = getBaseUrl();
  const contactUrl = `${baseUrl}/contact`;

  // Markdown内のプレースホルダーを変数で置換
  const processedMarkdown = content
    .replaceAll("{{CONTACT_URL}}", contactUrl)
    .replaceAll("{{BASE_URL}}", baseUrl);

  // marked で Markdown を HTML に変換（同期/Promise両対応）
  const html = await marked.parse(processedMarkdown);

  return {
    metadata,
    html,
    rawMarkdown: processedMarkdown,
  };
}

/**
 * 最新の利用規約バージョン文字列を取得します。
 */
export async function getLatestTermsVersion(): Promise<string> {
  const doc = await getLegalDocument("terms");
  return doc.metadata.version;
}
