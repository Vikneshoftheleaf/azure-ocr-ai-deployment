"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Files,
  LayoutDashboard,
  Plus,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

export default function WorkspaceSidebar({ documentCount }) {
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  return (
    <aside className="workspace-sidebar">
      <Link href="/" className="brand-lockup">
        <span className="brand-symbol"><ScanLine size={20} strokeWidth={2.2} /></span>
        <span className="brand-wordmark">folio<span>DOC INTELLIGENCE</span></span>
      </Link>

      <div className="workspace-switcher">
        <span className="workspace-switcher-mark">A</span>
        <span className="workspace-switcher-copy"><strong>Azure Practice</strong><small>Personal workspace</small></span>
        <ChevronDown size={15} />
      </div>

      <div className="sidebar-group-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        <Link href="/" className={`sidebar-link${onDashboard ? " sidebar-link-active" : ""}`}><LayoutDashboard size={17} /><span>Overview</span></Link>
        <Link href="/#documents" className={`sidebar-link${!onDashboard ? " sidebar-link-active" : ""}`}><Files size={17} /><span>Documents</span>{documentCount != null && <span className="sidebar-count">{documentCount}</span>}</Link>
      </nav>

      <div className="sidebar-group-label sidebar-tools-label">TOOLS</div>
      <Link href="/#upload" className="sidebar-link"><Plus size={17} /><span>New analysis</span></Link>

      <div className="sidebar-spacer" />
      <div className="sidebar-supported"><div className="sidebar-supported-heading"><ShieldCheck size={15} /><span>SUPPORTED INPUTS</span></div><p>PDF, images, Office, HTML</p><div className="supported-rule"><span /></div><small>Processed with Azure AI</small></div>
      <div className="sidebar-profile"><span className="profile-avatar">AD</span><span className="profile-copy"><strong>Azure Practice</strong><small>Document workspace</small></span><span className="profile-online" /></div>
    </aside>
  );
}