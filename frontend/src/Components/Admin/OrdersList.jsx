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
import 'jspdf-autotable'

import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [allOrders, setAllOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [isDeleted, setIsDeleted] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    
    // Pagination
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    
    // Selection
    const [checkedId, setCheckedId] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    
    // Filters and Search
    const [searchTerm, setSearchTerm] = useState('')
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
            setFilteredOrders(data.orders)
            setTotal(data.orders.length)
            setTotalPages(Math.ceil(data.orders.length / limit))
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
            setCheckedId(prevChecked => prevChecked.filter(checkedId => checkedId !== id))
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

    // Filter and search orders
    useEffect(() => {
        let filtered = [...allOrders]
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.orderStatus === statusFilter)
        }
        
        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(order => {
                const customerName = getCustomerName(order.user);
                return order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customerName.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        setFilteredOrders(filtered)
        setTotal(filtered.length)
        setTotalPages(Math.ceil(filtered.length / limit))
        setPage(1)
    }, [searchTerm, statusFilter, allOrders, limit])

    const deleteOrderHandler = (id) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            deleteOrder(id)
        }
    }

    const handleCheck = (id, isChecked) => {
        setCheckedId((prevCheckedId) => {
            if (isChecked) {
                return [...prevCheckedId, id]
            } else {
                return prevCheckedId.filter((item) => item !== id)
            }
        })
    }

    const handleSelectAll = (isChecked) => {
        setSelectAll(isChecked)
        if (isChecked) {
            const currentPageOrders = getCurrentPageOrders()
            const allIds = currentPageOrders.map(order => order._id)
            setCheckedId(allIds)
        } else {
            setCheckedId([])
        }
    }

    useEffect(() => {
        const currentPageOrders = getCurrentPageOrders()
        if (currentPageOrders.length > 0) {
            setSelectAll(checkedId.length === currentPageOrders.length && currentPageOrders.every(order => checkedId.includes(order._id)))
        }
    }, [checkedId, page, filteredOrders])

    const bulkDelete = () => {
        if (checkedId.length === 0) {
            errMsg('Please select at least one order to delete')
            return
        }

        if (window.confirm(`Are you sure you want to delete ${checkedId.length} order(s)?`)) {
            checkedId.forEach((id) => {
                deleteOrder(id)
            })
            setCheckedId([])
            setSelectAll(false)
        }
    }

    const getCurrentPageOrders = () => {
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        return filteredOrders.slice(startIndex, endIndex)
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
        const rows = csvData.map(row => Object.values(row).join(','))
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
        const doc = new jsPDF()
        
        doc.setFontSize(18)
        doc.text('Orders Report', 14, 22)
        
        doc.setFontSize(11)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
        doc.text(`Total Orders: ${total}`, 14, 36)
        
        const tableData = filteredOrders.map(order => [
            order._id.substring(0, 8) + '...',
            getCustomerName(order.user),
            order.orderItems.length,
            `₱${order.totalPrice}`,
            order.orderStatus,
            new Date(order.createdAt).toLocaleDateString()
        ])
        
        doc.autoTable({
            head: [['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date']],
            body: tableData,
            startY: 42,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [25, 118, 210] }
        })
        
        doc.save(`orders_${new Date().toISOString().split('T')[0]}.pdf`)
        successMsg('Orders exported to PDF')
    }

    if (loading) return <Loader />

    const currentPageOrders = getCurrentPageOrders()

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
                            <div className="container sub-container__single-lg">
                                {/* Filters and Search */}
                                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by Order ID or Customer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        sx={{ minWidth: 300 }}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                    
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel>Status Filter</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            label="Status Filter"
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="all">All Status</MenuItem>
                                            <MenuItem value="Processing">Processing</MenuItem>
                                            <MenuItem value="Shipped">Shipped</MenuItem>
                                            <MenuItem value="Delivered">Delivered</MenuItem>
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
                                        <Table stickyHeader aria-label="orders table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell />
                                                    <TableCell align="center">
                                                        <Checkbox
                                                            checked={selectAll}
                                                            indeterminate={checkedId.length > 0 && checkedId.length < currentPageOrders.length}
                                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>Order ID</TableCell>
                                                    <TableCell align="right">Customer</TableCell>
                                                    <TableCell align="right">Items</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                    <TableCell align="right">Status</TableCell>
                                                    <TableCell align="right">Date</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {currentPageOrders.length > 0 ? (
                                                    currentPageOrders.map((order) => (
                                                        <OrderRow
                                                            key={order._id}
                                                            order={order}
                                                            handleCheck={handleCheck}
                                                            isChecked={checkedId.includes(order._id)}
                                                            deleteOrder={deleteOrderHandler}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center">
                                                            <Typography>No orders found</Typography>
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
                                                    Total Orders: {total}
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
                    </div>
                </div>
            </div>
        </>
    )
}

function OrderRow({ order, handleCheck, isChecked, deleteOrder }) {
    const [open, setOpen] = useState(false)

    const getCustomerName = (user) => {
        if (!user) return 'N/A';
        if (user.name) return user.name;
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.first_name) return user.first_name;
        if (user.last_name) return user.last_name;
        return 'N/A';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Processing': return '#ff9800'
            case 'Shipped': return '#2196f3'
            case 'Delivered': return '#4caf50'
            default: return '#757575'
        }
    }

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell align="center">
                    <Checkbox
                        checked={isChecked}
                        onChange={(e) => handleCheck(order._id, e.target.checked)}
                    />
                </TableCell>
                <TableCell sx={{ minWidth: '200px', fontFamily: 'monospace' }}>
                    {order._id}
                </TableCell>
                <TableCell align="right">{getCustomerName(order.user)}</TableCell>
                <TableCell align="right">{order.orderItems.length}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ₱{order.totalPrice}
                </TableCell>
                <TableCell align="right">
                    <Box
                        sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: getStatusColor(order.orderStatus) + '20',
                            color: getStatusColor(order.orderStatus),
                            fontWeight: 'bold',
                            fontSize: '0.875rem'
                        }}
                    >
                        {order.orderStatus}
                    </Box>
                </TableCell>
                <TableCell align="right">
                    {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Order Details
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Shipping Information
                                </Typography>
                                <Typography variant="body2">
                                    {order.shippingInfo?.address}, {order.shippingInfo?.city}
                                </Typography>
                                <Typography variant="body2">
                                    {order.shippingInfo?.country} - {order.shippingInfo?.postalCode}
                                </Typography>
                                <Typography variant="body2">
                                    Phone: {order.shippingInfo?.phoneNo}
                                </Typography>
                            </Box>

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Order Items
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {order.orderItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">₱{item.price}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    component={Link}
                                    to={`/admin/order/${order._id}`}
                                    variant="contained"
                                    startIcon={<VisibilityIcon />}
                                    size="small"
                                >
                                    View Details
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => deleteOrder(order._id)}
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
    )
}

export default OrdersList