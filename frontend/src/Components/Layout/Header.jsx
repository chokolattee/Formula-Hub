import React, { useState, useEffect } from 'react';
import '../../App.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from '../Utils/helpers';
import { toast } from 'react-toastify';
import { FaSearch, FaShoppingBag, FaUser, FaSignInAlt } from "react-icons/fa";
import Sidebar from '../Admin/Layout/SideBar';

const Header = ({ cartItems }) => {
    const [user, setUser] = useState({});
    const [isScrolled, setIsScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const logoutHandler = () => {
        logout(navigate('/'));
        toast.success('Logged out successfully', { position: 'bottom-right' });
    };

    const handleScroll = () => setIsScrolled(window.scrollY >= 800);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search/${encodeURIComponent(searchQuery)}`);
        }
    };

    useEffect(() => {
        setUser(getUser());
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

   
    useEffect(() => {
        if (location.pathname === '/') {
            setSearchQuery('');
        }
    }, [location.pathname]);

    if (user?.role === 'admin') {
        return <Sidebar />;
    }

    return (
        <div id="navbar" className={`client-header ${isScrolled ? 'scrolled' : 'not-scrolled'}`}>
            <nav className='client-navigation'>
                <div className="title-container">
                    <Link to="/">
                        <img src="/images/logo.png" alt="Formula Hub" />
                    </Link>
                </div>

                <div className="left-navigation">
                    <Link to="/">Home</Link>
                    <Link to="/store">Store</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/support">Support</Link>
                </div>

                <div className="right-actions">
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>

                    {user && (
                        <Link to="/cart" className="cart-link">
                            <FaShoppingBag />
                            {cartItems && cartItems.length > 0 && (
                                <span className="custom-badge">{cartItems.length}</span>
                            )}
                        </Link>
                    )}

                    {user ? (
                        <div className="user-dropdown-container">
                            <FaUser
                                className='icon-link'
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            />
                            {dropdownOpen && (
                                <div className="dropdown-menu-custom">
                                    {user.role === 'admin' && (
                                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>
                                            <div className="dropdown-item-custom">Dashboard</div>
                                        </Link>
                                    )}
                                    <Link to="/me" onClick={() => setDropdownOpen(false)}>
                                        <div className="dropdown-item-custom">Profile</div>
                                    </Link>
                                    <Link to="/orders/me" onClick={() => setDropdownOpen(false)}>
                                        <div className="dropdown-item-custom">My Orders</div>
                                    </Link>
                                    <Link to="/reviews/me" onClick={() => setDropdownOpen(false)}>
                                        <div className="dropdown-item-custom">My Reviews</div>
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/" onClick={() => { logoutHandler(); setDropdownOpen(false); }}>
                                        <div className="dropdown-item-custom logout-item">Logout</div>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="login-icon-link" title="Login">
                            <FaSignInAlt />
                        </Link>

                    )}
                </div>
            </nav>

            <style jsx>{`
                :root {
                    --primary-color: #E10600;
                    --secondary-color: #1A1A1A;
                    --accent-color: #FF1E00;
                    --text-light: #FFFFFF;
                    --border-color: #333333;
                    --hover-color: #B80500;
                }

                .client-header {
                    width: 100%;
                    background: linear-gradient(135deg, #1A1A1A 0%, #0d0d0d 100%);
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    border-bottom: 3px solid var(--primary-color);
                    box-shadow: 0 4px 20px rgba(225, 6, 0, 0.3);
                }

                .client-header.scrolled {
                    background: linear-gradient(135deg, #0d0d0d 0%, #000000 100%);
                    box-shadow: 0 6px 30px rgba(225, 6, 0, 0.5);
                }

                .client-navigation {
                    width: 100%;
                    margin: 0;
                    padding: 1rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                }

                .title-container {
                    flex-shrink: 0;
                }

                .title-container img {
                    height: 50px;
                    width: auto;
                    filter: drop-shadow(0 0 10px rgba(225, 6, 0, 0.5));
                    transition: transform 0.3s ease;
                }

                .title-container img:hover {
                    transform: scale(1.05);
                }

                .left-navigation {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    flex: 1;
                }

                .left-navigation a {
                    color: var(--text-light);
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    padding: 0.5rem 1rem;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .left-navigation a::before {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 2px;
                    background: var(--primary-color);
                    transition: width 0.3s ease;
                }

                .left-navigation a:hover {
                    color: var(--primary-color);
                }

                .left-navigation a:hover::before {
                    width: 80%;
                }

                .right-actions {
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
                    flex-shrink: 0;
                }

                .search-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .search-icon {
                    position: absolute;
                    left: 10px;
                    color: var(--text-light);
                    font-size: 14px;
                }

                .search-input {
                    padding: 6px 10px 6px 32px;
                    border-radius: 6px;
                    border: 1px solid var(--primary-color);
                    outline: none;
                    background: transparent;
                    color: var(--text-light);
                    font-size: 14px;
                    transition: all 0.3s ease;
                    width: 160px;
                }

                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .search-input:focus {
                    border-color: var(--hover-color);
                    box-shadow: 0 0 8px rgba(225, 6, 0, 0.4);
                    width: 200px;
                }

                .icon-link,
                .login-icon-link {
                    color: white;
                    background: transparent;
                    font-size: 35px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 0.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-link:hover,
                .login-icon-link:hover {
                    color: var(--primary-color);
                    background: rgba(225, 6, 0, 0.1);
                    transform: scale(1.1);
                }

                .cart-link {
                    position: relative;
                    color: var(--text-light);
                    font-size: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 0.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cart-link:hover {
                    color: var(--primary-color);
                    background: rgba(225, 6, 0, 0.1);
                    transform: scale(1.1);
                }

                .custom-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--hover-color) 100%);
                    color: var(--text-light);
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    border: 2px solid #0d0d0d;
                    box-shadow: 0 2px 8px rgba(225, 6, 0, 0.5);
                }

                .user-dropdown-container {
                    position: relative;
                }

                .dropdown-menu-custom {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: linear-gradient(135deg, var(--secondary-color) 0%, #0d0d0d 100%);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    min-width: 200px;
                    box-shadow: 0 8px 24px rgba(225, 6, 0, 0.3);
                    overflow: hidden;
                    z-index: 1001;
                }

                .dropdown-item-custom {
                    padding: 0.75rem 1.25rem;
                    color: var(--text-light);
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    border-left: 3px solid transparent;
                }

                .dropdown-item-custom:hover {
                    background: rgba(225, 6, 0, 0.15);
                    border-left-color: var(--primary-color);
                    padding-left: 1.5rem;
                }

                .dropdown-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 0.5rem 0;
                }

                .logout-item {
                    color: var(--primary-color) !important;
                }

                .logout-item:hover {
                    background: rgba(225, 6, 0, 0.2) !important;
                }

                /* Responsive Design */
                @media (max-width: 992px) {
                    .client-navigation {
                        padding: 1rem;
                    }

                    .left-navigation {
                        gap: 1rem;
                    }

                    .left-navigation a {
                        font-size: 14px;
                        padding: 0.4rem 0.8rem;
                    }
                }

                @media (max-width: 768px) {
                    .client-navigation {
                        flex-wrap: wrap;
                    }

                    .title-container {
                        order: 1;
                    }

                    .right-actions {
                        order: 2;
                    }

                    .left-navigation {
                        order: 3;
                        width: 100%;
                        justify-content: flex-start;
                        margin-top: 0.5rem;
                    }

                    .left-navigation {
                        gap: 0.75rem;
                    }

                    .left-navigation a {
                        font-size: 12px;
                        padding: 0.3rem 0.6rem;
                    }

                    .title-container img {
                        height: 40px;
                    }
                }

                @media (max-width: 576px) {
                    .client-navigation {
                        padding: 0.75rem;
                    }

                    .left-navigation {
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }

                    .right-actions {
                        gap: 1rem;
                    }

                    .icon-link,
                    .login-icon-link {
                        font-size: 35px;
                    }

                    .search-input {
                        width: 120px;
                    }

                    .search-input:focus {
                        width: 150px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Header;