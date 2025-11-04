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
    Button,
    Chip,
    Avatar,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating,
    TextField,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    Grid,
} from '@mui/material'

import {
    RateReview,
    Edit,
    Delete,
    Close,
    CloudUpload,
    ShoppingBag,
    CalendarToday,
    ChevronLeft,
    ChevronRight,
} from '@mui/icons-material'

const MyReviews = () => {
    const [loading, setLoading] = useState(true)
    const [reviews, setReviews] = useState([])
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedReview, setSelectedReview] = useState(null)
    const [editData, setEditData] = useState({
        rating: 0,
        comment: '',
        images: []
    })
    const [imagePreview, setImagePreview] = useState([])
    const [newImages, setNewImages] = useState([])
    const [carouselIndexes, setCarouselIndexes] = useState({})

    const fetchMyReviews = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews/me`, config)
            setReviews(data.data || [])
            setLoading(false)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch reviews', {
                position: 'bottom-right'
            })
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMyReviews()
    }, [])

    const openEditDialog = (review) => {
        setSelectedReview(review)
        setEditData({
            rating: review.rating,
            comment: review.comment,
            images: review.images || []
        })
        setImagePreview(review.images?.map(img => img.url) || [])
        setNewImages([])
        setEditDialogOpen(true)
    }

    const openDeleteDialog = (review) => {
        setSelectedReview(review)
        setDeleteDialogOpen(true)
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        
        const totalImages = imagePreview.length + files.length
        if (totalImages > 5) {
            toast.error('Maximum 5 images allowed', {
                position: 'bottom-right'
            })
            return
        }

        const maxSize = 5 * 1024 * 1024
        const validFiles = []
        
        for (const file of files) {
            if (file.size > maxSize) {
                toast.error(`${file.name} is too large. Maximum size is 5MB`, {
                    position: 'bottom-right'
                })
                continue
            }
            validFiles.push(file)
        }

        if (validFiles.length === 0) return

        setNewImages(prev => [...prev, ...validFiles])

        validFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagePreview(prev => [...prev, reader.result])
                }
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setImagePreview(prev => prev.filter((_, i) => i !== index))
        
        const existingImagesCount = editData.images.length
        if (index < existingImagesCount) {
            setEditData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }))
        } else {
            const newImageIndex = index - existingImagesCount
            setNewImages(prev => prev.filter((_, i) => i !== newImageIndex))
        }
    }

    const handleUpdateReview = async () => {
        if (editData.rating === 0) {
            toast.error('Please select a rating', {
                position: 'bottom-right'
            })
            return
        }

        if (!editData.comment.trim()) {
            toast.error('Please write a comment', {
                position: 'bottom-right'
            })
            return
        }

        try {
            const formData = new FormData()
            formData.append('rating', editData.rating)
            formData.append('comment', editData.comment)
            
            newImages.forEach(file => {
                formData.append('images', file)
            })

            if (editData.images.length > 0) {
                formData.append('keepExistingImages', 'true')
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'multipart/form-data'
                }
            }

            await axios.put(
                `${import.meta.env.VITE_API}/review/${selectedReview._id}`,
                formData,
                config
            )

            toast.success('Review updated successfully', {
                position: 'bottom-right'
            })
            setEditDialogOpen(false)
            fetchMyReviews()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update review', {
                position: 'bottom-right'
            })
        }
    }

    const handleDeleteReview = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }

            await axios.delete(
                `${import.meta.env.VITE_API}/review/${selectedReview._id}`,
                config
            )

            toast.success('Review deleted successfully', {
                position: 'bottom-right'
            })
            setDeleteDialogOpen(false)
            fetchMyReviews()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete review', {
                position: 'bottom-right'
            })
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleCarouselNext = (reviewId, maxIndex) => {
        setCarouselIndexes(prev => ({
            ...prev,
            [reviewId]: Math.min((prev[reviewId] || 0) + 1, maxIndex)
        }))
    }

    const handleCarouselPrev = (reviewId) => {
        setCarouselIndexes(prev => ({
            ...prev,
            [reviewId]: Math.max((prev[reviewId] || 0) - 1, 0)
        }))
    }

    const getOrderId = (order) => {
        if (typeof order === 'string') return order
        if (order && order._id) return order._id
        return 'N/A'
    }

    return (
        <>
            <MetaData title={'My Reviews'} />
            
            <Container maxWidth="lg" sx={{ mt: { xs: 12, md: 15 }, mb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
                <Box mb={5}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                            <RateReview sx={{ fontSize: 40, color: '#dc3545', mr: 2 }} />
                            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                                My Reviews
                            </Typography>
                        </Box>
                        <Chip 
                            label={`${reviews.length} ${reviews.length === 1 ? 'Review' : 'Reviews'}`}
                            sx={{ 
                                bgcolor: '#dc3545',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '14px'
                            }} 
                        />
                    </Box>
                    <Typography sx={{ color: '#999' }}>
                        View and manage all your product reviews
                    </Typography>
                </Box>

                {loading ? (
                    <Loader />
                ) : reviews.length === 0 ? (
                    <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                        <CardContent sx={{ textAlign: 'center', py: 8 }}>
                            <RateReview sx={{ fontSize: 80, color: '#666', mb: 3 }} />
                            <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                                No reviews yet
                            </Typography>
                            <Typography sx={{ color: '#999', mb: 4 }}>
                                Purchase and receive products to start writing reviews
                            </Typography>
                            <Button
                                component={Link}
                                to="/orders/me"
                                variant="contained"
                                sx={{
                                    bgcolor: '#dc3545',
                                    '&:hover': { bgcolor: '#c82333' },
                                    px: 4,
                                    py: 1.5
                                }}
                            >
                                View My Orders
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
                        {reviews.map((review) => {
                            const currentImageIndex = carouselIndexes[review._id] || 0
                            const hasImages = review.images && review.images.length > 0
                            const orderId = getOrderId(review.order)
                            
                            return (
                                <Grid item xs={12} key={review._id}>
                                    <Card
                                        sx={{
                                            bgcolor: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: 2,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 8px 24px rgba(220, 53, 69, 0.2)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Grid container spacing={3}>
                                                {/* Product Info */}
                                                <Grid item xs={12} md={3}>
                                                    <Box>
                                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                            <Avatar
                                                                src={review.product?.images?.[0]?.url}
                                                                alt={review.product?.name}
                                                                variant="rounded"
                                                                sx={{ width: 80, height: 80, border: '1px solid #333' }}
                                                            />
                                                            <Box flex={1} minWidth={0}>
                                                                <Typography
                                                                    sx={{
                                                                        color: '#fff',
                                                                        fontSize: '14px',
                                                                        fontWeight: 600,
                                                                        mb: 0.5,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        display: '-webkit-box',
                                                                        WebkitLineClamp: 2,
                                                                        WebkitBoxOrient: 'vertical'
                                                                    }}
                                                                >
                                                                    {review.product?.name}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                                    ₱{review.product?.price?.toFixed(2)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        
                                                        {/* Order Info */}
                                                        <Paper 
                                                            sx={{ 
                                                                bgcolor: '#252525', 
                                                                border: '1px solid #333',
                                                                p: 1.5,
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5 }}>
                                                                Order ID
                                                            </Typography>
                                                            <Typography 
                                                                sx={{ 
                                                                    color: '#dc3545', 
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    fontFamily: 'monospace'
                                                                }}
                                                            >
                                                                #{orderId}
                                                            </Typography>
                                                        </Paper>
                                                    </Box>
                                                </Grid>

                                                {/* Review Content */}
                                                <Grid item xs={12} md={6}>
                                                    <Box>
                                                        <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                                                            <Rating 
                                                                value={review.rating} 
                                                                readOnly 
                                                                size="small"
                                                                sx={{
                                                                    '& .MuiRating-iconFilled': {
                                                                        color: '#ffc107'
                                                                    }
                                                                }}
                                                            />
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <CalendarToday sx={{ fontSize: 14, color: '#666' }} />
                                                                <Typography variant="caption" sx={{ color: '#999' }}>
                                                                    {formatDate(review.createdAt)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Typography
                                                            sx={{
                                                                color: '#fff',
                                                                fontSize: '14px',
                                                                lineHeight: 1.6,
                                                                mb: 2
                                                            }}
                                                        >
                                                            {review.comment}
                                                        </Typography>

                                                        {/* Review Images Carousel */}
                                                        {hasImages && (
                                                            <Box 
                                                                sx={{ 
                                                                    position: 'relative',
                                                                    bgcolor: '#252525',
                                                                    borderRadius: 2,
                                                                    overflow: 'hidden',
                                                                    border: '1px solid #333'
                                                                }}
                                                            >
                                                                <Box
                                                                    component="img"
                                                                    src={review.images[currentImageIndex].url}
                                                                    alt={`Review image ${currentImageIndex + 1}`}
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: 200,
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                                
                                                                {review.images.length > 1 && (
                                                                    <>
                                                                        {/* Navigation Buttons */}
                                                                        {currentImageIndex > 0 && (
                                                                            <IconButton
                                                                                onClick={() => handleCarouselPrev(review._id)}
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    left: 8,
                                                                                    top: '50%',
                                                                                    transform: 'translateY(-50%)',
                                                                                    bgcolor: 'rgba(0,0,0,0.7)',
                                                                                    color: '#fff',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(0,0,0,0.9)'
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <ChevronLeft />
                                                                            </IconButton>
                                                                        )}
                                                                        
                                                                        {currentImageIndex < review.images.length - 1 && (
                                                                            <IconButton
                                                                                onClick={() => handleCarouselNext(review._id, review.images.length - 1)}
                                                                                sx={{
                                                                                    position: 'absolute',
                                                                                    right: 8,
                                                                                    top: '50%',
                                                                                    transform: 'translateY(-50%)',
                                                                                    bgcolor: 'rgba(0,0,0,0.7)',
                                                                                    color: '#fff',
                                                                                    '&:hover': {
                                                                                        bgcolor: 'rgba(0,0,0,0.9)'
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <ChevronRight />
                                                                            </IconButton>
                                                                        )}
                                                                        
                                                                        {/* Image Counter */}
                                                                        <Box
                                                                            sx={{
                                                                                position: 'absolute',
                                                                                bottom: 8,
                                                                                right: 8,
                                                                                bgcolor: 'rgba(0,0,0,0.7)',
                                                                                color: '#fff',
                                                                                px: 1.5,
                                                                                py: 0.5,
                                                                                borderRadius: 1,
                                                                                fontSize: '12px',
                                                                                fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {currentImageIndex + 1} / {review.images.length}
                                                                        </Box>
                                                                    </>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Grid>

                                                {/* Action Buttons */}
                                                <Grid item xs={12} md={3}>
                                                    <Box display="flex" flexDirection="column" gap={1.5}>
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<Edit />}
                                                            fullWidth
                                                            onClick={() => openEditDialog(review)}
                                                            sx={{
                                                                color: '#fff',
                                                                borderColor: '#444',
                                                                '&:hover': {
                                                                    bgcolor: '#28a745',
                                                                    borderColor: '#28a745'
                                                                }
                                                            }}
                                                        >
                                                            Edit Review
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<Delete />}
                                                            fullWidth
                                                            onClick={() => openDeleteDialog(review)}
                                                            sx={{
                                                                color: '#dc3545',
                                                                borderColor: '#dc3545',
                                                                '&:hover': {
                                                                    bgcolor: '#dc3545',
                                                                    color: '#fff'
                                                                }
                                                            }}
                                                        >
                                                            Delete Review
                                                        </Button>
                                                        <Button
                                                            component={Link}
                                                            to={`/order/${orderId}`}
                                                            variant="outlined"
                                                            startIcon={<ShoppingBag />}
                                                            fullWidth
                                                            sx={{
                                                                color: '#fff',
                                                                borderColor: '#444',
                                                                '&:hover': {
                                                                    borderColor: '#dc3545',
                                                                    bgcolor: 'rgba(220, 53, 69, 0.1)'
                                                                }
                                                            }}
                                                        >
                                                            View Order
                                                        </Button>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )
                        })}
                    </Grid>
                )}
            </Container>

            {/* Edit Review Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
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
                    Edit Review
                    <IconButton onClick={() => setEditDialogOpen(false)} sx={{ color: '#999' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box mb={3}>
                        <Typography sx={{ color: '#999', mb: 1 }}>
                            Product: {selectedReview?.product?.name}
                        </Typography>
                    </Box>

                    <Box mb={3}>
                        <Typography sx={{ color: '#fff', mb: 1 }}>Rating *</Typography>
                        <Rating
                            value={editData.rating}
                            onChange={(event, newValue) => {
                                setEditData({ ...editData, rating: newValue })
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
                            value={editData.comment}
                            onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
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
                            disabled={imagePreview.length >= 5}
                            sx={{
                                color: '#fff',
                                borderColor: '#444',
                                '&:hover': {
                                    borderColor: '#666'
                                },
                                '&.Mui-disabled': {
                                    color: '#666',
                                    borderColor: '#333'
                                }
                            }}
                        >
                            Upload Images ({imagePreview.length}/5)
                            <input
                                type="file"
                                hidden
                                accept="image/jpeg,image/jpg,image/png"
                                multiple
                                onChange={handleImageChange}
                                disabled={imagePreview.length >= 5}
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
                        onClick={() => setEditDialogOpen(false)}
                        sx={{ color: '#999' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateReview}
                        variant="contained"
                        sx={{
                            bgcolor: '#28a745',
                            '&:hover': { bgcolor: '#218838' }
                        }}
                    >
                        Update Review
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a1a',
                        border: '1px solid #333',
                        minWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
                    Delete Review
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#999', mb: 2 }}>
                        Are you sure you want to delete this review? This action cannot be undone.
                    </Typography>
                    {selectedReview && (
                        <Paper sx={{ p: 2, bgcolor: '#252525', border: '1px solid #333' }}>
                            <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 600, mb: 1 }}>
                                {selectedReview.product?.name}
                            </Typography>
                            <Rating value={selectedReview.rating} readOnly size="small" />
                            <Typography sx={{ color: '#999', fontSize: '13px', mt: 1 }}>
                                {selectedReview.comment?.substring(0, 100)}...
                            </Typography>
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: '#999' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteReview}
                        variant="contained"
                        sx={{
                            bgcolor: '#dc3545',
                            '&:hover': { bgcolor: '#c82333' }
                        }}
                    >
                        Delete Review
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default MyReviews