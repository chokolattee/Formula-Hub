import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    Avatar,
    Paper,
    Divider,
    Tabs,
    Tab
} from '@mui/material'
import {
    ShoppingBag,
    Visibility,
    ShoppingCart,
    LocationOn,
    CalendarToday,
    Inventory,
    LocalShipping,
    CheckCircle
} from '@mui/icons-material'

const ListOrders = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [myOrdersList, setMyOrdersList] = useState([])
    const [activeTab, setActiveTab] = useState(0)

    const myOrders = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.VITE_API}/orders/me`, config)
            setMyOrdersList(data.orders)
            setLoading(false)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch orders')
            setLoading(false)
        }
    }

    useEffect(() => {
        myOrders()
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            })
        }
    }, [error])

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const getFilteredOrders = () => {
        switch(activeTab) {
            case 0: // All Orders
                return myOrdersList
            case 1: // Processing
                return myOrdersList.filter(order => order.orderStatus === 'Processing')
            case 2: // Shipped
                return myOrdersList.filter(order => order.orderStatus === 'Shipped')
            case 3: // Delivered
                return myOrdersList.filter(order => order.orderStatus === 'Delivered')
            default:
                return myOrdersList
        }
    }

    const renderOrderCard = (order) => {
        const getBorderColor = (status) => {
            switch(status) {
                case 'Processing': return '#ffc107'
                case 'Shipped': return '#17a2b8'
                case 'Delivered': return '#28a745'
                default: return '#666'
            }
        }

        const borderColor = getBorderColor(order.orderStatus)

        return (
            <Card
                key={order._id}
                sx={{
                    bgcolor: '#1a1a1a',
                    border: '1px solid #333',
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: 2,
                    mb: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${borderColor}33`
                    }
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Order Header */}
                    <Grid container spacing={3} alignItems="center" mb={3}>
                        {/* Order ID & Date */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Order ID
                            </Typography>
                            <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 600, mb: 0.5 }}>
                                #{order._id.substring(order._id.length - 8).toUpperCase()}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <CalendarToday sx={{ fontSize: 14, color: '#666' }} />
                                <Typography variant="caption" sx={{ color: '#999' }}>
                                    {formatDate(order.createdAt)}
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Items Count */}
                        <Grid item xs={6} sm={3} md={2}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Items
                            </Typography>
                            <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>
                                {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                            </Typography>
                        </Grid>

                        {/* Total Amount */}
                        <Grid item xs={6} sm={3} md={2}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Total
                            </Typography>
                            <Typography sx={{ color: '#dc3545', fontSize: '20px', fontWeight: 700 }}>
                                ₱{order.totalPrice.toFixed(2)}
                            </Typography>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={6} sm={6} md={3}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Status
                            </Typography>
                            <Chip
                                label={order.orderStatus}
                                color={getStatusColor(order.orderStatus)}
                                sx={{ fontWeight: 600, fontSize: '13px' }}
                            />
                            {order.deliveredAt && (
                                <Typography variant="caption" sx={{ color: '#28a745', display: 'block', mt: 0.5 }}>
                                    Delivered: {formatDate(order.deliveredAt)}
                                </Typography>
                            )}
                        </Grid>

                        {/* Action Button */}
                        <Grid item xs={6} sm={6} md={2} sx={{ textAlign: { md: 'right' } }}>
                            <Button
                                component={Link}
                                to={`/order/${order._id}`}
                                variant="outlined"
                                startIcon={<Visibility />}
                                sx={{
                                    color: '#fff',
                                    borderColor: '#444',
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: '#dc3545',
                                        borderColor: '#dc3545'
                                    }
                                }}
                            >
                                View
                            </Button>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: '#333', mb: 3 }} />

                    {/* Order Items */}
                    <Box mb={2}>
                        <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                            Order Items
                        </Typography>
                        {order.orderItems.map((item, idx) => (
                            <Paper
                                key={idx}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 2,
                                    mb: 1.5,
                                    bgcolor: '#252525',
                                    backgroundImage: 'none',
                                    gap: 2
                                }}
                            >
                                <Avatar
                                    src={item.image}
                                    alt={item.name}
                                    variant="rounded"
                                    sx={{ width: 60, height: 60, border: '1px solid #333' }}
                                />
                                <Box flex={1} minWidth={0}>
                                    <Typography
                                        sx={{
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            mb: 0.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#999' }}>
                                        Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Typography
                                    sx={{
                                        color: '#dc3545',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    ₱{(item.quantity * item.price).toFixed(2)}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>

                    {/* Shipping Address */}
                    <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn sx={{ fontSize: 16, color: '#dc3545' }} />
                        <Typography variant="body2" sx={{ color: '#999' }}>
                            {order.shippingInfo.city}, {order.shippingInfo.country}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        )
    }

    const processingCount = myOrdersList.filter(order => order.orderStatus === 'Processing').length
    const shippedCount = myOrdersList.filter(order => order.orderStatus === 'Shipped').length
    const deliveredCount = myOrdersList.filter(order => order.orderStatus === 'Delivered').length
    const filteredOrders = getFilteredOrders()

    return (
        <>
            <MetaData title={'My Orders'} />
            
            <Container maxWidth="xl" sx={{ mt: { xs: 12, md: 15 }, mb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
                <Box mb={5}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <ShoppingBag sx={{ fontSize: 40, color: '#dc3545', mr: 2 }} />
                        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                            My Orders
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* Tabs */}
                        <Box sx={{ mb: 4 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                sx={{
                                    bgcolor: '#1a1a1a',
                                    borderRadius: 2,
                                    border: '1px solid #333',
                                    '& .MuiTabs-indicator': {
                                        bgcolor: '#dc3545',
                                        height: 3
                                    }
                                }}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tab
                                    icon={<ShoppingBag />}
                                    iconPosition="start"
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            All Orders
                                            <Chip 
                                                label={myOrdersList.length} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: activeTab === 0 ? '#dc3545' : '#333',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    height: 20,
                                                    fontSize: '11px'
                                                }} 
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        color: '#999',
                                        fontWeight: 600,
                                        '&.Mui-selected': { color: '#fff' },
                                        textTransform: 'none',
                                        fontSize: '15px'
                                    }}
                                />
                                <Tab
                                    icon={<Inventory />}
                                    iconPosition="start"
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            Processing
                                            <Chip 
                                                label={processingCount} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: activeTab === 1 ? '#ffc107' : '#333',
                                                    color: activeTab === 1 ? '#000' : '#fff',
                                                    fontWeight: 700,
                                                    height: 20,
                                                    fontSize: '11px'
                                                }} 
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        color: '#999',
                                        fontWeight: 600,
                                        '&.Mui-selected': { color: '#fff' },
                                        textTransform: 'none',
                                        fontSize: '15px'
                                    }}
                                />
                                <Tab
                                    icon={<LocalShipping />}
                                    iconPosition="start"
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            Shipped
                                            <Chip 
                                                label={shippedCount} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: activeTab === 2 ? '#17a2b8' : '#333',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    height: 20,
                                                    fontSize: '11px'
                                                }} 
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        color: '#999',
                                        fontWeight: 600,
                                        '&.Mui-selected': { color: '#fff' },
                                        textTransform: 'none',
                                        fontSize: '15px'
                                    }}
                                />
                                <Tab
                                    icon={<CheckCircle />}
                                    iconPosition="start"
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            Delivered
                                            <Chip 
                                                label={deliveredCount} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: activeTab === 3 ? '#28a745' : '#333',
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    height: 20,
                                                    fontSize: '11px'
                                                }} 
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        color: '#999',
                                        fontWeight: 600,
                                        '&.Mui-selected': { color: '#fff' },
                                        textTransform: 'none',
                                        fontSize: '15px'
                                    }}
                                />
                            </Tabs>
                        </Box>

                        {/* Orders Content */}
                        {myOrdersList.length === 0 ? (
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                                    <ShoppingCart sx={{ fontSize: 80, color: '#666', mb: 3 }} />
                                    <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                                        No orders yet
                                    </Typography>
                                    <Typography sx={{ color: '#999', mb: 4 }}>
                                        Start shopping to see your orders here!
                                    </Typography>
                                    <Button
                                        component={Link}
                                        to="/store"
                                        variant="contained"
                                        sx={{
                                            bgcolor: '#dc3545',
                                            '&:hover': { bgcolor: '#c82333' },
                                            px: 4,
                                            py: 1.5
                                        }}
                                    >
                                        Browse Products
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : filteredOrders.length === 0 ? (
                            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                                    <ShoppingCart sx={{ fontSize: 80, color: '#666', mb: 3 }} />
                                    <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                                        No orders in this category
                                    </Typography>
                                    <Typography sx={{ color: '#999' }}>
                                        You don't have any orders with this status yet.
                                    </Typography>
                                </CardContent>
                            </Card>
                        ) : (
                            <Box>
                                {filteredOrders.map((order) => renderOrderCard(order))}
                            </Box>
                        )}
                    </>
                )}
            </Container>
        </>
    )
}

export default ListOrders