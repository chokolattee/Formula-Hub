import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Product from './Product/Product'
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader'
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Skeleton from '@mui/material/Skeleton'
import '../Styles/store.css'

const Store = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [price, setPrice] = useState([1, 10000])
    const [minPriceInput, setMinPriceInput] = useState('1')
    const [maxPriceInput, setMaxPriceInput] = useState('10000')
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState("")
    const [rating, setRating] = useState(0)
    const [showFilters, setShowFilters] = useState(true)
    const [priceDebounce, setPriceDebounce] = useState([1, 10000])

    let { keyword } = useParams()
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

    // PRICE SLIDER CHANGE
    const handlePriceChange = (e, newValue) => {
        setPrice(newValue)
        setMinPriceInput(newValue[0].toString())
        setMaxPriceInput(newValue[1].toString())
    }

    // PRICE SLIDER COMMIT 
    const handlePriceCommit = (e, newValue) => {
        setPriceDebounce(newValue)
    }

    // MIN PRICE INPUT CHANGE
    const handleMinPriceInput = (e) => {
        const value = e.target.value
        setMinPriceInput(value)
        
        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue >= 1 && numValue <= price[1]) {
            setPrice([numValue, price[1]])
            setPriceDebounce([numValue, price[1]])
        }
    }

    // MAX PRICE INPUT CHANGE
    const handleMaxPriceInput = (e) => {
        const value = e.target.value
        setMaxPriceInput(value)
        
        const numValue = parseFloat(value)
        if (!isNaN(numValue) && numValue >= price[0] && numValue <= 10000) {
            setPrice([price[0], numValue])
            setPriceDebounce([price[0], numValue])
        }
    }

    // CATEGORY CHANGE
    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId)
    }

    // RATING CHANGE 
    const handleRatingChange = (value) => {
        setRating(value === rating ? 0 : value)
    }

    // RESET FILTERS
    const handleResetFilters = () => {
        setPrice([1, 10000])
        setPriceDebounce([1, 10000])
        setMinPriceInput('1')
        setMaxPriceInput('10000')
        setSelectedCategory("")
        setRating(0)
    }

    // GET CATEGORIES
    const fetchCategories = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/v1/category")
            setCategories(res.data.data)
        } catch (error) {
            console.error("Failed to load categories", error)
        }
    }

    const getProducts = async (keyword = "", page = 1, price, category, rating, isNewSearch = false) => {
        try {
            if (page === 1) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            let link = `http://localhost:8000/api/v1/search?keyword=${keyword}&page=${page}&limit=9&minPrice=${price[0]}&maxPrice=${price[1]}`

            if (category) link += `&category=${category}`
            if (rating) link += `&rating=${rating}`

            console.log('API Request:', link)

            const res = await axios.get(link)
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
            console.error("Error fetching products:", error)
            setLoading(false)
            setLoadingMore(false)
        }
    }

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories()
    }, [])

    // Initial load and filter changes
    useEffect(() => {
        setLoading(true)
        const timer = setTimeout(() => {
            setProducts([])
            setCurrentPage(1)
            setHasMore(true)
            getProducts(keyword, 1, priceDebounce, selectedCategory, rating, true)
        }, 300)
        
        return () => clearTimeout(timer)
    }, [keyword, priceDebounce, selectedCategory, rating])

    // Load more products when page changes
    useEffect(() => {
        if (currentPage > 1) {
            getProducts(keyword, currentPage, priceDebounce, selectedCategory, rating, false)
        }
    }, [currentPage])

    return (
        <>
            <MetaData title="FormulaHub | F1 Collectibles Store" />

            {loading && currentPage === 1 ? <Loader /> : (
                <div className="store-layout">
                    {/* SIDEBAR FILTERS */}
                    <aside className={`filters-sidebar ${showFilters ? 'open' : 'closed'}`}>
                        <div className="filters-header">
                            <h2 className="filters-main-title">Filters</h2>
                            <button 
                                className="filter-close-btn"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? '✕' : '☰'}
                            </button>
                        </div>

                        <div className="filters-content">
                            {/* Price Filter */}
                            <div className="filter-section">
                                <h3 className="filter-section-title">Price Range</h3>
                                <div className="price-inputs">
                                    <div className="price-input-group">
                                        <label>Min</label>
                                        <input
                                            type="number"
                                            className="price-input"
                                            value={minPriceInput}
                                            onChange={handleMinPriceInput}
                                            min="1"
                                            max={price[1]}
                                        />
                                    </div>
                                    <span className="price-separator">-</span>
                                    <div className="price-input-group">
                                        <label>Max</label>
                                        <input
                                            type="number"
                                            className="price-input"
                                            value={maxPriceInput}
                                            onChange={handleMaxPriceInput}
                                            min={price[0]}
                                            max="10000"
                                        />
                                    </div>
                                </div>
                                <Box sx={{ width: '100%', px: 1, mt: 2 }}>
                                    <Slider
                                        value={price}
                                        onChange={handlePriceChange}
                                        onChangeCommitted={handlePriceCommit}
                                        valueLabelDisplay="auto"
                                        min={1}
                                        max={10000}
                                        sx={{
                                            color: '#dc143c',
                                            '& .MuiSlider-thumb': {
                                                backgroundColor: '#dc143c',
                                                border: '2px solid #000',
                                            },
                                            '& .MuiSlider-track': {
                                                backgroundColor: '#dc143c',
                                            },
                                            '& .MuiSlider-rail': {
                                                backgroundColor: '#333',
                                            }
                                        }}
                                    />
                                </Box>
                            </div>

                            {/* Category Filter */}
                            <div className="filter-section">
                                <h3 className="filter-section-title">Category</h3>
                                <div className="category-list">
                                    <div 
                                        className={`category-item ${selectedCategory === "" ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange("")}
                                    >
                                        All Categories
                                    </div>
                                    {categories.map(cat => (
                                        <div 
                                            key={cat._id}
                                            className={`category-item ${selectedCategory === cat._id ? 'active' : ''}`}
                                            onClick={() => handleCategoryChange(cat._id)}
                                        >
                                            {cat.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rating Filter */}
                            <div className="filter-section">
                                <h3 className="filter-section-title">Filter by Rating</h3>
                                <div className="rating-list">
                                    {[5, 4, 3, 2, 1].map(r => (
                                        <div 
                                            key={r}
                                            className={`rating-item ${rating === r ? 'active' : ''}`}
                                            onClick={() => handleRatingChange(r)}
                                        >
                                            <span className="stars">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span 
                                                        key={i} 
                                                        className={`star ${i < r ? 'filled' : 'empty'}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button 
                                className="reset-filters-btn"
                                onClick={handleResetFilters}
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="store-main">
                        <div className="store-header">
                            <h1 className="store-title">
                                {keyword ? `Search Results for "${keyword}"` : 'Latest Products'}
                            </h1>
                            <button 
                                className="mobile-filter-toggle"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                        </div>

                        {/* Active Filters Display */}
                        {(selectedCategory || rating > 0 || priceDebounce[0] !== 1 || priceDebounce[1] !== 10000) && (
                            <div className="active-filters">
                                <span className="active-filters-label">Active Filters:</span>
                                {priceDebounce[0] !== 1 || priceDebounce[1] !== 10000 ? (
                                    <span className="filter-tag">
                                        Price: ₱{priceDebounce[0]} - ₱{priceDebounce[1]}
                                        <button onClick={() => {
                                            setPrice([1, 10000])
                                            setPriceDebounce([1, 10000])
                                            setMinPriceInput('1')
                                            setMaxPriceInput('10000')
                                        }}>✕</button>
                                    </span>
                                ) : null}
                                {selectedCategory && (
                                    <span className="filter-tag">
                                        {categories.find(c => c._id === selectedCategory)?.name}
                                        <button onClick={() => handleCategoryChange("")}>✕</button>
                                    </span>
                                )}
                                {rating > 0 && (
                                    <span className="filter-tag">
                                        {rating} Star{rating !== 1 ? 's' : ''} Only
                                        <button onClick={() => handleRatingChange(0)}>✕</button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Products Grid */}
                        <div className="products-grid">
                            {products && products.length > 0 ? (
                                products.map((product, index) => (
                                    <Product 
                                        key={product._id}
                                        product={product}
                                        lastProductRef={products.length === index + 1 ? lastProductRef : null}
                                    />
                                ))
                            ) : (
                                <div className="no-products">
                                    <p>No products found matching your filters</p>
                                    <button onClick={handleResetFilters} className="reset-btn-inline">
                                        Clear All Filters
                                    </button>
                                </div>
                            )}

                            {/* Loading Skeletons */}
                            {loadingMore && (
                                <>
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 20, 60, 0.1)' }} />
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 20, 60, 0.1)' }} />
                                    <Skeleton variant="rounded" width="100%" height={420} sx={{ bgcolor: 'rgba(220, 20, 60, 0.1)' }} />
                                </>
                            )}
                        </div>

                        {/* End of Products */}
                        {!hasMore && products.length > 0 && (
                            <div className="end-message">
                                No more products to load
                            </div>
                        )}
                    </main>
                </div>
            )}
        </>
    )
}

export default Store