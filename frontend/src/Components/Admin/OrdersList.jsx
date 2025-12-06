import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './Layout/SideBar'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getToken } from '../Utils/helpers'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// PrimeReact Components
import "primereact/resources/themes/lara-light-cyan/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

// Material UI Components
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'

import '../../Styles/admin.css'

const OrdersList = () => {
    const navigate = useNavigate()
    const dt = useRef(null)
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [allOrders, setAllOrders] = useState([])
    const [isDeleted, setIsDeleted] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    
    // DataTable State
    const [selectedOrders, setSelectedOrders] = useState([])
    const [expandedRows, setExpandedRows] = useState(null)
    const [globalFilter, setGlobalFilter] = useState('')
    const [first, setFirst] = useState(0)
    const [rows, setRows] = useState(10)
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all')
    
    const errMsg = (message = '') => toast.error(message, {
        position: 'bottom-right'
    })
    const successMsg = (message = '') => toast.success(message, {
        position: 'bottom-right'
    })

    const listOrders = async () => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`, config)
            setAllOrders(data.orders)
            setLoading(false)
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load orders')
            setLoading(false)
        }
    }

    const deleteOrder = async (id) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/order/${id}`, config)
            setIsDeleted(data.success)
            setAllOrders(prevOrders => prevOrders.filter(order => order._id !== id))
            setSelectedOrders(prev => prev.filter(order => order._id !== id))
            successMsg('Order deleted successfully')
        } catch (error) {
            errMsg(error.response?.data?.message || 'Failed to delete order')
        }
    }

    useEffect(() => {
        listOrders()
        if (error) {
            errMsg(error)
            setError('')
        }
    }, [error])

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

    // Helper function to get customer name
    const getCustomerName = (user) => {
        if (!user) return 'N/A';
        if (user.name) return user.name;
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.first_name) return user.first_name;
        if (user.last_name) return user.last_name;
        return 'N/A';
    };

    // Filter orders by status
    const getFilteredOrders = () => {
        if (statusFilter === 'all') {
            return allOrders;
        }
        return allOrders.filter(order => order.orderStatus === statusFilter);
    };

    const filteredOrders = getFilteredOrders();

    const deleteOrderHandler = (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            deleteOrder(id)
        }
    }

    const bulkDelete = () => {
        if (selectedOrders.length === 0) {
            errMsg('Please select at least one order to delete')
            return
        }

        if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) {
            selectedOrders.forEach((order) => {
                deleteOrder(order._id)
            })
            setSelectedOrders([])
        }
    }

    const exportToCSV = () => {
        const csvData = filteredOrders.map(order => ({
            'Order ID': order._id,
            'Customer': getCustomerName(order.user),
            'Items': order.orderItems.length,
            'Amount': `₱${order.totalPrice}`,
            'Status': order.orderStatus,
            'Date': new Date(order.createdAt).toLocaleDateString()
        }))

        const headers = Object.keys(csvData[0]).join(',')
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        const csv = [headers, ...rows].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        successMsg('Orders exported to CSV')
    }

    const exportToPDF = () => {
    const doc = new jsPDF();

    // Header with F1 theme
    doc.setFillColor(220, 0, 0); // F1 Red
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDERS REPORT', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 26, { align: 'center' });
    doc.text(`Total Orders: ${filteredOrders.length}`, 105, 32, { align: 'center' });

    // Summary section
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER SUMMARY', 14, 50);

    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const processingCount = filteredOrders.filter(o => o.orderStatus === 'Processing').length;
    const shippedCount = filteredOrders.filter(o => o.orderStatus === 'Shipped').length;
    const deliveredCount = filteredOrders.filter(o => o.orderStatus === 'Delivered').length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Revenue: Php ${totalAmount.toFixed(2)}`, 14, 58);
    doc.text(`Processing: ${processingCount} | Shipped: ${shippedCount} | Delivered: ${deliveredCount}`, 14, 64);

    // Table data
    const tableData = filteredOrders.map(order => [
        order._id.substring(0, 10) + '...',
        getCustomerName(order.user),
        order.orderItems.length.toString(),
        `Php ${order.totalPrice.toFixed(2)}`,
        order.orderStatus,
        new Date(order.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
        head: [['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date']],
        body: tableData,
        startY: 72,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [220, 0, 0],
            lineWidth: 0.5
        },
        headStyles: {
            fillColor: [220, 0, 0], // F1 Red
            textColor: [255, 255, 255], // White
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245] // Light gray
        },
        columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 40 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
            4: { cellWidth: 30, halign: 'center' },
            5: { cellWidth: 30, halign: 'center' }
        },
        didParseCell: function (data) {
            // Color code status cells
            if (data.column.index === 4 && data.section === 'body') {
                const status = data.cell.raw;
                if (status === 'Processing') {
                    data.cell.styles.textColor = [255, 152, 0]; // Orange
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Shipped') {
                    data.cell.styles.textColor = [33, 150, 243]; // Blue
                    data.cell.styles.fontStyle = 'bold';
                } else if (status === 'Delivered') {
                    data.cell.styles.textColor = [76, 175, 80]; // Green
                    data.cell.styles.fontStyle = 'bold';
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
            `Page ${i} of ${pageCount} | FormulaHub Orders Report`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`formulahub_orders_${new Date().toISOString().split('T')[0]}.pdf`);
    successMsg('Orders exported to PDF');
};

    // PrimeReact Templates
    const rowExpansionTemplate = (data) => {
        return (
            <div style={{ padding: '1rem', backgroundColor: '#2a2a2a' }}>
                <Typography variant="h6" gutterBottom style={{ marginBottom: '1rem', color: '#fff' }}>
                    Order Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Shipping Information
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        {data.shippingInfo?.address}, {data.shippingInfo?.city}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        {data.shippingInfo?.country} - {data.shippingInfo?.postalCode}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        Phone: {data.shippingInfo?.phoneNo}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Order Items
                    </Typography>
                    <div style={{ backgroundColor: '#333', borderRadius: '4px', padding: '1rem' }}>
                        {data.orderItems.map((item, index) => (
                            <Box key={index} sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mb: 1,
                                pb: 1,
                                borderBottom: index < data.orderItems.length - 1 ? '1px solid #444' : 'none'
                            }}>
                                <Typography variant="body2" style={{ color: '#fff' }}>
                                    {item.name}
                                </Typography>
                                <Typography variant="body2" style={{ color: '#fff' }}>
                                    Qty: {item.quantity} × ₱{item.price}
                                </Typography>
                            </Box>
                        ))}
                    </div>
                </Box>

                <div className="collapsible-table__controls">
                    <Button
                        component={Link}
                        to={`/admin/order/${data._id}`}
                        className='collapsible-control__item info'
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                    >
                        View Details
                    </Button>
                    <Button
                        className='collapsible-control__item delete'
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteOrderHandler(data._id)}
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

    const customerBodyTemplate = (rowData) => {
        return getCustomerName(rowData.user);
    };

    const itemsBodyTemplate = (rowData) => {
        return rowData.orderItems.length;
    };

    const amountBodyTemplate = (rowData) => {
        return <span style={{ fontWeight: 'bold' }}>₱{rowData.totalPrice}</span>;
    };

    const statusBodyTemplate = (rowData) => {
        const getStatusColor = (status) => {
            switch (status) {
                case 'Processing': return '#ff9800'
                case 'Shipped': return '#2196f3'
                case 'Delivered': return '#4caf50'
                default: return '#757575'
            }
        };

        return (
            <Box
                sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: getStatusColor(rowData.orderStatus) + '20',
                    color: getStatusColor(rowData.orderStatus),
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                }}
            >
                {rowData.orderStatus}
            </Box>
        );
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString();
    };

    // Calculate pagination values
    const totalRecords = filteredOrders.length;
    const currentPage = Math.floor(first / rows) + 1;
    const totalPages = Math.ceil(totalRecords / rows);

    // Paginated data for display
    const paginatedData = filteredOrders.slice(first, first + rows);

    if (loading) return <Loader />

    return (
        <>
            <MetaData title={'All Orders'} />
            
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
                        <h1 className="my-4">Orders Management</h1>

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
                                        placeholder="Search by Order ID or Customer..."
                                        value={globalFilter}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        sx={{ minWidth: 300, flexGrow: 1 }}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                    
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Status Filter</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            label="Status Filter"
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                setFirst(0);
                                            }}
                                        >
                                            <MenuItem value="all">All Status</MenuItem>
                                            <MenuItem value="Processing">Processing</MenuItem>
                                            <MenuItem value="Shipped">Shipped</MenuItem>
                                            <MenuItem value="Delivered">Delivered</MenuItem>
                                            <MenuItem value="Cancelled">Cancelled</MenuItem>
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
                                        selection={selectedOrders}
                                        onSelectionChange={(e) => setSelectedOrders(e.value)}
                                        dataKey="_id"
                                        paginator={false}
                                        globalFilter={globalFilter}
                                        responsiveLayout="scroll"
                                        expandedRows={expandedRows}
                                        onRowToggle={(e) => setExpandedRows(e.data)}
                                        rowExpansionTemplate={rowExpansionTemplate}
                                        emptyMessage="No orders found"
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
                                            header="Order ID" 
                                            body={idBodyTemplate} 
                                            sortable 
                                            style={{ minWidth: '250px' }} 
                                        />
                                        <Column 
                                            field="user" 
                                            header="Customer" 
                                            body={customerBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '150px' }}
                                        />
                                        <Column 
                                            field="orderItems" 
                                            header="Items" 
                                            body={itemsBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '80px' }}
                                        />
                                        <Column 
                                            field="totalPrice" 
                                            header="Amount" 
                                            body={amountBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '120px' }}
                                        />
                                        <Column 
                                            field="orderStatus" 
                                            header="Status" 
                                            body={statusBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '140px' }}
                                        />
                                        <Column 
                                            field="createdAt" 
                                            header="Date" 
                                            body={dateBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '150px' }}
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
                                                disabled={selectedOrders.length === 0}
                                                startIcon={<DeleteIcon />}
                                            >
                                                Bulk Delete {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}
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
                                                    Total Orders: {totalRecords}
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
                    </div>
                </div>
            </div>
        </>
    )
}

export default OrdersList