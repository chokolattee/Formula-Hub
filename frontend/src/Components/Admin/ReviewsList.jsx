import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Button,
    Box,
    Typography,
    Rating,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
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

// PrimeReact Components
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import InfoModal from './Layout/InfoModal';
import Loader from '../Layout/Loader';
import { getUser, getToken } from '../Utils/helpers';
import '../../Styles/admin.css';

const Reviews = () => {
    const viewRef = useRef(null);
    const dt = useRef(null);
    
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isDeleted, setIsDeleted] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [selectedReviews, setSelectedReviews] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState(getUser());

    // DataTable State
    const [globalFilter, setGlobalFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    // Filters
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
            setLoading(false);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load reviews');
            setAllReviews([]);
            setLoading(false);
        }
    };

    const deleteReview = async (id, productId) => {
        try {
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/review?id=${id}&productId=${productId}`, config);
            setIsDeleted(data.success);
            setAllReviews(prevReviews => prevReviews.filter(review => review._id !== id));
            setSelectedReviews(prev => prev.filter(review => review._id !== id));
            successMsg('Review deleted successfully');
        } catch (error) {
            errMsg(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // Filter reviews
    const getFilteredReviews = () => {
        let filtered = [...allReviews];
        
        if (productIdFilter.trim()) {
            filtered = filtered.filter(review => 
                review.product?._id?.toLowerCase().includes(productIdFilter.toLowerCase())
            );
        }
        
        if (ratingFilter !== 'all') {
            filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
        }
        
        return filtered;
    };

    const filteredReviews = getFilteredReviews();

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

    const bulkDelete = () => {
        if (selectedReviews.length === 0) {
            errMsg('Please select at least one review to delete');
            return;
        }

        Swal.fire({
            title: 'Delete Reviews',
            icon: 'warning',
            text: `Are you sure you want to delete ${selectedReviews.length} review(s)?`,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d32f2f',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                selectedReviews.forEach((review) => {
                    if (review) {
                        deleteReview(review._id, review.product?._id);
                    }
                });
                setSelectedReviews([]);
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

    // Header with F1 theme
    doc.setFillColor(220, 0, 0); // F1 Red
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REVIEWS REPORT', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 26, { align: 'center' });
    doc.text(`Total Reviews: ${filteredReviews.length}`, 105, 32, { align: 'center' });

    // Summary section
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REVIEW SUMMARY', 14, 50);

    const avgRating = filteredReviews.length > 0
        ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1)
        : 0;
    const fiveStars = filteredReviews.filter(r => r.rating === 5).length;
    const fourStars = filteredReviews.filter(r => r.rating === 4).length;
    const threeStars = filteredReviews.filter(r => r.rating === 3).length;
    const twoStars = filteredReviews.filter(r => r.rating === 2).length;
    const oneStar = filteredReviews.filter(r => r.rating === 1).length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Average Rating: ${avgRating}/5.0`, 14, 58);
    doc.text(`5★: ${fiveStars} | 4★: ${fourStars} | 3★: ${threeStars} | 2★: ${twoStars} | 1★: ${oneStar}`, 14, 64);

    // Table data
    const tableData = filteredReviews.map(review => [
        review._id.substring(0, 10) + '...',
        review.product?.name?.substring(0, 20) || 'N/A',
        `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.trim().substring(0, 20) || 'N/A',
        `${review.rating}/5`,
        review.comment?.substring(0, 35) || 'N/A',
        new Date(review.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
        head: [['Review ID', 'Product', 'User', 'Rating', 'Comment', 'Date']],
        body: tableData,
        startY: 72,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 0, 0],
            lineWidth: 0.5
        },
        headStyles: {
            fillColor: [220, 0, 0], // F1 Red
            textColor: [255, 255, 255], // White
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245] // Light gray
        },
        columnStyles: {
            0: { cellWidth: 28, fontStyle: 'bold', fontSize: 7 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 50, fontSize: 7 },
            5: { cellWidth: 24, halign: 'center' }
        },
        didParseCell: function (data) {
            // Color code rating cells
            if (data.column.index === 3 && data.section === 'body') {
                const rating = parseInt(data.cell.raw);
                if (rating === 5) {
                    data.cell.styles.textColor = [76, 175, 80]; // Green
                    data.cell.styles.fillColor = [200, 230, 201]; // Light green background
                } else if (rating === 4) {
                    data.cell.styles.textColor = [139, 195, 74]; // Light green
                } else if (rating === 3) {
                    data.cell.styles.textColor = [255, 152, 0]; // Orange
                } else if (rating === 2) {
                    data.cell.styles.textColor = [255, 87, 34]; // Deep orange
                } else if (rating === 1) {
                    data.cell.styles.textColor = [244, 67, 54]; // Red
                    data.cell.styles.fillColor = [255, 205, 210]; // Light red background
                }
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Page ${i} of ${pageCount} | FormulaHub Reviews Report`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`formulahub_reviews_${new Date().toISOString().split('T')[0]}.pdf`);
    successMsg('Reviews exported to PDF');
};


    // PrimeReact Templates
    const rowExpansionTemplate = (data) => {
        return (
            <div style={{ padding: '1rem', backgroundColor: '#2a2a2a' }}>
                <Typography variant="h6" gutterBottom style={{ marginBottom: '1rem', color: '#fff' }}>
                    Review Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Product Information
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        <strong>Name:</strong> {data.product?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        <strong>Price:</strong> ₱{data.product?.price?.toLocaleString() || 'N/A'}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        <strong>Product ID:</strong> {data.product?._id || 'N/A'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Customer Information
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        <strong>Name:</strong> {data.user?.first_name} {data.user?.last_name}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        <strong>Email:</strong> {data.user?.email || 'N/A'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Review Content
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Rating value={data.rating} readOnly />
                        <Typography variant="body2" style={{ color: '#ddd' }}>({data.rating}/5)</Typography>
                    </Box>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        {data.comment}
                    </Typography>
                </Box>

                <div className="collapsible-table__controls">
                    <Button
                        className='collapsible-control__item info'
                        variant="contained"
                        onClick={() => loadReviewView(data._id)}
                        startIcon={<VisibilityIcon />}
                    >
                        View Full Details
                    </Button>
                    <Button
                        className='collapsible-control__item delete'
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteReviewHandler(data._id, data.product?._id)}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        );
    };

    const idBodyTemplate = (rowData) => {
        return <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{rowData._id}</span>;
    };

    const productBodyTemplate = (rowData) => {
        return rowData.product?.name || 'N/A';
    };

    const userBodyTemplate = (rowData) => {
        return `${rowData.user?.first_name || ''} ${rowData.user?.last_name || ''}`.trim() || 'N/A';
    };

    const ratingBodyTemplate = (rowData) => {
        return <Rating value={rowData.rating} readOnly size="small" />;
    };

    const commentBodyTemplate = (rowData) => {
        return (
            <Typography noWrap sx={{ maxWidth: '200px' }}>
                {rowData.comment || 'No comment'}
            </Typography>
        );
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString();
    };

    // Calculate pagination values
    const totalRecords = filteredReviews.length;
    const currentPage = Math.floor(first / rows) + 1;
    const totalPages = Math.ceil(totalRecords / rows);

    // Paginated data for display
    const paginatedData = filteredReviews.slice(first, first + rows);

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
                        <h1 className="my-4">Reviews Management</h1>

                        {loading ? (
                            <Loader />
                        ) : (
                            <div className="main-container__admin">
                                <div className="sub-container__single-lg">
                                    {/* Filters and Search */}
                                    <Box sx={{ 
                                        mb: 2, 
                                        display: 'flex', 
                                        gap: 2, 
                                        flexWrap: 'wrap', 
                                        alignItems: 'center',
                                        padding: '20px 20px 0 20px'
                                    }}>
                                        <TextField
                                            size="small"
                                            placeholder="Search by Review ID, User, Comment, or Product Name..."
                                            value={globalFilter}
                                            onChange={(e) => setGlobalFilter(e.target.value)}
                                            sx={{ minWidth: 300, flexGrow: 1 }}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                        />
                                        
                                        <TextField
                                            size="small"
                                            placeholder="Filter by Product ID"
                                            value={productIdFilter}
                                            onChange={(e) => {
                                                setProductIdFilter(e.target.value);
                                                setFirst(0);
                                            }}
                                            sx={{ minWidth: 200 }}
                                        />
                                        
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <InputLabel>Rating Filter</InputLabel>
                                            <Select
                                                value={ratingFilter}
                                                label="Rating Filter"
                                                onChange={(e) => {
                                                    setRatingFilter(e.target.value);
                                                    setFirst(0);
                                                }}
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

                                    {/* DataTable - Direct Display */}
                                    <Box sx={{ 
                                        padding: '0 20px', 
                                        height: 'calc(100vh - 420px)',
                                        minHeight: '400px',
                                        overflow: 'auto'
                                    }}>
                                        <DataTable
                                            ref={dt}
                                            value={paginatedData}
                                            selection={selectedReviews}
                                            onSelectionChange={(e) => setSelectedReviews(e.value)}
                                            dataKey="_id"
                                            paginator={false}
                                            globalFilter={globalFilter}
                                            responsiveLayout="scroll"
                                            expandedRows={expandedRows}
                                            onRowToggle={(e) => setExpandedRows(e.data)}
                                            rowExpansionTemplate={rowExpansionTemplate}
                                            emptyMessage="No reviews found"
                                            stripedRows
                                            loading={loading}
                                            scrollable
                                            scrollHeight="100%"
                                            style={{ fontSize: '0.875rem' }}
                                        >
                                            <Column expander style={{ width: '3rem' }} />
                                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                                            <Column 
                                                field="_id" 
                                                header="Review ID" 
                                                body={idBodyTemplate} 
                                                sortable 
                                                style={{ minWidth: '250px' }} 
                                            />
                                            <Column 
                                                field="product.name" 
                                                header="Product" 
                                                body={productBodyTemplate} 
                                                sortable
                                                style={{ minWidth: '180px' }}
                                            />
                                            <Column 
                                                field="user" 
                                                header="User" 
                                                body={userBodyTemplate} 
                                                sortable
                                                style={{ minWidth: '150px' }}
                                            />
                                            <Column 
                                                field="rating" 
                                                header="Rating" 
                                                body={ratingBodyTemplate} 
                                                sortable
                                                style={{ minWidth: '140px' }}
                                            />
                                            <Column 
                                                field="comment" 
                                                header="Comment" 
                                                body={commentBodyTemplate} 
                                                sortable
                                                style={{ minWidth: '200px', maxWidth: '200px' }}
                                            />
                                            <Column 
                                                field="createdAt" 
                                                header="Date" 
                                                body={dateBodyTemplate} 
                                                sortable
                                                style={{ minWidth: '140px' }}
                                            />
                                        </DataTable>
                                    </Box>

                                    {/* Footer with Action Buttons and Pagination */}
                                    <Box sx={{ 
                                        padding: '16px 20px',
                                        borderTop: '1px solid rgba(225, 6, 0, 0.2)',
                                        marginTop: 'auto'
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2,
                                        }}>
                                            {/* Action Buttons Row */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                gap: 2,
                                                borderBottom: '1px solid rgba(224, 224, 224, 0.2)',
                                                pb: 2
                                            }}>
                                                <Button
                                                    variant="contained"
                                                    className='invert-button'
                                                    onClick={bulkDelete}
                                                    disabled={selectedReviews.length === 0}
                                                    startIcon={<DeleteIcon />}
                                                >
                                                    Bulk Delete {selectedReviews.length > 0 ? `(${selectedReviews.length})` : ''}
                                                </Button>
                                            </Box>

                                            {/* Pagination Row */}
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}>
                                                {/* Left side - Page Size & Total */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    flex: '1 1 auto'
                                                }}>
                                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                                        <Select
                                                            value={rows}
                                                            onChange={(e) => {
                                                                setRows(Number(e.target.value));
                                                                setFirst(0);
                                                            }}
                                                            sx={{
                                                                height: '36px',
                                                                color: '#fff',
                                                                backgroundColor: '#3a3a3a',
                                                                '& .MuiSelect-select': {
                                                                    paddingY: '8px',
                                                                },
                                                                '& .MuiOutlinedInput-notchedOutline': {
                                                                    borderColor: '#555',
                                                                },
                                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                    borderColor: '#777',
                                                                },
                                                                '& .MuiSvgIcon-root': {
                                                                    color: '#fff',
                                                                }
                                                            }}
                                                            MenuProps={{
                                                                PaperProps: {
                                                                    sx: {
                                                                        bgcolor: '#3a3a3a',
                                                                        '& .MuiMenuItem-root': {
                                                                            color: '#fff',
                                                                            '&:hover': {
                                                                                backgroundColor: '#4a4a4a',
                                                                            },
                                                                            '&.Mui-selected': {
                                                                                backgroundColor: '#5a5a5a',
                                                                                '&:hover': {
                                                                                    backgroundColor: '#6a6a6a',
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value={5}>5 per page</MenuItem>
                                                            <MenuItem value={10}>10 per page</MenuItem>
                                                            <MenuItem value={20}>20 per page</MenuItem>
                                                            <MenuItem value={50}>50 per page</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '200px' }}>
                                                        Total Reviews: {totalRecords}
                                                    </Typography>
                                                </Box>

                                                {/* Right side - Pagination Controls */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    flex: '0 0 auto'
                                                }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={first === 0}
                                                        onClick={() => setFirst(Math.max(0, first - rows))}
                                                        sx={{
                                                            minWidth: '32px',
                                                            height: '32px',
                                                            px: 1
                                                        }}
                                                    >
                                                        <NavigateBeforeIcon />
                                                    </Button>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mx: 2,
                                                            minWidth: '100px',
                                                            textAlign: 'center',
                                                            color: '#fff'
                                                        }}
                                                    >
                                                        Page {currentPage} of {totalPages || 1}
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={first + rows >= totalRecords}
                                                        onClick={() => setFirst(Math.min(totalRecords - rows, first + rows))}
                                                        sx={{
                                                            minWidth: '32px',
                                                            height: '32px',
                                                            px: 1
                                                        }}
                                                    >
                                                        <NavigateNextIcon />
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
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
                <div style={{ position: 'fixed', zIndex: 9999 }}>
                    <InfoModal
                        ref={viewRef}
                        setOpenModal={setViewModal}
                        modalData={modalData}
                        formState={formState}
                    />
                </div>
            </CSSTransition>
        </>
    );
};

export default Reviews;