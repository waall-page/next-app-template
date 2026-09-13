import { requireEnv } from "../../lib/env";

export interface MailpitMessage {
  ID: string;
  MessageID: string;
  Subject: string;
  From: { Name: string; Address: string };
  To: Array<{ Name: string; Address: string }>;
  Created: string;
  Snippet: string;
}

export interface MailpitMessageDetail extends MailpitMessage {
  Text: string;
  HTML: string;
}

/**
 * Mailpit REST API ヘルパー
 */
export class MailpitClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = requireEnv("MAILPIT_API_URL");
  }

  /**
   * 受信トレイのメッセージ一覧を取得します
   */
  async getMessages(): Promise<MailpitMessage[]> {
    const res = await fetch(`${this.baseUrl}/messages`);
    if (!res.ok) {
      throw new Error(`Failed to fetch Mailpit messages: ${res.statusText}`);
    }
    const data = await res.json();
    return data.messages || [];
  }

  /**
   * 指定したメールアドレス宛の最新メールを取得します
   */
  async getLatestEmailTo(toAddress: string): Promise<MailpitMessageDetail | null> {
    const messages = await this.getMessages();
    const target = messages.find((m) =>
      m.To.some((recipient) => recipient.Address.toLowerCase() === toAddress.toLowerCase())
    );

    if (!target) return null;

    // 詳細（本文含む）を取得
    const res = await fetch(`${this.baseUrl}/message/${target.ID}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch Mailpit message detail for ID ${target.ID}: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * メール本文から URL（リンク）をすべて抽出します
   */
  extractUrls(textOrHtml: string): string[] {
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
    const matches = textOrHtml.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : [];
  }

  /**
   * Mailpitのすべてのメッセージを削除します（テスト前のクリーンアップ用）
   */
  async deleteAllMessages(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to delete Mailpit messages: ${res.statusText}`);
    }
  }
}
