import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getToken } from '../Utils/helpers'
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    Chip,
    Divider,
    Avatar,
    Paper
} from '@mui/material'
import {
    ArrowBack,
    ShoppingCart,
    CreditCard,
    LocalShipping,
    Receipt,
    CheckCircle,
    Cancel,
    Phone,
    LocationOn
} from '@mui/icons-material'

const OrderDetails = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [order, setOrder] = useState({})

    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    let { id } = useParams()

    const getOrderDetails = async (id) => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }

            const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, config)
            setOrder(data.order)
            setLoading(false)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch order details')
            setLoading(false)
        }
    }

    useEffect(() => {
        getOrderDetails(id)

        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            })
        }
    }, [error, id])

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        switch(status) {
            case 'Delivered':
                return 'success'
            case 'Processing':
                return 'warning'
            case 'Shipped':
                return 'info'
            default:
                return 'default'
        }
    }

    const isPaid = paymentInfo && paymentInfo.status === 'succeeded'

    return (
        <>
            <MetaData title={'Order Details'} />

            {loading ? (
                <Loader />
            ) : (
                <Container maxWidth="xl" sx={{ mt: { xs: 12, md: 15 }, mb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
                    {/* Header Section */}
                    <Box mb={5}>
                        <Button
                            component={Link}
                            to="/orders/me"
                            startIcon={<ArrowBack />}
                            sx={{
                                color: '#fff',
                                borderColor: '#444',
                                mb: 3,
                                '&:hover': {
                                    bgcolor: '#dc3545',
                                    borderColor: '#dc3545'
                                }
                            }}
                            variant="outlined"
                        >
                            Back to Orders
                        </Button>
                        
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                                    Order Details
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>
                                    Order ID: #{order._id}
                                </Typography>
                                {order.createdAt && (
                                    <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                                        Placed on: {formatDate(order.createdAt)}
                                    </Typography>
                                )}
                            </Box>
                            
                            <Chip
                                label={orderStatus}
                                color={getStatusColor(orderStatus)}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    height: '40px',
                                    px: 3
                                }}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={4}>
                        {/* Left Column - Order Items */}
                        <Grid item xs={12} lg={8}>
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', borderRadius: 2 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" mb={4}>
                                        <ShoppingCart sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
                                            Order Items ({orderItems && orderItems.length})
                                        </Typography>
                                    </Box>

                                    {orderItems && orderItems.map(item => (
                                        <Paper
                                            key={item.product}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 3,
                                                mb: 3,
                                                bgcolor: '#252525',
                                                backgroundImage: 'none',
                                                gap: 3
                                            }}
                                        >
                                            <Avatar
                                                src={item.image}
                                                alt={item.name}
                                                variant="rounded"
                                                sx={{ width: 100, height: 100, border: '1px solid #333' }}
                                            />
                                            
                                            <Box flex={1} minWidth={0}>
                                                <Typography
                                                    component={Link}
                                                    to={`/product/${item.product}`}
                                                    sx={{
                                                        color: '#fff',
                                                        fontSize: '18px',
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
                                                <Typography variant="body1" sx={{ color: '#999' }}>
                                                    Quantity: {item.quantity} × ₱{item.price.toFixed(2)}
                                                </Typography>
                                            </Box>
                                            
                                            <Typography
                                                sx={{
                                                    fontSize: '22px',
                                                    fontWeight: 700,
                                                    color: '#dc3545',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                ₱{(item.quantity * item.price).toFixed(2)}
                                            </Typography>
                                        </Paper>
                                    ))}

                                    <Divider sx={{ my: 4, borderColor: '#333' }} />

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                                            Total Amount:
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: '#dc3545', fontWeight: 700 }}>
                                            ₱{totalPrice && totalPrice.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right Column - Details */}
                        <Grid item xs={12} lg={4}>
                            {/* Payment Status Card */}
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', borderRadius: 2, mb: 4 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" mb={3}>
                                        <CreditCard sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '20px' }}>
                                            Payment Status
                                        </Typography>
                                    </Box>
                                    
                                    <Paper
                                        sx={{
                                            p: 3,
                                            bgcolor: isPaid ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                                            border: `2px solid ${isPaid ? '#28a745' : '#dc3545'}`,
                                            textAlign: 'center',
                                            backgroundImage: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" justifyContent="center">
                                            {isPaid ? (
                                                <>
                                                    <CheckCircle sx={{ color: '#28a745', mr: 1.5, fontSize: 28 }} />
                                                    <Typography sx={{ fontWeight: 700, color: '#28a745', fontSize: '20px' }}>
                                                        PAID
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Cancel sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                                    <Typography sx={{ fontWeight: 700, color: '#dc3545', fontSize: '20px' }}>
                                                        NOT PAID
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Paper>

                                    {paymentInfo && paymentInfo.id && (
                                        <Box mt={3} p={2} bgcolor="#252525" borderRadius={1}>
                                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                                                Payment ID
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#fff', wordBreak: 'break-all', fontSize: '14px', lineHeight: 1.6 }}>
                                                {paymentInfo.id}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Shipping Info Card */}
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', borderRadius: 2, mb: 4 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" mb={3}>
                                        <LocalShipping sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '20px' }}>
                                            Shipping Details
                                        </Typography>
                                    </Box>
                                    
                                    {user && (
                                        <Box mb={3} p={2} bgcolor="#252525" borderRadius={1}>
                                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                                NAME
                                            </Typography>
                                            <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '16px' }}>
                                                {user.name}
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {shippingInfo && shippingInfo.phoneNo && (
                                        <Box mb={3} p={2} bgcolor="#252525" borderRadius={1}>
                                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                                PHONE
                                            </Typography>
                                            <Box display="flex" alignItems="center">
                                                <Phone sx={{ color: '#dc3545', fontSize: 20, mr: 1.5 }} />
                                                <Typography sx={{ color: '#fff', fontSize: '16px' }}>
                                                    {shippingInfo.phoneNo}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                    
                                    {shippingInfo && (
                                        <Box mb={order.deliveredAt ? 3 : 0} p={2} bgcolor="#252525" borderRadius={1}>
                                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                                ADDRESS
                                            </Typography>
                                            <Box display="flex" alignItems="flex-start">
                                                <LocationOn sx={{ color: '#dc3545', fontSize: 20, mr: 1.5, mt: 0.2 }} />
                                                <Typography sx={{ color: '#fff', lineHeight: 2, fontSize: '16px' }}>
                                                    {shippingInfo.address}<br />
                                                    {shippingInfo.city}, {shippingInfo.postalCode}<br />
                                                    {shippingInfo.country}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {order.deliveredAt && (
                                        <>
                                            <Divider sx={{ my: 3, borderColor: '#333' }} />
                                            <Box p={2} bgcolor="#252525" borderRadius={1}>
                                                <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                                    DELIVERED ON
                                                </Typography>
                                                <Box display="flex" alignItems="center">
                                                    <CheckCircle sx={{ color: '#28a745', fontSize: 20, mr: 1.5 }} />
                                                    <Typography sx={{ color: '#28a745', fontWeight: 500, fontSize: '16px' }}>
                                                        {formatDate(order.deliveredAt)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Order Summary Card */}
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', borderRadius: 2 }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box display="flex" alignItems="center" mb={3}>
                                        <Receipt sx={{ color: '#dc3545', mr: 1.5, fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '20px' }}>
                                            Order Summary
                                        </Typography>
                                    </Box>
                                    
                                    <Box bgcolor="#252525" p={2.5} borderRadius={1}>
                                        {order.itemsPrice && (
                                            <Box display="flex" justifyContent="space-between" mb={2.5}>
                                                <Typography sx={{ color: '#ccc', fontSize: '16px' }}>Subtotal:</Typography>
                                                <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                                                    ₱{order.itemsPrice.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {order.shippingPrice !== undefined && (
                                            <Box display="flex" justifyContent="space-between" mb={2.5}>
                                                <Typography sx={{ color: '#ccc', fontSize: '16px' }}>Shipping:</Typography>
                                                <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                                                    ₱{order.shippingPrice.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {order.taxPrice && (
                                            <Box display="flex" justifyContent="space-between" mb={2.5}>
                                                <Typography sx={{ color: '#ccc', fontSize: '16px' }}>Tax:</Typography>
                                                <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
                                                    ₱{order.taxPrice.toFixed(2)}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        <Divider sx={{ my: 2.5, borderColor: '#444' }} />
                                        
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>
                                                Total:
                                            </Typography>
                                            <Typography sx={{ color: '#dc3545', fontWeight: 700, fontSize: '24px' }}>
                                                ₱{totalPrice && totalPrice.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            )}
        </>
    )
}

export default OrderDetails