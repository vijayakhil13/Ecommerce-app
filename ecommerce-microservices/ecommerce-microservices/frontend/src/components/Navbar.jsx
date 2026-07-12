import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">Zonto</Link>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            placeholder="Search products, brands, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <nav className="nav-links">
          <Link to="/cart">Cart<span className="cart-badge">{totalItems}</span></Link>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <Link to="/profile">Profile</Link>
              {user.roles?.includes('admin') && <Link to="/admin/system">System</Link>}
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
