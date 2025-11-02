import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader'
import Product from './Product/Product'
import Skeleton from '@mui/material/Skeleton';
import { FaFacebookSquare, FaInstagram, FaTwitterSquare } from "react-icons/fa";
import '../Styles/home.css'

const Home = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    let { keyword } = useParams();

    const observer = useRef()
    const lastProductRef = useCallback(node => {
        if (loadingMore) return
        if (observer.current) observer.current.disconnect()
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1)
            }
        })
        
        if (node) observer.current.observe(node)
    }, [loadingMore, hasMore])

    const getProducts = async (keyword = '', page = 1, isNewSearch = false) => {
        try {
            if (page === 1) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            let link = `http://localhost:8000/api/v1/product?keyword=${keyword}&page=${page}&limit=9`

            let res = await axios.get(link)
            console.log('API Response:', res.data)
            
            const newProducts = res.data.data || []
            const total = res.data.pagination?.total || 0
            const limit = res.data.pagination?.limit || 9
            
            if (page === 1 || isNewSearch) {
                setProducts(newProducts)
            } else {
                setProducts(prevProducts => [...prevProducts, ...newProducts])
            }
            
            const totalPages = Math.ceil(total / limit)
            setHasMore(page < totalPages)
            
            setLoading(false)
            setLoadingMore(false)
        } catch (error) {
            console.error('Error fetching products:', error)
            setLoading(false)
            setLoadingMore(false)
        }
    }

    // Initial load
    useEffect(() => {
        setLoading(true)
        setTimeout(() => {
            setProducts([])
            setCurrentPage(1)
            setHasMore(true)
            getProducts(keyword, 1, true)
        }, 500);
    }, [keyword]);

    // Load more products when page changes
    useEffect(() => {
        if (currentPage > 1) {
            getProducts(keyword, currentPage, false)
        }
    }, [currentPage]);
    
    return (
        <>
            <MetaData title={'FormulaHub | F1 Collectibles Store'} />
            {loading && currentPage === 1 ? <Loader /> : (
                <>
                    <section className="hero-section f1-hero">
                        <div className="racing-stripes"></div>
                        <div className="hero-content-wrapper">
                            <div className="hero-left-content">
                                <div className="hero-social-icons">
                                    <FaFacebookSquare />
                                    <FaInstagram />
                                    <FaTwitterSquare />
                                </div>
                                <h1 className="hero-main-title">FORMULA HUB</h1>
                                <p className="hero-subtitle">Premium F1 Collectibles & Racing Memorabilia</p>
                                <div className="hero-features-list">
                                    <div className="hero-feature-badge">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#DC0000"/>
                                        </svg>
                                        <span>Authentic Items</span>
                                    </div>
                                    <div className="hero-feature-badge">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z" fill="#DC0000"/>
                                        </svg>
                                        <span>Limited Editions</span>
                                    </div>
                                </div>
                                <button className="hero-cta-button">RACE TO SHOP</button>
                            </div>
                            <div className="hero-right-content">
                                <div className="hero-product-box hero-product-1">
                                    <div className="hero-product-content">
                                        <h3>RACING<br/>HELMET</h3>
                                        <p className="hero-product-price">$ 299.99</p>
                                    </div>
                                </div>
                                <div className="hero-product-box hero-product-2">
                                    <div className="hero-product-content">
                                        <h3>TEAM JERSEY<br/>2024</h3>
                                        <p className="hero-product-price">$ 89.99</p>
                                    </div>
                                </div>
                                <div className="hero-product-box hero-product-3">
                                    <div className="hero-product-content">
                                        <h3>1:18 SCALE<br/>MODEL</h3>
                                        <p className="hero-product-price">$ 159.99</p>
                                    </div>
                                </div>
                                <div className="hero-red-square"></div>
                                <div className="hero-black-square"></div>
                            </div>
                        </div>
                    </section>
                    <section className='light-section f1-section'>
                        <div className="section-header f1-section-header">
                            <div className="section-texts">
                                <div className="section-header__title f1-section-title">Championship Collection</div>
                                <div className="section-sub__header f1-subtitle">Official F1 Memorabilia & Collectibles</div>
                            </div>
                        </div>
                        <div className="store-primary f1-store">
                            {products && products.length > 0 ? (
                                products.map((product, index) => (
                                    <Product 
                                        key={product._id}
                                        product={product}
                                        lastProductRef={products.length === index + 1 ? lastProductRef : null}
                                    />
                                ))
                            ) : (
                                <div className="col-12 text-center">
                                    <p style={{ color: '#000' }}>No products found</p>
                                </div>
                            )}

                            {/* Loading Skeletons */}
                            {loadingMore && (
                                <>
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 0, 0, 0.1)' }} />
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 0, 0, 0.1)' }} />
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 0, 0, 0.1)' }} />
                                </>
                            )}
                        </div>
                    </section>
                </>
            )}
        </>
    )
}

export default Home