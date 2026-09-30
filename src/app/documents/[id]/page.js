"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clipboard,
  Clock3,
  FileText,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import WorkspaceSidebar from "@/app/components/workspace-sidebar";

export default function DocumentPage({ params }) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showFullText, setShowFullText] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [textSearch, setTextSearch] = useState("");
  const [copied, setCopied] = useState(false);

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

  async function copyText() {
    if (!document?.ocr_text) return;
    await navigator.clipboard.writeText(document.ocr_text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const extractedText = document?.ocr_text || "";
  const wordCount = extractedText.trim()
    ? extractedText.trim().split(/\s+/).length
    : 0;
  const extension = document?.filename?.split(".").pop()?.toUpperCase() || "FILE";
  const matchingLines = textSearch.trim()
    ? extractedText
        .split(/\r?\n/)
        .filter((line) => line.toLowerCase().includes(textSearch.trim().toLowerCase()))
        .join("\n")
    : "";
  const visibleText = textSearch.trim()
    ? matchingLines
    : showFullText
      ? extractedText
      : extractedText.slice(0, 1800);

  if (loading) {
    return (
      <div className="workspace-shell">
        <WorkspaceSidebar />
        <main className="workspace-main"><div className="detail-loading"><span className="loading-orbit" />Loading document</div></main>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="workspace-shell">
        <WorkspaceSidebar />
        <main className="workspace-main"><div className="detail-error"><p>DOCUMENT UNAVAILABLE</p><h1>We couldn’t open this document.</h1><span>{error}</span><Link href="/" className="button-secondary"><ArrowLeft size={15} /> Back to library</Link></div></main>
      </div>
    );
  }

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar />
      <main className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/">Workspace</Link><ChevronRight size={14} /><strong>Document</strong></div>
          <div className="topbar-right"><span className="workspace-status"><span />Workspace active</span><div className="avatar-mark">AD</div></div>
        </header>

        <div className="detail-content">
          <Link className="back-link" href="/#documents"><ArrowLeft size={15} /> All documents</Link>
          <section className="detail-heading">
            <div className="detail-title-group">
              <div className="detail-file-icon"><FileText size={25} strokeWidth={1.65} /></div>
              <div className="detail-title-copy"><div className="eyebrow"><span className="eyebrow-line" />DOCUMENT RECORD</div><h1 title={document.filename}>{document.filename}</h1><div className="detail-subtitle"><span className="type-badge">{extension}</span><span>{document.content_type || "Document"}</span><span className="metadata-dot" /><Clock3 size={13} /><span>Added {new Date(document.created_at).toLocaleString()}</span></div></div>
            </div>
            <button className="button-primary summary-action" onClick={generateSummary} disabled={summarizing}>{summarizing ? <><span className="mini-spinner" /> Working</> : <><WandSparkles size={16} /> {document.summary ? "Refresh summary" : "Generate summary"}</>}</button>
          </section>

          <section className="detail-stats" aria-label="Document details">
            <div><span className="detail-stat-label">EXTRACTED WORDS</span><strong>{wordCount.toLocaleString()}</strong></div>
            <div><span className="detail-stat-label">CHARACTERS</span><strong>{extractedText.length.toLocaleString()}</strong></div>
            <div><span className="detail-stat-label">PROCESSING</span><strong className="status-complete"><span /> Complete</strong></div>
          </section>

          <div className="detail-tabs" role="tablist" aria-label="Document views">
            <button role="tab" aria-selected={activeTab === "overview"} className={activeTab === "overview" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("overview")}>Overview</button>
            <button role="tab" aria-selected={activeTab === "text"} className={activeTab === "text" ? "detail-tab active" : "detail-tab"} onClick={() => setActiveTab("text")}>Extracted text <span>{wordCount.toLocaleString()} words</span></button>
          </div>

          {activeTab === "overview" ? (
            <div className="overview-grid">
              <section className="detail-panel summary-panel">
                <div className="panel-heading"><div><div className="section-kicker">AI-POWERED INSIGHT</div><h2>Executive summary</h2></div><span className="summary-sparkle"><Sparkles size={17} /></span></div>
                {document.summary ? (
                  <>
                    <div className={`summary-copy${showFullSummary ? " summary-copy-open" : ""}`}>{document.summary}</div>
                    {document.summary.length > 420 && <button className="text-button" onClick={() => setShowFullSummary(!showFullSummary)}>{showFullSummary ? "Show less" : "Read full summary"}<ChevronRight className={showFullSummary ? "chevron-down" : ""} size={14} /></button>}
                  </>
                ) : (
                  <div className="summary-empty"><div className="summary-empty-icon"><WandSparkles size={18} /></div><div><strong>A clear summary, on demand</strong><p>Generate a concise overview of the key ideas and details in this document.</p></div><button className="text-button" onClick={generateSummary} disabled={summarizing}>{summarizing ? "Generating…" : "Create summary"}<ChevronRight size={14} /></button></div>
                )}
              </section>

              <aside className="detail-panel record-panel">
                <div className="section-kicker">RECORD DETAILS</div>
                <dl className="record-list"><div><dt>File name</dt><dd title={document.filename}>{document.filename}</dd></div><div><dt>Format</dt><dd>{extension}</dd></div><div><dt>Added</dt><dd>{new Date(document.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</dd></div><div><dt>Text detected</dt><dd>{wordCount.toLocaleString()} words</dd></div></dl>
                <div className="record-privacy"><Check size={14} /><span>OCR text saved to your document library</span></div>
              </aside>

              <section className="detail-panel preview-panel">
                <div className="panel-heading"><div><div className="section-kicker">FIRST LOOK</div><h2>Extracted text</h2></div><button className="button-tertiary" onClick={() => setActiveTab("text")}>Open full text <ArrowRight size={14} /></button></div>
                <div className="ocr-preview-box"><p>{extractedText.slice(0, 1050)}{extractedText.length > 1050 ? "…" : ""}</p>{extractedText.length > 1050 && <div className="preview-fade" />}</div>
                <div className="preview-footer"><span>{extractedText.length.toLocaleString()} characters captured</span><button className="text-button" onClick={() => setActiveTab("text")}>Explore extraction <ArrowRight size={14} /></button></div>
              </section>
            </div>
          ) : (
            <section className="detail-panel text-workspace">
              <div className="panel-heading text-panel-heading"><div><div className="section-kicker">OCR OUTPUT</div><h2>Extracted text</h2><p>Review and search the text detected in this document.</p></div><button className="button-secondary copy-button" onClick={copyText}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? "Copied" : "Copy text"}</button></div>
              <div className="text-toolbar"><label className="search-field text-search"><Search size={16} /><input value={textSearch} onChange={(event) => setTextSearch(event.target.value)} placeholder="Find in extracted text" aria-label="Find in extracted text" />{textSearch && <button className="search-clear" onClick={() => setTextSearch("")} aria-label="Clear text search"><span>×</span></button>}</label><span className="text-result-count">{textSearch ? `${matchingLines ? matchingLines.split("\n").length : 0} matching lines` : `${wordCount.toLocaleString()} words`}</span></div>
              <div className={`ocr-fulltext${showFullText && !textSearch ? " ocr-fulltext-expanded" : ""}`}><pre>{visibleText || (textSearch ? "No matching text found." : "No extracted text is available.")}</pre>{!showFullText && !textSearch && extractedText.length > 1800 && <div className="preview-fade" />}</div>
              {!textSearch && extractedText.length > 1800 && <button className="expand-text-button" onClick={() => setShowFullText(!showFullText)}>{showFullText ? "Collapse text" : "Show full extracted text"}<ChevronRight className={showFullText ? "chevron-down" : ""} size={15} /></button>}
            </section>
          )}

          {error && <p className="detail-inline-error" role="alert">{error}</p>}
          <footer className="dashboard-footer"><span>Folio <span className="footer-dot">·</span> Document intelligence workspace</span><span>Record ID {String(document.id)}</span></footer>
        </div>
      </main>
    </div>
  );
}