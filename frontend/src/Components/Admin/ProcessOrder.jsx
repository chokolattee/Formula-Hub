import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './Layout/SideBar'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { getToken } from '../Utils/helpers'

import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    Button,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Chip,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert
} from '@mui/material'
import {
    LocalShipping,
    Payment,
    AttachMoney,
    Person,
    Phone,
    LocationOn,
    ShoppingCart,
    CheckCircle,
    Cancel,
    HourglassEmpty
} from '@mui/icons-material'

import '../../Styles/admin.css'

const ProcessOrder = () => {
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [order, setOrder] = useState({})
    const [isUpdated, setIsUpdated] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    
    let navigate = useNavigate()
    let { id } = useParams()
    
    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    const orderId = id

    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-center'
    })

    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-center'
    })

    // Helper function to get customer name
    const getCustomerName = (user) => {
        if (!user) return 'N/A';
        if (user.name) return user.name;
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.first_name) return user.first_name;
        if (user.last_name) return user.last_name;
        return 'N/A';
    };

    const getOrderDetails = async (id) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, config)
            setOrder(data.order)
            setStatus(data.order.orderStatus)
            setLoading(false)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load order')
            setLoading(false)
        }
    }

    const updateOrder = async (id, formData) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.put(`${import.meta.env.VITE_API}/admin/order/${id}`, formData, config)
            setIsUpdated(data.success)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update order')
        }
    }

    useEffect(() => {
        getOrderDetails(orderId)
    }, [orderId])

    useEffect(() => {
        if (error) {
            errMsg(error)
            setError('')
        }
        if (isUpdated) {
            successMsg('Order updated successfully')
            setIsUpdated(false)
            setTimeout(() => navigate('/admin/orders'), 1500)
        }
    }, [error, isUpdated, navigate])

    // Auto-open sidebar on desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 992) {
                setIsSidebarOpen(true)
            } else {
                setIsSidebarOpen(false)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const updateOrderHandler = (id) => {
        if (!status) {
            errMsg('Please select a status')
            return
        }
        const formData = { status }
        updateOrder(id, formData)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Processing': return { bg: '#ff9800', text: '#fff' }
            case 'Shipped': return { bg: '#2196f3', text: '#fff' }
            case 'Delivered': return { bg: '#4caf50', text: '#fff' }
            case 'Cancelled': return { bg: '#f44336', text: '#fff' }
            default: return { bg: '#757575', text: '#fff' }
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Processing': return <HourglassEmpty />
            case 'Shipped': return <LocalShipping />
            case 'Delivered': return <CheckCircle />
            case 'Cancelled': return <Cancel />
            default: return <HourglassEmpty />
        }
    }

    const shippingDetails = shippingInfo && 
        `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`
    const isPaid = paymentInfo && paymentInfo.status === 'succeeded'

    if (loading) return <Loader />

    const statusColors = getStatusColor(orderStatus)

    return (
        <>
            <MetaData title={`Process Order # ${order._id}`} />
            
            <div className="admin-layout">
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <i className="fa fa-bars"></i>
                </button>

                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <Box sx={{ p: 3, bgcolor: '#000', minHeight: '100vh' }}>
                        {/* Header */}
                        <Box sx={{ mb: 4 }}>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    mb: 1
                                }}
                            >
                                Process Order
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#999' }}>
                                Order ID: {order._id}
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Left Column - Order Details */}
                            <Grid item xs={12} lg={8}>
                                {/* Customer & Shipping Info */}
                                <Card sx={{ 
                                    mb: 3, 
                                    bgcolor: '#1a1a1a', 
                                    borderRadius: 2,
                                    border: '1px solid #333'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <Person sx={{ color: '#d32f2f', mr: 2 }} />
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                Customer Information
                                            </Typography>
                                        </Box>
                                        
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                                                        <Person />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            Name
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                                            {getCustomerName(user)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                                                        <Phone />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            Phone
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                                            {shippingInfo?.phoneNo || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                                                        <LocationOn />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            Shipping Address
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ color: '#fff' }}>
                                                            {shippingDetails || 'N/A'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                                                        <AttachMoney />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#999' }}>
                                                            Total Amount
                                                        </Typography>
                                                        <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                                            ₱{totalPrice}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Payment Info */}
                                <Card sx={{ 
                                    mb: 3, 
                                    bgcolor: '#1a1a1a', 
                                    borderRadius: 2,
                                    border: '1px solid #333'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <Payment sx={{ color: '#d32f2f', mr: 2 }} />
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                Payment Information
                                            </Typography>
                                        </Box>
                                        
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                    Payment Status
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip
                                                        icon={isPaid ? <CheckCircle /> : <Cancel />}
                                                        label={isPaid ? 'PAID' : 'NOT PAID'}
                                                        sx={{
                                                            bgcolor: isPaid ? '#4caf50' : '#f44336',
                                                            color: '#fff',
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                    Stripe ID
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: '#fff',
                                                        mt: 1,
                                                        fontFamily: 'monospace',
                                                        wordBreak: 'break-all'
                                                    }}
                                                >
                                                    {paymentInfo?.id || 'N/A'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Order Items */}
                                <Card sx={{ 
                                    bgcolor: '#1a1a1a', 
                                    borderRadius: 2,
                                    border: '1px solid #333'
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <ShoppingCart sx={{ color: '#d32f2f', mr: 2 }} />
                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                Order Items
                                            </Typography>
                                        </Box>

                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#999', borderColor: '#333' }}>Image</TableCell>
                                                        <TableCell sx={{ color: '#999', borderColor: '#333' }}>Product</TableCell>
                                                        <TableCell align="right" sx={{ color: '#999', borderColor: '#333' }}>Price</TableCell>
                                                        <TableCell align="right" sx={{ color: '#999', borderColor: '#333' }}>Quantity</TableCell>
                                                        <TableCell align="right" sx={{ color: '#999', borderColor: '#333' }}>Subtotal</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {orderItems?.map((item) => (
                                                        <TableRow key={item.product}>
                                                            <TableCell sx={{ borderColor: '#333' }}>
                                                                <img 
                                                                    src={item.image} 
                                                                    alt={item.name} 
                                                                    style={{ 
                                                                        width: '60px', 
                                                                        height: '60px', 
                                                                        objectFit: 'cover',
                                                                        borderRadius: '8px',
                                                                        border: '1px solid #333'
                                                                    }} 
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                                                                <Link 
                                                                    to={`/products/${item.product}`}
                                                                    style={{ 
                                                                        color: '#d32f2f',
                                                                        textDecoration: 'none',
                                                                        fontWeight: 500
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: '#fff', borderColor: '#333' }}>
                                                                ₱{item.price}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: '#fff', borderColor: '#333' }}>
                                                                {item.quantity}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                color: '#d32f2f', 
                                                                fontWeight: 'bold',
                                                                borderColor: '#333'
                                                            }}>
                                                                ₱{(item.price * item.quantity).toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Column - Status Update */}
                            <Grid item xs={12} lg={4}>
                                <Card sx={{ 
                                    bgcolor: '#1a1a1a', 
                                    borderRadius: 2,
                                    border: '1px solid #333',
                                    position: 'sticky',
                                    top: 20
                                }}>
                                    <CardContent>
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                color: '#fff', 
                                                fontWeight: 'bold',
                                                mb: 3
                                            }}
                                        >
                                            Order Status
                                        </Typography>

                                        {/* Current Status */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="caption" sx={{ color: '#999' }}>
                                                Current Status
                                            </Typography>
                                            <Box 
                                                sx={{ 
                                                    mt: 1,
                                                    p: 2,
                                                    bgcolor: statusColors.bg,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                {getStatusIcon(orderStatus)}
                                                <Typography 
                                                    variant="h6" 
                                                    sx={{ 
                                                        color: statusColors.text,
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {orderStatus}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ borderColor: '#333', mb: 3 }} />

                                        {/* Update Status */}
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                color: '#fff', 
                                                mb: 2,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Update Status
                                        </Typography>

                                        {orderStatus === 'Delivered' || orderStatus === 'Cancelled' ? (
                                            <Alert 
                                                severity={orderStatus === 'Delivered' ? 'success' : 'error'}
                                                sx={{ 
                                                    bgcolor: orderStatus === 'Delivered' ? '#1b5e20' : '#b71c1c',
                                                    color: '#fff',
                                                    '& .MuiAlert-icon': { color: '#fff' }
                                                }}
                                            >
                                                {orderStatus === 'Delivered' 
                                                    ? 'This order has been delivered' 
                                                    : 'This order has been cancelled'}
                                            </Alert>
                                        ) : (
                                            <>
                                                <FormControl 
                                                    fullWidth 
                                                    sx={{ 
                                                        mb: 3,
                                                        '& .MuiOutlinedInput-root': {
                                                            color: '#fff',
                                                            '& fieldset': { borderColor: '#333' },
                                                            '&:hover fieldset': { borderColor: '#d32f2f' },
                                                            '&.Mui-focused fieldset': { borderColor: '#d32f2f' }
                                                        },
                                                        '& .MuiInputLabel-root': { 
                                                            color: '#999',
                                                            '&.Mui-focused': { color: '#d32f2f' }
                                                        }
                                                    }}
                                                >
                                                    <InputLabel>Select Status</InputLabel>
                                                    <Select
                                                        value={status}
                                                        label="Select Status"
                                                        onChange={(e) => setStatus(e.target.value)}
                                                        sx={{
                                                            '& .MuiSvgIcon-root': { color: '#999' }
                                                        }}
                                                    >
                                                        <MenuItem value="Processing">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <HourglassEmpty fontSize="small" />
                                                                Processing
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="Shipped">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LocalShipping fontSize="small" />
                                                                Shipped
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="Delivered">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CheckCircle fontSize="small" />
                                                                Delivered
                                                            </Box>
                                                        </MenuItem>
                                                        <MenuItem value="Cancelled">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Cancel fontSize="small" />
                                                                Cancelled
                                                            </Box>
                                                        </MenuItem>
                                                    </Select>
                                                </FormControl>

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    size="large"
                                                    onClick={() => updateOrderHandler(order._id)}
                                                    disabled={!status || status === orderStatus}
                                                    sx={{
                                                        bgcolor: '#d32f2f',
                                                        color: '#fff',
                                                        fontWeight: 'bold',
                                                        py: 1.5,
                                                        '&:hover': {
                                                            bgcolor: '#b71c1c'
                                                        },
                                                        '&:disabled': {
                                                            bgcolor: '#333',
                                                            color: '#666'
                                                        }
                                                    }}
                                                >
                                                    Update Status
                                                </Button>
                                            </>
                                        )}

                                        <Divider sx={{ borderColor: '#333', my: 3 }} />

                                        {/* Quick Actions */}
                                        <Box>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    color: '#fff', 
                                                    mb: 2,
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Quick Actions
                                            </Typography>
                                            
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={() => navigate('/admin/orders')}
                                                sx={{
                                                    borderColor: '#333',
                                                    color: '#fff',
                                                    '&:hover': {
                                                        borderColor: '#d32f2f',
                                                        bgcolor: 'rgba(211, 47, 47, 0.08)'
                                                    }
                                                }}
                                            >
                                                Back to Orders
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            </div>
        </>
    )
}

export default ProcessOrder