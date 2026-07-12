import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="page-title">Your cart</h1>
      <div className="card">
        {items.map((item) => (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{item.title}</div>
              <div className="product-meta">${item.price.toFixed(2)} each</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                style={{ width: 60, padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text)' }}
              />
              <div style={{ width: 80, textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</div>
              <button className="btn btn-outline" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Total</div>
          <div className="product-price" style={{ fontSize: 22 }}>${totalAmount.toFixed(2)}</div>
        </div>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 16 }}
          onClick={() => navigate(user ? '/checkout' : '/login')}
        >
          {user ? 'Proceed to checkout' : 'Log in to checkout'}
        </button>
      </div>
    </div>
  );
}
