"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  LayoutGrid,
  LoaderCircle,
  Plus,
  Presentation,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import WorkspaceSidebar from "@/app/components/workspace-sidebar";

const acceptedTypes =
  ".pdf,.jpg,.jpeg,.png,.bmp,.tif,.tiff,.heic,.heif,.docx,.xlsx,.pptx,.html,.htm";
const filters = ["All files", "PDF", "Images", "Office & HTML"];

function getExtension(filename = "") {
  return filename.split(".").pop()?.toLowerCase() || "file";
}

function getCategory(document) {
  const extension = getExtension(document.filename);
  const contentType = (document.content_type || "").toLowerCase();

  if (
    contentType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "bmp", "tif", "tiff", "heic", "heif"].includes(extension)
  ) {
    return "Images";
  }
  if (extension === "pdf" || contentType === "application/pdf") return "PDF";
  return "Office & HTML";
}

function getFileIcon(document) {
  const extension = getExtension(document.filename);
  const category = getCategory(document);

  if (category === "Images") return ImageIcon;
  if (extension === "xlsx") return FileSpreadsheet;
  if (extension === "pptx") return Presentation;
  if (["html", "htm"].includes(extension)) return FileCode2;
  if (["docx", "doc"].includes(extension)) return FileType;
  return FileText;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently added";

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return "Added today";
  if (days === 1) return "Added yesterday";
  if (days < 7) return `Added ${days} days ago`;
  return `Added ${formatDate(value)}`;
}

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All files");
  const [search, setSearch] = useState("");
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      try {
        const response = await fetch("/api/documents");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load documents.");
        if (isCurrent) setDocuments(data.documents || []);
      } catch (loadError) {
        if (isCurrent) setError(loadError.message);
      } finally {
        if (isCurrent) setLoadingDocuments(false);
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, []);

  const visibleDocuments = documents.filter((document) => {
    const matchesFilter = activeFilter === "All files" || getCategory(document) === activeFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      document.filename.toLowerCase().includes(query) ||
      (document.ocr_preview || "").toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const addedThisMonth = documents.filter(
    (document) => new Date(document.created_at) >= monthStart,
  ).length;
  const formatCount = new Set(documents.map(getCategory)).size;

  function chooseFile(file) {
    if (!file) return;
    setSelectedFile(file);
    setError("");
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Analysis failed.");
      }

      router.push(`/documents/${encodeURIComponent(data.id)}`);
    } catch (uploadError) {
      setError(uploadError.message);
      setUploading(false);
    }
  }

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar documentCount={documents.length} />
      <main className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>Dashboard</strong></div>
          <div className="topbar-right"><span className="workspace-status"><span />Workspace active</span><div className="avatar-mark">AD</div></div>
        </header>

        <div className="dashboard-content">
          <section className="page-intro">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />DOCUMENT INTELLIGENCE</div>
              <h1>Your document library</h1>
              <p>Scan, search, and revisit every document in one place.</p>
            </div>
            <a className="quiet-link" href="#documents">Browse library <ArrowRight size={15} /></a>
          </section>

          <section className="stats-grid" aria-label="Library overview">
            <div className="stat-block">
              <div className="stat-icon stat-icon-green"><LayoutGrid size={17} /></div>
              <div><span className="stat-label">IN YOUR LIBRARY</span><strong>{documents.length}</strong><span className="stat-note">{documents.length === 1 ? "document" : "documents"} total</span></div>
            </div>
            <div className="stat-block">
              <div className="stat-icon stat-icon-coral"><CalendarDays size={17} /></div>
              <div><span className="stat-label">THIS MONTH</span><strong>{addedThisMonth}</strong><span className="stat-note">newly analyzed</span></div>
            </div>
            <div className="stat-block">
              <div className="stat-icon stat-icon-blue"><Sparkles size={17} /></div>
              <div><span className="stat-label">FORMATS</span><strong>{formatCount}</strong><span className="stat-note">file types supported</span></div>
            </div>
          </section>

          <section className={`upload-panel${isDragging ? " upload-panel-dragging" : ""}`} id="upload">
            <div className="upload-panel-copy">
              <div className="upload-symbol"><UploadCloud size={21} strokeWidth={1.8} /></div>
              <div>
                <div className="upload-title-line"><h2>Analyze a document</h2><span className="new-tag">NEW SCAN</span></div>
                <p>Extract searchable text from a file with Azure AI.</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept={acceptedTypes}
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {!selectedFile ? (
              <div
                className="drop-zone"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                }}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
              >
                <span className="drop-copy"><strong>Drop a file here</strong><span>or choose from your device</span></span>
                <button className="button-secondary" type="button" onClick={(event) => { event.stopPropagation(); fileInputRef.current?.click(); }}><Plus size={15} /> Choose file</button>
              </div>
            ) : (
              <div className="selected-file-row">
                <div className="selected-file-info"><div className="file-icon file-icon-neutral"><FileText size={18} /></div><div className="selected-file-name"><strong title={selectedFile.name}>{selectedFile.name}</strong><span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Ready to scan</span></div><span className="ready-check"><Check size={14} /></span></div>
                <div className="selected-file-actions">
                  <button className="icon-button" aria-label="Remove selected file" title="Remove file" disabled={uploading} onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}><X size={17} /></button>
                  <button className="button-primary" disabled={uploading} onClick={handleAnalyze}>{uploading ? <><LoaderCircle className="spin" size={16} /> Analyzing</> : <><Sparkles size={15} /> Analyze file</>}</button>
                </div>
              </div>
            )}
            <div className="upload-footnote"><span>PDF</span><i /> <span>Images</span><i /> <span>Office</span><i /> <span>HTML</span><span className="upload-footnote-limit">One file at a time</span></div>
            {error && <p className="inline-error" role="alert">{error}</p>}
          </section>

          <section className="library-section" id="documents">
            <div className="section-heading">
              <div><div className="section-kicker">YOUR WORKSPACE</div><h2>Documents <span className="count-pill">{documents.length}</span></h2></div>
              <div className="library-meta"><Clock3 size={14} /> Latest activity first</div>
            </div>
            <div className="library-toolbar">
              <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search names or extracted text" aria-label="Search documents" />{search && <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}</label>
              <div className="filter-tabs" role="tablist" aria-label="Filter documents">
                {filters.map((filter) => <button key={filter} role="tab" aria-selected={activeFilter === filter} className={activeFilter === filter ? "filter-tab active" : "filter-tab"} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
              </div>
            </div>

            <div className="document-list">
              <div className="document-list-header"><span>DOCUMENT</span><span>TYPE</span><span>ADDED</span><span /></div>
              {loadingDocuments ? (
                <div className="list-state"><LoaderCircle className="spin" size={19} /> Loading your library</div>
              ) : visibleDocuments.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><FileText size={23} /></div><h3>{documents.length ? "No matching documents" : "Your library is ready"}</h3><p>{documents.length ? "Try another search or file type." : "Upload a document above to create your first searchable record."}</p>{documents.length > 0 && <button className="text-button" onClick={() => { setSearch(""); setActiveFilter("All files"); }}>Clear filters</button>}</div>
              ) : (
                visibleDocuments.map((document) => {
                  const Icon = getFileIcon(document);
                  return (
                    <a className="document-row" key={document.id} href={`/documents/${document.id}`}>
                      <div className="document-primary"><div className={`file-icon ${getCategory(document) === "Images" ? "file-icon-image" : getCategory(document) === "PDF" ? "file-icon-pdf" : "file-icon-doc"}`}><Icon size={18} strokeWidth={1.8} /></div><div className="document-name-block"><strong title={document.filename}>{document.filename}</strong><span className="document-preview" title={document.ocr_preview || "No text preview available"}>{document.ocr_preview || "No text preview available"}</span></div></div>
                      <div className="document-type"><span className="type-badge">{getExtension(document.filename).toUpperCase()}</span><span>{getCategory(document)}</span></div>
                      <div className="document-date"><span>{formatDate(document.created_at)}</span><small>{formatRelativeDate(document.created_at)}</small></div>
                      <div className="document-open"><ArrowUpRight size={17} /></div>
                    </a>
                  );
                })
              )}
            </div>
            <div className="library-bottom-note"><span><Check size={13} /> OCR text is stored with each document</span><span>{visibleDocuments.length} of {documents.length} shown</span></div>
          </section>

          <footer className="dashboard-footer"><span>Folio <span className="footer-dot">·</span> Document intelligence workspace</span><span>Azure-connected document processing</span></footer>
        </div>
      </main>
    </div>
  );
}
