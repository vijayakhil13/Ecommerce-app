import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function statusBadgeClass(status) {
  if (['CONFIRMED', 'INVENTORY_RESERVED', 'PAYMENT_COMPLETED'].includes(status)) return 'badge-success';
  if (['INVENTORY_FAILED', 'PAYMENT_FAILED', 'CANCELLED'].includes(status)) return 'badge-danger';
  return 'badge-pending';
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders').then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container section">Loading orders...</div>;

  return (
    <div className="container section">
      <h1 className="page-title">Your orders</h1>
      {orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {orders.map((o) => (
            <Link
              to={`/orders/${o._id}`}
              key={o._id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>Order #{o._id.slice(-8)}</div>
                <div className="product-meta">{new Date(o.createdAt).toLocaleString()} · {o.items.length} item(s)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="product-price" style={{ fontSize: 16 }}>${o.totalAmount.toFixed(2)}</div>
                <span className={`badge ${statusBadgeClass(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
