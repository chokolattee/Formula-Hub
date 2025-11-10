import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Button,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Checkbox,
    Collapse,
    Rating,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { CSSTransition } from "react-transition-group";
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import InfoModal from './Layout/InfoModal';
import Loader from '../Layout/Loader';
import { getUser, getToken } from '../Utils/helpers';
import '../../Styles/admin.css';

const Reviews = () => {
    const viewRef = useRef(null);
    
    const [allReviews, setAllReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [checkedId, setCheckedId] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(getUser());

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [productIdFilter, setProductIdFilter] = useState('');

    // Form state for InfoModal
    const [formState, setFormState] = useState({
        existingImages: [],
        images: []
    });

    const [modalData, setModalData] = useState({
        title: '',
        content: '',
        fields: []
    });

    const errMsg = (message = '', type = 'error') => {
        if (type === 'error') {
            toast.error(message, { position: 'bottom-right' });
        } else {
            toast.success(message, { position: 'bottom-right' });
        }
    };

    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-right'
    });

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    };

    // Auto-open sidebar on desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 992) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch all reviews on component mount
    useEffect(() => {
        getAllReviews();
    }, []);

    const getAllReviews = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/review`, config);
            setAllReviews(data.data || []);
            setFilteredReviews(data.data || []);
            setTotal(data.data?.length || 0);
            setTotalPages(Math.ceil((data.data?.length || 0) / limit));
            setLoading(false);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load reviews');
            setAllReviews([]);
            setFilteredReviews([]);
            setLoading(false);
        }
    };

    const deleteReview = async (id, productId) => {
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/review?id=${id}&productId=${productId}`, config);
            setIsDeleted(data.success);
            setAllReviews(prevReviews => prevReviews.filter(review => review._id !== id));
            setCheckedId(prevChecked => prevChecked.filter(checkedId => checkedId !== id));
            successMsg('Review deleted successfully');
        } catch (error) {
            errMsg(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // Filter and search reviews
    useEffect(() => {
        let filtered = [...allReviews];
        
        // Apply product ID filter
        if (productIdFilter.trim()) {
            filtered = filtered.filter(review => 
                review.product?._id?.toLowerCase().includes(productIdFilter.toLowerCase())
            );
        }
        
        // Apply rating filter
        if (ratingFilter !== 'all') {
            filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
        }
        
        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(review => {
                const userName = `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim();
                return review._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        setFilteredReviews(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / limit));
        setPage(1);
    }, [searchTerm, ratingFilter, productIdFilter, allReviews, limit]);

    useEffect(() => {
        if (error) {
            errMsg(error);
            setError('');
        }

        if (deleteError) {
            errMsg(deleteError);
            setDeleteError('');
        }
    }, [error, deleteError]);

    const deleteReviewHandler = (id, productId) => {
        Swal.fire({
            title: 'Delete Review',
            icon: 'warning',
            text: 'Do you want to delete this review?',
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d32f2f',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                deleteReview(id, productId);
            }
        });
    };

    // Load review for viewing with InfoModal
    const loadReviewView = async (id) => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/review/${id}`,
                config
            );
            const review = data.data;
            
            setFormState({
                existingImages: review.images || [],
                images: [],
                name: review.product?.name || 'N/A'
            });

            setModalData({
                title: 'Review Details',
                content: '',
                fields: [
                    { 
                        label: 'Product', 
                        value: review.product?.name || 'N/A',
                        name: 'product',
                        type: 'text'
                    },
                    { 
                        label: 'Product Price', 
                        value: review.product?.price ? `₱${review.product.price.toLocaleString()}` : 'N/A',
                        name: 'price',
                        type: 'text'
                    },
                    { 
                        label: 'User', 
                        value: `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim() || 'N/A',
                        name: 'user',
                        type: 'text'
                    },
                    { 
                        label: 'Email', 
                        value: review.user?.email || 'N/A',
                        name: 'email',
                        type: 'text'
                    },
                    { 
                        label: 'Rating', 
                        value: `${review.rating} / 5 stars`,
                        name: 'rating',
                        type: 'text'
                    },
                    { 
                        label: 'Comment', 
                        value: review.comment || 'No comment',
                        name: 'comment',
                        type: 'text'
                    },
                    { 
                        label: 'Order ID', 
                        value: review.order?._id || 'N/A',
                        name: 'orderId',
                        type: 'text'
                    },
                    { 
                        label: 'Order Status', 
                        value: review.order?.orderStatus || 'N/A',
                        name: 'orderStatus',
                        type: 'text'
                    },
                    { 
                        label: 'Created At', 
                        value: new Date(review.createdAt).toLocaleString(),
                        name: 'createdAt',
                        type: 'text'
                    },
                    { 
                        label: 'Updated At', 
                        value: new Date(review.updatedAt).toLocaleString(),
                        name: 'updatedAt',
                        type: 'text'
                    }
                ]
            });

            setViewModal(true);
        } catch (error) {
            errMsg(error.response?.data?.message || "Failed to load review data");
        }
    };

    const handleCheck = (id, isChecked) => {
        setCheckedId((prevCheckedId) => {
            if (isChecked) {
                return [...prevCheckedId, id];
            } else {
                return prevCheckedId.filter((item) => item !== id);
            }
        });
    };

    const handleSelectAll = (isChecked) => {
        setSelectAll(isChecked);
        if (isChecked) {
            const currentPageReviews = getCurrentPageReviews();
            const allIds = currentPageReviews.map(review => review._id);
            setCheckedId(allIds);
        } else {
            setCheckedId([]);
        }
    };

    useEffect(() => {
        const currentPageReviews = getCurrentPageReviews();
        if (currentPageReviews.length > 0) {
            setSelectAll(checkedId.length === currentPageReviews.length && currentPageReviews.every(review => checkedId.includes(review._id)));
        }
    }, [checkedId, page, filteredReviews]);

    const bulkDelete = () => {
        if (checkedId.length === 0) {
            errMsg('Please select at least one review to delete');
            return;
        }

        Swal.fire({
            title: 'Delete Reviews',
            icon: 'warning',
            text: `Are you sure you want to delete ${checkedId.length} review(s)?`,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d32f2f',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                checkedId.forEach((id) => {
                    const review = allReviews.find(r => r._id === id);
                    if (review) {
                        deleteReview(id, review.product?._id);
                    }
                });
                setCheckedId([]);
                setSelectAll(false);
            }
        });
    };

    // Export to CSV
    const exportToCSV = () => {
        const csvData = filteredReviews.map(review => ({
            'Review ID': review._id,
            'Product': review.product?.name || 'N/A',
            'User': `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim() || 'N/A',
            'Rating': review.rating,
            'Comment': review.comment || 'N/A',
            'Date': new Date(review.createdAt).toLocaleDateString()
        }));

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        successMsg('Reviews exported to CSV');
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Reviews Report', 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Reviews: ${total}`, 14, 36);
        
        const tableData = filteredReviews.map(review => [
            review._id.substring(0, 8) + '...',
            review.product?.name?.substring(0, 20) || 'N/A',
            `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim().substring(0, 20) || 'N/A',
            review.rating,
            review.comment?.substring(0, 30) || 'N/A',
            new Date(review.createdAt).toLocaleDateString()
        ]);
        
        autoTable(doc, {
            head: [['Review ID', 'Product', 'User', 'Rating', 'Comment', 'Date']],
            body: tableData,
            startY: 42,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [198, 40, 40] }
        });
        
        doc.save(`reviews_${new Date().toISOString().split('T')[0]}.pdf`);
        successMsg('Reviews exported to PDF');
    };

    const getCurrentPageReviews = () => {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return filteredReviews.slice(startIndex, endIndex);
    };

    const currentPageReviews = getCurrentPageReviews();

    return (
        // ... (rest of the code remains the same)
        <>
            <MetaData title={'Product Reviews'} />

            <div className="admin-layout">
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <i className="fa fa-bars"></i>
                </button>

                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="container-fluid">
                        <h1 className="my-4">Reviews Management</h1>

                        {loading ? (
                            <Loader />
                        ) : (
                            <div className="main-container__admin">
                                <div className="container sub-container__single-lg">
                                    {/* Filters and Search */}
                                    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <TextField
                                            size="small"
                                            placeholder="Search by Review ID, User, Comment, or Product Name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            sx={{ minWidth: 300, flexGrow: 1 }}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                        
                                        <TextField
                                            size="small"
                                            placeholder="Filter by Product ID"
                                            value={productIdFilter}
                                            onChange={(e) => setProductIdFilter(e.target.value)}
                                            sx={{ minWidth: 200 }}
                                        />
                                        
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Rating Filter</InputLabel>
                                            <Select
                                                value={ratingFilter}
                                                label="Rating Filter"
                                                onChange={(e) => setRatingFilter(e.target.value)}
                                            >
                                                <MenuItem value="all">All Ratings</MenuItem>
                                                <MenuItem value="5">5 Stars</MenuItem>
                                                <MenuItem value="4">4 Stars</MenuItem>
                                                <MenuItem value="3">3 Stars</MenuItem>
                                                <MenuItem value="2">2 Stars</MenuItem>
                                                <MenuItem value="1">1 Star</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<DownloadIcon />}
                                                onClick={exportToCSV}
                                                size="small"
                                            >
                                                CSV
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PictureAsPdfIcon />}
                                                onClick={exportToPDF}
                                                size="small"
                                                color="error"
                                            >
                                                PDF
                                            </Button>
                                        </Box>
                                    </Box>

                                    <div className="container-body">
                                        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
                                            <Table stickyHeader aria-label="reviews table">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell />
                                                        <TableCell align="center">
                                                            <Checkbox
                                                                checked={selectAll}
                                                                indeterminate={checkedId.length > 0 && checkedId.length < currentPageReviews.length}
                                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>Review ID</TableCell>
                                                        <TableCell>Product</TableCell>
                                                        <TableCell align="right">User</TableCell>
                                                        <TableCell align="right">Rating</TableCell>
                                                        <TableCell align="right">Comment</TableCell>
                                                        <TableCell align="right">Date</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {currentPageReviews.length > 0 ? (
                                                        currentPageReviews.map((review) => (
                                                            <ReviewRow
                                                                key={review._id}
                                                                review={review}
                                                                handleCheck={handleCheck}
                                                                isChecked={checkedId.includes(review._id)}
                                                                loadViewModal={loadReviewView}
                                                                deleteReview={deleteReviewHandler}
                                                            />
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={8} align="center">
                                                                <Typography>No reviews found</Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>

                                    <div className="container-footer" style={{ padding: '16px' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {/* Action Buttons */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                gap: 2,
                                                borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                                pb: 2
                                            }}>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={bulkDelete}
                                                    disabled={checkedId.length === 0}
                                                    startIcon={<DeleteIcon />}
                                                >
                                                    Bulk Delete {checkedId.length > 0 ? `(${checkedId.length})` : ''}
                                                </Button>
                                            </Box>

                                            {/* Pagination */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                                        <Select
                                                            value={limit}
                                                            onChange={(e) => setLimit(Number(e.target.value))}
                                                        >
                                                            <MenuItem value={5}>5 per page</MenuItem>
                                                            <MenuItem value={10}>10 per page</MenuItem>
                                                            <MenuItem value={20}>20 per page</MenuItem>
                                                            <MenuItem value={50}>50 per page</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        Total Reviews: {total}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={page === 1}
                                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                                    >
                                                        <NavigateBeforeIcon />
                                                    </Button>
                                                    <Typography variant="body2" sx={{ mx: 2 }}>
                                                        Page {page} of {totalPages || 1}
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={page === totalPages || totalPages === 0}
                                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                                    >
                                                        <NavigateNextIcon />
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Modal */}
            <CSSTransition
                in={viewModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={viewRef}
            >
                <InfoModal
                    ref={viewRef}
                    setOpenModal={setViewModal}
                    modalData={modalData}
                    formState={formState}
                />
            </CSSTransition>
        </>
    );
};

// Review Row Component
function ReviewRow({ review, handleCheck, isChecked, loadViewModal, deleteReview }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell align="center">
                    <Checkbox
                        checked={isChecked}
                        onChange={(e) => handleCheck(review._id, e.target.checked)}
                    />
                </TableCell>
                <TableCell sx={{ minWidth: '200px', fontFamily: 'monospace' }}>
                    {review._id}
                </TableCell>
                <TableCell>{review.product?.name || 'N/A'}</TableCell>
                <TableCell align="right">
                    {review.user?.first_name} {review.user?.last_name}
                </TableCell>
                <TableCell align="right">
                    <Rating value={review.rating} readOnly size="small" />
                </TableCell>
                <TableCell align="right" sx={{ maxWidth: '200px' }}>
                    <Typography noWrap>{review.comment}</Typography>
                </TableCell>
                <TableCell align="right">
                    {new Date(review.createdAt).toLocaleDateString()}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Review Details
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Product Information
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {review.product?.name || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Price:</strong> ₱{review.product?.price?.toLocaleString() || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Product ID:</strong> {review.product?._id || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Customer Information
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Name:</strong> {review.user?.first_name} {review.user?.last_name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Email:</strong> {review.user?.email || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Review Content
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Rating value={review.rating} readOnly />
                                    <Typography variant="body2">({review.rating}/5)</Typography>
                                </Box>
                                <Typography variant="body2">
                                    {review.comment}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => loadViewModal(review._id)}
                                    startIcon={<VisibilityIcon />}
                                    size="small"
                                >
                                    View Full Details
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => deleteReview(review._id, review.product?._id)}
                                    size="small"
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default Reviews;