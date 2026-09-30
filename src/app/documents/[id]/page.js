"use client";

import { useEffect, useState } from "react";

export default function DocumentPage({ params }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDocument() {
      try {
        const { id } = await params;

        const response = await fetch(`/api/documents/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch document");
        }

        setDocument(data.document);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [params]);

  async function generateSummary() {
    try {
      setSummarizing(true);
      setError("");

      const { id } = await params;

      const response = await fetch(
        `/api/documents/${id}/summarize`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setDocument((previous) => ({
        ...previous,
        summary: data.summary,
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setSummarizing(false);
    }
  }

  if (loading) {
    return <main className="p-10">Loading...</main>;
  }

  if (error && !document) {
    return (
      <main className="p-10 text-red-600">
        {error}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">

        <a
          href="/"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back
        </a>

        {/* Document information */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            {document.filename}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {document.content_type}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {new Date(document.created_at).toLocaleString()}
          </p>
        </div>

        {/* AI Summary */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              AI Summary
            </h2>

            <button
              onClick={generateSummary}
              disabled={summarizing}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {summarizing
                ? "Generating..."
                : document.summary
                  ? "Regenerate"
                  : "Generate Summary"}
            </button>
          </div>

          {document.summary ? (
            <div className="mt-5 whitespace-pre-wrap rounded-lg bg-gray-50 p-5 text-sm leading-7">
              {document.summary}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-500">
              No summary generated yet.
            </p>
          )}
        </div>

        {/* OCR */}
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Extracted Text
          </h2>

          <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-6 text-sm leading-7">
            {document.ocr_text}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}