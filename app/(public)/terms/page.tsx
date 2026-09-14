import { getLegalDocument } from "@/lib/legal";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getLegalDocument("terms");
  return {
    title: doc.metadata.title,
    description: "サービスの利用規約です。",
  };
}

export default async function TermsPage() {
  const doc = await getLegalDocument("terms");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {doc.metadata.title}
          </h1>
          <div className="mt-2 text-xs text-slate-500 flex gap-4">
            <span>版数: v{doc.metadata.version}</span>
            <span>施行日: {doc.metadata.effectiveDate}</span>
            <span>改定日: {doc.metadata.updatedAt}</span>
          </div>
        </div>

        <div
          className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </div>
    </div>
  );
}
