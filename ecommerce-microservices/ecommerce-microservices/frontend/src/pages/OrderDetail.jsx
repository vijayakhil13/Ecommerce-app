import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import SagaTracker from '../components/SagaTracker';

const TERMINAL_STATES = ['CONFIRMED', 'INVENTORY_FAILED', 'PAYMENT_FAILED', 'CANCELLED'];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const intervalRef = useRef(null);

  async function fetchOrder() {
    const { data } = await api.get(`/orders/${id}`);
    setOrder(data.order);
    if (TERMINAL_STATES.includes(data.order.status) && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  useEffect(() => {
    fetchOrder();
    // Poll every 2s so the UI reflects the async Kafka saga (inventory + payment services)
    intervalRef.current = setInterval(fetchOrder, 2000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  if (!order) return <div className="container section">Loading order...</div>;

  return (
    <div className="container section" style={{ maxWidth: 700 }}>
      <h1 className="page-title">Order #{order._id.slice(-8)}</h1>
      <div className="card">
        <SagaTracker status={order.status} />
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
          Status updates arrive via Kafka events from inventory-service and payment-service — no manual refresh needed.
        </p>

        <h3>Items</h3>
        {order.items.map((item) => (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>{item.title} × {item.quantity}</div>
            <div>${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
          <div style={{ fontWeight: 600 }}>Total</div>
          <div className="product-price">${order.totalAmount.toFixed(2)}</div>
        </div>

        {order.shippingAddress && (
          <>
            <h3>Shipping address</h3>
            <p>{order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
          </>
        )}
      </div>
    </div>
  );
}
