import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LegalDoc() {
  const { doc } = useParams();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHtml('');
    setError('');
    fetch(`${BASE_URL}/legal/${doc}`)
      .then(r => { if (!r.ok) throw new Error('Document not found'); return r.json(); })
      .then(({ content }) => setHtml(marked.parse(content)))
      .catch(err => setError(err.message));
  }, [doc]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 20px' }}>
      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link to="/login" style={{ color: 'var(--accent)', fontSize: 13 }}>&larr; Back to login</Link>
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
        {html && <div className="legal-doc" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
