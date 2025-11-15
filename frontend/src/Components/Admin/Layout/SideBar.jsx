// src/Admin/Layout/SideBar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getUser, isAdmin } from '../../Utils/helpers';
import '../../../Styles/sidebar.css';

const Sidebar = ({ isOpen, setIsOpen, user: propUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({ crud: false });
  const [user, setUser] = useState(propUser || {});

  // Update user when prop changes or on mount
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    } else {
      const currentUser = getUser();
      setUser(currentUser || {});
    }
  }, [propUser]);

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
  }, [navigate]);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const crudRoutes = [
      '/admin/products',
      '/admin/categories',
      '/admin/teams',
    ];
    if (crudRoutes.includes(location.pathname)) {
      setExpandedMenus((prev) => ({ ...prev, crud: true }));
    }
  }, [location.pathname]);

  const handleLinkClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth <= 992) {
      setIsOpen(false);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    
    logout(() => {
      // Clear any remaining storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Redirect to home
      window.location.href = '/';
    });
  };

  // Don't render sidebar if not admin
  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      {/* Overlay - show when sidebar is open */}
      {isOpen && (
        <div 
          className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
          onClick={() => setIsOpen(false)} 
        />
      )}

      <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
        <nav id="sidebar">
          <div className="sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3>Admin Panel</h3>
                {user && user.first_name && (
                  <p className="sidebar-user-info">
                    Welcome, {user.first_name} {user.last_name}
                  </p>
                )}
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
          </div>

          <ul className="list-unstyled components">
            {/* Dashboard */}
            <li className={isActive('/dashboard') ? 'active' : ''}>
              <Link to="/dashboard" onClick={handleLinkClick}>
                <i className="fa fa-tachometer"></i> Dashboard
              </Link>
            </li>

            {/* CRUD Management */}
            <li className={expandedMenus.crud ? 'active' : ''}>
              <a
                href="#crudSubmenu"
                onClick={(e) => {
                  e.preventDefault();
                  setExpandedMenus((prev) => ({
                    ...prev,
                    crud: !prev.crud,
                  }));
                }}
                className={`dropdown-toggle ${expandedMenus.crud ? 'expanded' : ''}`}
              >
                <i className="fa fa-database"></i> CRUD Management
                <i className={`fa fa-chevron-${expandedMenus.crud ? 'down' : 'right'} arrow`}></i>
              </a>
              <ul
                className={`collapse list-unstyled ${expandedMenus.crud ? 'show' : ''}`}
                id="crudSubmenu"
              >
                <li className={isActive('/admin/products') ? 'active' : ''}>
                  <Link to="/admin/products" onClick={handleLinkClick}>
                    <i className="fa fa-shopping-bag"></i> Products
                  </Link>
                </li>
                <li className={isActive('/admin/categories') ? 'active' : ''}>
                  <Link to="/admin/categories" onClick={handleLinkClick}>
                    <i className="fa fa-tags"></i> Categories
                  </Link>
                </li>
                <li className={isActive('/admin/teams') ? 'active' : ''}>
                  <Link to="/admin/teams" onClick={handleLinkClick}>
                    <i className="fa fa-users"></i> Teams
                  </Link>
                </li>
              </ul>
            </li>

            {/* Orders */}
            <li className={isActive('/admin/orders') ? 'active' : ''}>
              <Link to="/admin/orders" onClick={handleLinkClick}>
                <i className="fa fa-shopping-basket"></i> Orders
              </Link>
            </li>

            {/* Users */}
            <li className={isActive('/admin/users') ? 'active' : ''}>
              <Link to="/admin/users" onClick={handleLinkClick}>
                <i className="fa fa-users"></i> Users
              </Link>
            </li>

            {/* Reviews */}
            <li className={isActive('/admin/reviews') ? 'active' : ''}>
              <Link to="/admin/reviews" onClick={handleLinkClick}>
                <i className="fa fa-star"></i> Reviews
              </Link>
            </li>

            {/* Admin Profile */}
            <li className={isActive('/me') ? 'active' : ''}>
              <Link to="/me" onClick={handleLinkClick}>
                <i className="fa fa-user-circle"></i> My Profile
              </Link>
            </li>

            {/* Logout */}
            <li>
              <a
                href="/"
                onClick={handleLogout}
                style={{ cursor: 'pointer' }}
              >
                <i className="fa fa-sign-out"></i> Logout
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;