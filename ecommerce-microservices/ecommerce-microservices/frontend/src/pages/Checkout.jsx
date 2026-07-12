import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ line1: '', city: '', state: '', postalCode: '', country: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/orders', { items, shippingAddress: address });
      clearCart();
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 600 }}>
      <h1 className="page-title">Checkout</h1>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Shipping address</h3>
        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <form onSubmit={handlePlaceOrder}>
          <div className="form-group">
            <label>Address line</label>
            <input required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>City</label>
              <input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input required value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Postal code</label>
              <input required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input required value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
            <div>Order total</div>
            <div className="product-price">${totalAmount.toFixed(2)}</div>
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting || items.length === 0} type="submit">
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
            Placing an order publishes an <code>order.created</code> event to Kafka. Inventory and payment
            services process it asynchronously — you'll see live status on the next screen.
          </p>
        </form>
      </div>
    </div>
  );
}
