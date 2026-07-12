import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data.product));
  }, [id]);

  if (!product) return <div className="container section">Loading...</div>;

  return (
    <div className="container section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
      <div className="product-thumb" style={{ aspectRatio: '1/1', borderRadius: 16 }}>
        {product.images?.[0] ? <img src={product.images[0]} alt={product.title} /> : 'No image'}
      </div>
      <div>
        <h1 className="page-title" style={{ marginTop: 0 }}>{product.title}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>{product.description}</p>
        <p className="product-price" style={{ fontSize: 32 }}>${product.price.toFixed(2)}</p>
        <p className="product-meta">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'} · Category: {product.category}
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '20px 0' }}>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={{ width: 70, padding: 10, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text)' }}
          />
          <button className="btn btn-primary" disabled={product.stock <= 0} onClick={() => addItem(product, qty)}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
