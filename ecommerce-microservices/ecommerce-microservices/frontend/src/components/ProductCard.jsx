import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`}>
        <div className="product-thumb">
          {product.images?.[0] ? <img src={product.images[0]} alt={product.title} /> : 'No image'}
        </div>
      </Link>
      <Link to={`/products/${product._id}`}>
        <div className="product-title">{product.title}</div>
      </Link>
      <div className="product-meta">{product.category} · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
      <div className="product-price">${product.price.toFixed(2)}</div>
      <button
        className="btn btn-primary btn-block"
        disabled={product.stock <= 0}
        onClick={() => addItem(product, 1)}
      >
        Add to cart
      </button>
    </div>
  );
}
