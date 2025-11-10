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
    Chip,
    Rating,
    Select,
    MenuItem,
    FormControl,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { CSSTransition } from "react-transition-group";
import Swal from 'sweetalert2';

import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import InfoModal from './Layout/InfoModal';
import { getUser, getToken, errMsg } from '../Utils/helpers';
import '../../Styles/admin.css';

const Reviews = () => {
    const viewRef = useRef(null);
    
    const [productId, setProductId] = useState('');
    const [reviews, setReviews] = useState([]);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [checkedId, setCheckedId] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(getUser());

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

    const getProductReviews = async (id) => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/review/product?id=${id}`, config);
            setReviews(data.reviews);
        } catch (error) {
            setError(error.response?.data?.message);
        }
    };

    const deleteReview = async (id, productId) => {
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/review?id=${id}&productId=${productId}`, config);
            setIsDeleted(data.success);
        } catch (error) {
            setDeleteError(error.response?.data?.message);
        }
    };

    const deleteReviewHandler = (id) => {
        Swal.fire({
            title: 'Delete Review',
            icon: 'info',
            text: 'Do you want to delete this review',
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                deleteReview(id, productId);
            }
        });
    };

    useEffect(() => {
        if (error) {
            setError('');
        }

        if (deleteError) {
            setDeleteError('');
        }

        if (productId !== '') {
            getProductReviews(productId);
        }

        if (isDeleted) {
            errMsg('Review deleted successfully', 'success');
            setIsDeleted(false);
        }
    }, [error, productId, isDeleted, deleteError]);

    const submitHandler = (e) => {
        e.preventDefault();
        getProductReviews(productId);
    };

    // Load review for viewing with InfoModal
    const loadReviewView = async (id) => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/review/${id}`,
                config
            );
            const review = data.data;
            
            // Prepare data for InfoModal
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
            setError(error.response?.data?.message || "Failed to load review data");
        }
    };

    // Handle checkbox
    const handleCheck = (id, isChecked) => {
        setCheckedId((prevCheckedId) => {
            if (isChecked) {
                return [...prevCheckedId, id];
            } else {
                return prevCheckedId.filter((item) => item !== id);
            }
        });
    };

    // SELECT ALL functionality
    const handleSelectAll = (isChecked) => {
        setSelectAll(isChecked);
        if (isChecked) {
            const allIds = reviews.map(review => review._id);
            setCheckedId(allIds);
        } else {
            setCheckedId([]);
        }
    };

    // Update selectAll state when checkboxes change
    useEffect(() => {
        if (reviews.length > 0) {
            setSelectAll(checkedId.length === reviews.length);
        }
    }, [checkedId, reviews]);

    const bulkDelete = () => {
        if (checkedId.length === 0) {
            errMsg('Please select at least one review to delete', 'error');
            return;
        }

        Swal.fire({
            title: 'Delete Reviews',
            icon: 'warning',
            text: `Are you sure you want to delete ${checkedId.length} review(s)?`,
            confirmButtonText: 'Delete',
            showCancelButton: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    for (const id of checkedId) {
                        await deleteReview(id, productId);
                    }
                    setReviews(reviews.filter(review => !checkedId.includes(review._id)));
                    setCheckedId([]);
                    setSelectAll(false);
                    errMsg('Reviews deleted successfully!', 'success');
                } catch (error) {
                    setDeleteError(error.response?.data?.message || 'Failed to delete some reviews');
                }
            }
        });
    };

    return (
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
                        <div className="row justify-content-center mt-5">
                            <div className="col-5">
                                <form onSubmit={submitHandler}>
                                    <div className="form-group">
                                        <label htmlFor="productId_field">Enter Product ID</label>
                                        <input
                                            type="text"
                                            id="productId_field"
                                            className="form-control"
                                            value={productId}
                                            onChange={(e) => setProductId(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        id="search_button"
                                        type="submit"
                                        className="btn btn-primary btn-block py-2"
                                    >
                                        SEARCH
                                    </button>
                                </form>
                            </div>
                        </div>

                        {reviews && reviews.length > 0 ? (
                            <div className="main-container__admin mt-4">
                                <div className="container sub-container__single-lg">
                                    <div className="container-body">
                                        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell />
                                                        <TableCell align="center">
                                                            <Checkbox
                                                                checked={selectAll}
                                                                indeterminate={checkedId.length > 0 && checkedId.length < reviews.length}
                                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>Review ID</TableCell>
                                                        <TableCell>User</TableCell>
                                                        <TableCell>Rating</TableCell>
                                                        <TableCell>Comment</TableCell>
                                                        <TableCell>Created</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {reviews.map((review) => (
                                                        <ReviewRow
                                                            key={review._id}
                                                            review={review}
                                                            handleCheck={handleCheck}
                                                            isChecked={checkedId.includes(review._id)}
                                                            loadViewModal={loadReviewView}
                                                            deleteReview={deleteReviewHandler}
                                                        />
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </div>

                                    <div className="container-footer" style={{ padding: '16px' }}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            gap: 2,
                                        }}>
                                            <Button
                                                variant="contained"
                                                onClick={bulkDelete}
                                                disabled={checkedId.length === 0}
                                                sx={{
                                                    backgroundColor: '#c62828',
                                                    '&:hover': {
                                                        backgroundColor: '#b71c1c',
                                                    },
                                                    '&:disabled': {
                                                        backgroundColor: '#9e9e9e',
                                                    }
                                                }}
                                            >
                                                Delete Selected {checkedId.length > 0 ? `(${checkedId.length})` : ''}
                                            </Button>
                                        </Box>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-5 text-center">No Reviews.</p>
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
        <React.Fragment>
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
                <TableCell>
                    <span style={{ wordBreak: 'break-all' }}>{review._id}</span>
                </TableCell>
                <TableCell>
                    {review.user?.first_name} {review.user?.last_name}
                </TableCell>
                <TableCell>
                    <Rating value={review.rating} readOnly size="small" />
                </TableCell>
                <TableCell>{review.comment}</TableCell>
                <TableCell>
                    {new Date(review.createdAt).toLocaleDateString()}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#c62828', fontWeight: 600 }}>
                                Review Details
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0' }}>
                                <strong>Product:</strong> {review.product?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0' }}>
                                <strong>Email:</strong> {review.user?.email || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, color: '#e0e0e0' }}>
                                <strong>Comment:</strong> {review.comment}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => loadViewModal(review._id)}
                                    sx={{ 
                                        backgroundColor: '#424242',
                                        '&:hover': {
                                            backgroundColor: '#212121',
                                        }
                                    }}
                                >
                                    View Full Details
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => deleteReview(review._id)}
                                    startIcon={<DeleteIcon />}
                                    sx={{
                                        '&:disabled': {
                                            backgroundColor: '#9e9e9e',
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

export default Reviews;