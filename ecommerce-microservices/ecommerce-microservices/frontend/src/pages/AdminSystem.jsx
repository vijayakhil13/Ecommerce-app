import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Admin dashboard: calls the gateway's aggregated /api/system/db-info endpoint,
// which fans out to every microservice's own /db-info route.
export default function AdminSystem() {
  const [dbInfo, setDbInfo] = useState(null);
  const [health, setHealth] = useState(null);

  async function refresh() {
    const [dbRes, healthRes] = await Promise.all([
      api.get('/system/db-info'),
      api.get('/system/health'),
    ]);
    setDbInfo(dbRes.data.services);
    setHealth(healthRes.data.services);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  if (!dbInfo) return <div className="container section">Checking system status...</div>;

  return (
    <div className="container section">
      <h1 className="page-title">System & database status</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Live view aggregated from every microservice's <code>/db-info</code> and <code>/health</code> endpoint via the API gateway.
      </p>
      <div className="db-grid">
        {Object.entries(dbInfo).map(([service, info]) => (
          <div key={service} className="card db-card">
            <h3>
              <span
                className="db-dot"
                style={{ background: info.connected ? 'var(--color-success)' : 'var(--color-danger)' }}
              />
              {service}-service
            </h3>
            <div className="product-meta">API: {health?.[service] === 'up' ? 'up' : 'down'}</div>
            <div className="product-meta">DB connected: {String(info.connected)}</div>
            {info.dbName && <div className="product-meta">DB name: {info.dbName}</div>}
            {info.host && <div className="product-meta">Host: {info.host}</div>}
            {info.error && <div className="product-meta" style={{ color: 'var(--color-danger)' }}>Error: {info.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
