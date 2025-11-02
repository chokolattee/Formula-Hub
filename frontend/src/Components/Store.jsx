import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import Product from './Product/Product'
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader'
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import CircularProgress from '@mui/material/CircularProgress';

const Home = () => {
    const [products, setProducts] = useState([])
    const [productsCount, setProductsCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [price, setPrice] = useState([1, 5000]);

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

    function valuetext(price) {
        return `$${price.toString()}`;
    }
    
    const handleChange = (event, newValue) => {
        setPrice(newValue);
        // Reset products when price filter changes
        setProducts([]);
        setCurrentPage(1);
        setHasMore(true);
    };

    const getProducts = async (keyword = '', page = 1, price, isNewSearch = false) => {
        try {
            if (page === 1) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            let link = `http://localhost:8000/api/v1/product?keyword=${keyword}&page=${page}&limit=8&price[gte]=${price[0]}&price[lte]=${price[1]}`

            let res = await axios.get(link)
            console.log('API Response:', res.data)
            
            const newProducts = res.data.data || []
            const total = res.data.pagination?.total || 0
            const limit = res.data.pagination?.limit || 8
            
            if (page === 1 || isNewSearch) {
                setProducts(newProducts)
            } else {
                setProducts(prevProducts => [...prevProducts, ...newProducts])
            }
            
            setProductsCount(total)
            
            // Check if there are more products to load
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

    // Initial load and when keyword/price changes
    useEffect(() => {
        setProducts([])
        setCurrentPage(1)
        setHasMore(true)
        getProducts(keyword, 1, price, true)
    }, [keyword, price]);

    // Load more products when page changes
    useEffect(() => {
        if (currentPage > 1) {
            getProducts(keyword, currentPage, price, false)
        }
    }, [currentPage]);

    console.log('Products:', products)
    console.log('Current Page:', currentPage)
    console.log('Has More:', hasMore)
    
    return (
        <>
            <MetaData title={'FormulaHub | F1 Collectibles Store'} />
            {loading ? <Loader /> : (
                <div className="container container-fluid">
                    <h1 id="products_heading">Latest Products</h1>
                    <section id="products" className="container mt-5">
                        {keyword ? (
                            <div className="row">
                                <div className="col-6 col-md-3 mt-5 mb-5">
                                    <div className="px-5">
                                        <Box sx={{ width: 200 }}>
                                            <Slider
                                                getAriaLabel={() => 'Price Filter'}
                                                value={price}
                                                onChange={handleChange}
                                                valueLabelDisplay="auto"
                                                getAriaValueText={valuetext}
                                                min={1}
                                                max={5000}
                                            />
                                        </Box>
                                        <div className="mt-5">
                                            <h4 className="mb-3">
                                                Categories
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-6 col-md-9">
                                    <div className="row">
                                        {products && products.length > 0 ? (
                                            products.map((product, index) => {
                                                if (products.length === index + 1) {
                                                    return (
                                                        <div ref={lastProductRef} key={product._id}>
                                                            <Product product={product} />
                                                        </div>
                                                    )
                                                } else {
                                                    return <Product key={product._id} product={product} />
                                                }
                                            })
                                        ) : (
                                            <div className="col-12 text-center">
                                                <p>No products found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                {products && products.length > 0 ? (
                                    products.map((product, index) => {
                                        if (products.length === index + 1) {
                                            return (
                                                <div ref={lastProductRef} key={product._id}>
                                                    <Product product={product} />
                                                </div>
                                            )
                                        } else {
                                            return <Product key={product._id} product={product} />
                                        }
                                    })
                                ) : (
                                    <div className="col-12 text-center">
                                        <p>No products available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {loadingMore && (
                        <div className="d-flex justify-content-center mt-5 mb-5">
                            <CircularProgress />
                        </div>
                    )}

                    {!hasMore && products.length > 0 && (
                        <div className="d-flex justify-content-center mt-5 mb-5">
                            <p className="text-muted">No more products to load</p>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default Home