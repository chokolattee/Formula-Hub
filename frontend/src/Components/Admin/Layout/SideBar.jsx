import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../Utils/helpers';
import '../../../Styles/sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({ crud: false });

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const crudRoutes = [
      '/admin/products',
      '/admin/categories',
      '/admin/types',
      '/admin/teams',
    ];
    if (crudRoutes.includes(location.pathname)) {
      setExpandedMenus((prev) => ({ ...prev, crud: true }));
    }
  }, [location.pathname]);

  const handleLinkClick = () => {
    if (window.innerWidth <= 992) setIsOpen(false);
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
        <nav id="sidebar">
          <div className="sidebar-header">
            <h3>Admin Panel</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <i className="fa fa-times"></i>
            </button>
          </div>

          <ul className="list-unstyled components">
            {/* ✅ Dashboard - Only visible on /dashboard route */}
            {location.pathname === '/dashboard' && (
              <li className="active">
                <Link to="/dashboard" onClick={handleLinkClick}>
                  <i className="fa fa-tachometer"></i> Dashboard
                </Link>
              </li>
            )}

            {/* ✅ CRUD Management */}
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
                <li className={isActive('/admin/types') ? 'active' : ''}>
                  <Link to="/admin/types" onClick={handleLinkClick}>
                    <i className="fa fa-list-alt"></i> Types
                  </Link>
                </li>
                <li className={isActive('/admin/teams') ? 'active' : ''}>
                  <Link to="/admin/teams" onClick={handleLinkClick}>
                    <i className="fa fa-users"></i> Teams
                  </Link>
                </li>
              </ul>
            </li>

            {/* ✅ Orders */}
            <li className={isActive('/admin/orders') ? 'active' : ''}>
              <Link to="/admin/orders" onClick={handleLinkClick}>
                <i className="fa fa-shopping-basket"></i> Orders
              </Link>
            </li>

            {/* ✅ Users */}
            <li className={isActive('/admin/users') ? 'active' : ''}>
              <Link to="/admin/users" onClick={handleLinkClick}>
                <i className="fa fa-users"></i> Users
              </Link>
            </li>

            {/* ✅ Reviews */}
            <li className={isActive('/admin/reviews') ? 'active' : ''}>
              <Link to="/admin/reviews" onClick={handleLinkClick}>
                <i className="fa fa-star"></i> Reviews
              </Link>
            </li>

            {/* ✅ Logout */}
            <li>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                  window.location.href = '/';
                }}
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