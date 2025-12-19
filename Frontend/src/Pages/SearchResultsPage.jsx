import React, { useEffect, useState } from "react";
import "../Style/HomePage.css";
import { searchPostsByTitlePrefix } from "../apis/Postsapi";
import { useToast } from "../components/ToastContext";

export default function SearchResultsPage({ query, onNavigate }) {
  const { showError } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        const res = await searchPostsByTitlePrefix(query);
        setResults(res.result || []);
      } catch (e) {
        showError("Search failed");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Searching...</h3>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h3>No results found</h3>
          <p>Try a different keyword</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-section">
      <div className="products-header">
        <h2>Search results for “{query}”</h2>
        <span className="product-count">{results.length} result(s)</span>
      </div>

      <div className="products-grid">
        {results.map((post) => (
          <div
            key={post._id}
            className="product-card"
            onClick={() =>
              onNavigate("post-details", { post })
            }
            style={{ cursor: "pointer" }}
          >
            <div className="product-image">
              {post.images?.[0] ? (
                <img
                  src={post.images[0]}
                  alt={post.title}
                  className="product-img"
                />
              ) : (
                <div className="product-emoji">📦</div>
              )}
            </div>

            <div className="product-content">
              <h3 className="product-name">{post.title}</h3>

              <div className="product-footer">
                <span className="price">
                  ${post.price?.toFixed(2) || "Free"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
