import React, { Fragment, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { getToken } from '../Utils/helpers'
import { toast } from 'react-toastify'
import axios from 'axios'
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Avatar,
    Alert,
    Paper,
    Chip
} from '@mui/material'
import {
    LocalShipping,
    ShoppingCart,
    Lock,
    ArrowBack,
    Shield,
    LocalShippingOutlined,
    Undo,
    CheckCircle,
    Info
} from '@mui/icons-material'

const ConfirmOrder = ({cartItems, shippingInfo}) => {
    const [user, setUser] = useState(null)
    const [orderConfirmed, setOrderConfirmed] = useState(false)
    let navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (orderConfirmed || location.state?.fromSuccess || location.state?.fromPayment) {
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const token = getToken()
                
                if (!token) {
                    toast.error('Please login to continue')
                    navigate('/login')
                    return
                }

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }

                const { data } = await axios.get(`${import.meta.env.VITE_API}/me`, config)
                
                if (data.success && data.user) {
                    setUser(data.user)
                } else {
                    toast.error('Please login to continue')
                    navigate('/login')
                }
            } catch (error) {
                console.error('Error fetching user:', error)
                toast.error('Please login to continue')
                navigate('/login')
            }
        }

        fetchUserProfile()

        // Validate cart and shipping info
        if (!cartItems || cartItems.length === 0) {
            toast.error('Your cart is empty')
            navigate('/cart')
            return
        }

        if (!shippingInfo || !shippingInfo.address) {
            toast.error('Please add shipping information')
            navigate('/shipping')
            return
        }
    }, [cartItems, shippingInfo, navigate, orderConfirmed, location])

    // Calculate Order Prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice > 5000 ? 0 : 150 // Free shipping over ₱5000
    const taxPrice = Number((0.12 * itemsPrice).toFixed(2)) // 12% VAT
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2)

    const processToPayment = () => {
        const data = {
            itemsPrice: Number(itemsPrice.toFixed(2)),
            shippingPrice,
            taxPrice,
            totalPrice: Number(totalPrice)
        }

        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        setOrderConfirmed(true) 
        navigate('/payment', { state: { fromConfirm: true } })
    }

    const getUserFullName = () => {
        if (!user) return 'Guest'
        
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`.trim()
        }
        
        if (user.first_name) {
            return user.first_name
        }
        
        if (user.name) {
            return user.name
        }
        
        return user.email || 'Guest'
    }

    return (
        <Fragment>
            <MetaData title={'Confirm Order'} />
            <CheckoutSteps shipping confirmOrder />
            
            <Container maxWidth="xl" sx={{ mt: { xs: 12, md: 15 }, mb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
                <Grid container spacing={3} justifyContent="center">
                    <Grid item xs={12} xl={10}>
                        <Grid container spacing={3}>
                            {/* Left Column - Order Details */}
                            <Grid item xs={12} lg={7} xl={8}>
                                {/* Shipping Information */}
                                <Card sx={{ 
                                    bgcolor: '#1a1a1a', 
                                    border: '1px solid #333',
                                    mb: 3
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <LocalShipping sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                                Shipping Information
                                            </Typography>
                                        </Box>

                                        {user && (
                                            <>
                                                <Box mb={1.5}>
                                                    <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                                        Name
                                                    </Typography>
                                                    <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                                                        {getUserFullName()}
                                                    </Typography>
                                                </Box>

                                                <Box mb={1.5}>
                                                    <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                                        Email
                                                    </Typography>
                                                    <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </>
                                        )}

                                        <Box mb={1.5}>
                                            <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                                Phone
                                            </Typography>
                                            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                                                {shippingInfo.phoneNo}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                                Address
                                            </Typography>
                                            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                                                {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* Order Items */}
                                <Card sx={{ 
                                    bgcolor: '#1a1a1a', 
                                    border: '1px solid #333'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" alignItems="center" mb={3}>
                                            <ShoppingCart sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                                Order Items
                                            </Typography>
                                            <Chip 
                                                label={cartItems.length}
                                                size="small"
                                                sx={{ 
                                                    ml: 2,
                                                    bgcolor: '#dc3545',
                                                    color: '#fff',
                                                    fontWeight: 700
                                                }}
                                            />
                                        </Box>

                                        <Box>
                                            {cartItems.map((item) => (
                                                <Paper
                                                    key={item.product}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        p: 2,
                                                        mb: 2,
                                                        bgcolor: '#252525',
                                                        backgroundImage: 'none',
                                                        gap: 2,
                                                        '&:last-child': { mb: 0 }
                                                    }}
                                                >
                                                    <Avatar
                                                        src={item.image}
                                                        alt={item.name}
                                                        variant="rounded"
                                                        sx={{ 
                                                            width: { xs: 60, sm: 80 }, 
                                                            height: { xs: 60, sm: 80 },
                                                            border: '1px solid #333'
                                                        }}
                                                    />
                                                    
                                                    <Box flex={1} minWidth={0}>
                                                        <Typography
                                                            component={Link}
                                                            to={`/product/${item.product}`}
                                                            sx={{
                                                                color: '#fff',
                                                                fontSize: '15px',
                                                                fontWeight: 500,
                                                                textDecoration: 'none',
                                                                display: 'block',
                                                                mb: 1,
                                                                '&:hover': {
                                                                    color: '#dc3545'
                                                                }
                                                            }}
                                                        >
                                                            {item.name}
                                                        </Typography>
                                                        
                                                        <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                                            {item.quantity} × ₱{item.price.toFixed(2)}
                                                        </Typography>
                                                    </Box>

                                                    <Typography
                                                        sx={{
                                                            color: '#dc3545',
                                                            fontSize: '18px',
                                                            fontWeight: 700,
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        ₱{(item.quantity * item.price).toFixed(2)}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Column - Order Summary */}
                            <Grid item xs={12} lg={5} xl={4}>
                                <Box sx={{ position: { lg: 'sticky' }, top: { lg: 100 } }}>
                                    {/* Order Summary Card */}
                                    <Card sx={{ 
                                        bgcolor: '#1a1a1a', 
                                        border: '1px solid #333',
                                        mb: 3
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ 
                                                color: '#fff', 
                                                fontWeight: 600,
                                                mb: 3
                                            }}>
                                                Order Summary
                                            </Typography>

                                            {/* Price Breakdown */}
                                            <Box mb={3}>
                                                <Box display="flex" justifyContent="space-between" mb={2}>
                                                    <Typography sx={{ color: '#999' }}>
                                                        Subtotal:
                                                    </Typography>
                                                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                                                        ₱{itemsPrice.toFixed(2)}
                                                    </Typography>
                                                </Box>

                                                <Box display="flex" justifyContent="space-between" mb={2}>
                                                    <Typography sx={{ color: '#999' }}>
                                                        Shipping:
                                                    </Typography>
                                                    <Typography sx={{ 
                                                        color: shippingPrice === 0 ? '#28a745' : '#fff',
                                                        fontWeight: 600
                                                    }}>
                                                        {shippingPrice === 0 ? 'FREE' : `₱${shippingPrice.toFixed(2)}`}
                                                    </Typography>
                                                </Box>

                                                {/* Free Shipping Alert */}
                                                {shippingPrice === 0 && (
                                                    <Alert 
                                                        icon={<CheckCircle />}
                                                        severity="success"
                                                        sx={{ 
                                                            mb: 2,
                                                            bgcolor: 'rgba(40, 167, 69, 0.1)',
                                                            color: '#28a745',
                                                            border: '1px solid rgba(40, 167, 69, 0.3)',
                                                            '& .MuiAlert-icon': {
                                                                color: '#28a745'
                                                            }
                                                        }}
                                                    >
                                                        You've qualified for free shipping!
                                                    </Alert>
                                                )}

                                                {/* Almost Free Shipping Alert */}
                                                {shippingPrice > 0 && itemsPrice < 5000 && (
                                                    <Alert 
                                                        icon={<Info />}
                                                        severity="info"
                                                        sx={{ 
                                                            mb: 2,
                                                            bgcolor: 'rgba(23, 162, 184, 0.1)',
                                                            color: '#17a2b8',
                                                            border: '1px solid rgba(23, 162, 184, 0.3)',
                                                            '& .MuiAlert-icon': {
                                                                color: '#17a2b8'
                                                            }
                                                        }}
                                                    >
                                                        Add ₱{(5000 - itemsPrice).toFixed(2)} more for free shipping
                                                    </Alert>
                                                )}

                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography sx={{ color: '#999' }}>
                                                        Tax (12% VAT):
                                                    </Typography>
                                                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                                                        ₱{taxPrice}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ borderColor: '#333', mb: 3 }} />

                                            {/* Total */}
                                            <Box display="flex" justifyContent="space-between" mb={3}>
                                                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                                    Total:
                                                </Typography>
                                                <Typography variant="h6" sx={{ 
                                                    color: '#dc3545', 
                                                    fontWeight: 700
                                                }}>
                                                    ₱{totalPrice}
                                                </Typography>
                                            </Box>

                                            {/* Buttons */}
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<Lock />}
                                                onClick={processToPayment}
                                                sx={{
                                                    bgcolor: '#dc3545',
                                                    color: '#fff',
                                                    py: 1.5,
                                                    fontWeight: 600,
                                                    fontSize: '16px',
                                                    mb: 2,
                                                    '&:hover': {
                                                        bgcolor: '#c82333'
                                                    }
                                                }}
                                            >
                                                Proceed to Payment
                                            </Button>

                                            <Button
                                                fullWidth
                                                component={Link}
                                                to="/cart"
                                                variant="outlined"
                                                startIcon={<ArrowBack />}
                                                sx={{
                                                    borderColor: '#444',
                                                    color: '#fff',
                                                    py: 1.5,
                                                    fontWeight: 600,
                                                    mb: 2,
                                                    '&:hover': {
                                                        borderColor: '#666',
                                                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                                                    }
                                                }}
                                            >
                                                Back to Cart
                                            </Button>

                                            {/* Security Badge */}
                                            <Box 
                                                display="flex" 
                                                alignItems="center" 
                                                justifyContent="center"
                                                gap={1}
                                                sx={{
                                                    color: '#999',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                <Shield sx={{ fontSize: 18 }} />
                                                <Typography variant="body2">
                                                    Your information is secure
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>

                                    {/* Additional Info Card */}
                                    <Card sx={{ 
                                        bgcolor: '#1a1a1a', 
                                        border: '1px solid #333'
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                                <LocalShippingOutlined sx={{ color: '#dc3545', fontSize: 20 }} />
                                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                                    Estimated delivery: 3-5 business days
                                                </Typography>
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Undo sx={{ color: '#dc3545', fontSize: 20 }} />
                                                <Typography sx={{ color: '#fff', fontSize: '14px' }}>
                                                    30-day return policy
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Fragment>
    )
}

export default ConfirmOrder