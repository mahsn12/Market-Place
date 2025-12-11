import React from "react";
import Footer from "./Footer";
import "../Style/PageLayout.css";

export default function PageLayout({ title, children, showHeader = true }) {
  return (
    <div className="page-layout">
      {showHeader && (
        <div className="page-header">
          <h1 className="page-title">{title}</h1>
        </div>
      )}
      <main className="page-content">{children}</main>
      <Footer />
    </div>
  );
}
