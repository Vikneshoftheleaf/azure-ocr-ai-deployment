"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [error, setError] = useState("");

  async function fetchDocuments() {
    try {
      setLoadingDocuments(true);

      const response = await fetch("/api/documents");

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();

      setDocuments(data.documents);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDocuments(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleAnalyze() {
    if (!file) return;

    setLoading(true);
    setResult("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.text);

      // Refresh document list
      fetchDocuments();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}

        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            AI Document Analyzer
          </h1>

          <p className="mt-2 text-gray-600">
            Upload documents, extract text with Azure AI, and store them in
            Azure SQL.
          </p>
        </div>

        {/* Upload */}

        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Analyze Document</h2>

          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.heif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-5 block w-full text-sm"
          />

          {file && (
            <p className="mt-3 text-sm text-gray-500">Selected: {file.name}</p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Analyzing..." : "Analyze Document"}
          </button>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        {/* Current OCR result */}

        {result && (
          <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Extracted Text</h2>

            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-5 text-sm leading-7">
              {result}
            </div>
          </div>
        )}

        {/* Document history */}

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>

          {loadingDocuments ? (
            <p className="mt-4 text-gray-500">Loading documents...</p>
          ) : documents.length === 0 ? (
            <div className="mt-4 rounded-xl border bg-white p-8 text-center text-gray-500">
              No documents yet.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <a
                        href={`/documents/${document.id}`}
                        className="font-semibold text-gray-900 hover:underline"
                      >
                        {document.filename}
                      </a>

                      <p className="mt-1 text-xs text-gray-500">
                        {document.content_type}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500">
                      {new Date(document.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 max-h-32 overflow-hidden rounded-lg bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {document.ocr_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
