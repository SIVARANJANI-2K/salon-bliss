import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2>Salon Bliss</h2>
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
  <Link to="/services">Services</Link>
  <Link to="/bookings">My Bookings</Link>
        <Link to="/contact">Contact</Link>
        {user ? (
          <>
            <span style={{ color: 'var(--cream)' }}>
              Welcome, {user.name}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--cream)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'inherit'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth">Login / Signup</Link>
        )}
      </div>
    </nav>
  );
}
