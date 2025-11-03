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
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating,
    TextField,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar
} from '@mui/material'
import {
    ShoppingBag,
    Visibility,
    ShoppingCart,
    LocationOn,
    CalendarToday,
    Inventory,
    LocalShipping,
    CheckCircle,
    Cancel,
    RateReview,
    Close,
    CloudUpload,
    Delete
} from '@mui/icons-material'

const ListOrders = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [myOrdersList, setMyOrdersList] = useState([])
    const [activeTab, setActiveTab] = useState(0)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState(null)
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
    const [reviewData, setReviewData] = useState({
        orderId: '',
        productId: '',
        productName: '',
        rating: 0,
        comment: '',
        images: []
    })
    const [imagePreview, setImagePreview] = useState([])

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

    const handleCancelOrder = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            await axios.put(
                `${import.meta.env.VITE_API}/order/cancel/${orderToCancel}`,
                {},
                config
            )
            toast.success('Order cancelled successfully', {
                position: 'bottom-right'
            })
            setCancelDialogOpen(false)
            setOrderToCancel(null)
            myOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel order', {
                position: 'bottom-right'
            })
        }
    }

    const openReviewDialog = (orderId, productId, productName) => {
        setReviewData({
            orderId,
            productId,
            productName,
            rating: 0,
            comment: '',
            images: []
        })
        setImagePreview([])
        setReviewDialogOpen(true)
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        
        if (files.length + imagePreview.length > 5) {
            toast.error('Maximum 5 images allowed', {
                position: 'bottom-right'
            })
            return
        }

        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagePreview(prev => [...prev, reader.result])
                    setReviewData(prev => ({
                        ...prev,
                        images: [...prev.images, reader.result]
                    }))
                }
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setImagePreview(prev => prev.filter((_, i) => i !== index))
        setReviewData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const submitReview = async () => {
        if (reviewData.rating === 0) {
            toast.error('Please select a rating', {
                position: 'bottom-right'
            })
            return
        }

        if (!reviewData.comment.trim()) {
            toast.error('Please write a comment', {
                position: 'bottom-right'
            })
            return
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                }
            }

            await axios.post(
                `${import.meta.env.VITE_API}/review`,
                {
                    orderId: reviewData.orderId,
                    productId: reviewData.productId,
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    images: reviewData.images
                },
                config
            )

            toast.success('Review submitted successfully', {
                position: 'bottom-right'
            })
            setReviewDialogOpen(false)
            myOrders()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review', {
                position: 'bottom-right'
            })
        }
    }

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
            case 'Cancelled':
                return 'error'
            default:
                return 'default'
        }
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const getFilteredOrders = () => {
        switch(activeTab) {
            case 0:
                return myOrdersList
            case 1:
                return myOrdersList.filter(order => order.orderStatus === 'Processing')
            case 2:
                return myOrdersList.filter(order => order.orderStatus === 'Shipped')
            case 3:
                return myOrdersList.filter(order => order.orderStatus === 'Delivered')
            case 4:
                return myOrdersList.filter(order => order.orderStatus === 'Cancelled')
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
                case 'Cancelled': return '#dc3545'
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
                    <Grid container spacing={3} alignItems="center" mb={3}>
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

                        <Grid item xs={6} sm={3} md={2}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Items
                            </Typography>
                            <Typography sx={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>
                                {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}
                            </Typography>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                Total
                            </Typography>
                            <Typography sx={{ color: '#dc3545', fontSize: '20px', fontWeight: 700 }}>
                                ₱{order.totalPrice.toFixed(2)}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
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
                            {order.cancelledAt && (
                                <Typography variant="caption" sx={{ color: '#dc3545', display: 'block', mt: 0.5 }}>
                                    Cancelled: {formatDate(order.cancelledAt)}
                                </Typography>
                            )}
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <Box display="flex" flexDirection="column" gap={1}>
                                <Button
                                    component={Link}
                                    to={`/order/${order._id}`}
                                    variant="outlined"
                                    startIcon={<Visibility />}
                                    fullWidth
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
                                {order.orderStatus === 'Processing' && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<Cancel />}
                                        fullWidth
                                        onClick={() => {
                                            setOrderToCancel(order._id)
                                            setCancelDialogOpen(true)
                                        }}
                                        sx={{
                                            color: '#dc3545',
                                            borderColor: '#dc3545',
                                            fontWeight: 600,
                                            '&:hover': {
                                                bgcolor: '#dc3545',
                                                color: '#fff'
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: '#333', mb: 3 }} />

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
                                <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
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
                                    {order.orderStatus === 'Delivered' && (
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<RateReview />}
                                            onClick={() => openReviewDialog(order._id, item.product, item.name)}
                                            sx={{
                                                bgcolor: '#28a745',
                                                '&:hover': { bgcolor: '#218838' },
                                                fontSize: '12px',
                                                py: 0.5
                                            }}
                                        >
                                            Review
                                        </Button>
                                    )}
                                </Box>
                            </Paper>
                        ))}
                    </Box>

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
    const cancelledCount = myOrdersList.filter(order => order.orderStatus === 'Cancelled').length
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
                                <Tab
                                    icon={<Cancel />}
                                    iconPosition="start"
                                    label={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            Cancelled
                                            <Chip 
                                                label={cancelledCount} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: activeTab === 4 ? '#dc3545' : '#333',
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

            {/* Cancel Order Dialog */}
            <Dialog
                open={cancelDialogOpen}
                onClose={() => setCancelDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #333',
                        minWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
                    Cancel Order
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#999' }}>
                        Are you sure you want to cancel this order? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setCancelDialogOpen(false)}
                        sx={{ color: '#999' }}
                    >
                        No, Keep Order
                    </Button>
                    <Button
                        onClick={handleCancelOrder}
                        variant="contained"
                        sx={{
                            bgcolor: '#dc3545',
                            '&:hover': { bgcolor: '#c82333' }
                        }}
                    >
                        Yes, Cancel Order
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Review Dialog */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #333'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Write a Review
                    <IconButton onClick={() => setReviewDialogOpen(false)} sx={{ color: '#999' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box mb={3}>
                        <Typography sx={{ color: '#999', mb: 1 }}>
                            Product: {reviewData.productName}
                        </Typography>
                    </Box>

                    <Box mb={3}>
                        <Typography sx={{ color: '#fff', mb: 1 }}>Rating *</Typography>
                        <Rating
                            value={reviewData.rating}
                            onChange={(event, newValue) => {
                                setReviewData({ ...reviewData, rating: newValue })
                            }}
                            size="large"
                            sx={{
                                '& .MuiRating-iconFilled': {
                                    color: '#ffc107'
                                }
                            }}
                        />
                    </Box>

                    <Box mb={3}>
                        <Typography sx={{ color: '#fff', mb: 1 }}>Review *</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Share your thoughts about this product..."
                            value={reviewData.comment}
                            onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#fff',
                                    '& fieldset': {
                                        borderColor: '#444'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#666'
                                    }
                                }
                            }}
                        />
                    </Box>

                    <Box mb={3}>
                        <Typography sx={{ color: '#fff', mb: 1 }}>Photos (Optional - Max 5)</Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            sx={{
                                color: '#fff',
                                borderColor: '#444',
                                '&:hover': {
                                    borderColor: '#666'
                                }
                            }}
                        >
                            Upload Images
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />
                        </Button>

                        {imagePreview.length > 0 && (
                            <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
                                {imagePreview.map((img, index) => (
                                    <ImageListItem key={index}>
                                        <img
                                            src={img}
                                            alt={`Preview ${index + 1}`}
                                            loading="lazy"
                                            style={{ height: 100, objectFit: 'cover' }}
                                        />
                                        <ImageListItemBar
                                            sx={{
                                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
                                            }}
                                            position="top"
                                            actionIcon={
                                                <IconButton
                                                    sx={{ color: 'white' }}
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            }
                                            actionPosition="right"
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setReviewDialogOpen(false)}
                        sx={{ color: '#999' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={submitReview}
                        variant="contained"
                        sx={{
                            bgcolor: '#28a745',
                            '&:hover': { bgcolor: '#218838' }
                        }}
                    >
                        Submit Review
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default ListOrders