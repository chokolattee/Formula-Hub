import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom';
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './Layout/SideBar'
import { getToken } from '../Utils/helpers';
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Paper, Typography, Grid } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Dashboard = () => {
    const [products, setProducts] = useState([])
    const [error, setError] = useState('')
    const [orders, setOrders] = useState([])
    const [users, setUsers] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalAmount, setTotalAmount] = useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Date range filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Chart selection for PDF export
    const [selectedCharts, setSelectedCharts] = useState({
        sales: true,
        yearlySales: true,
        products: true,
        categories: true,
        orderStatus: true
    });
    
    // Chart refs for PDF export
    const salesChartRef = useRef(null);
    const yearlySalesChartRef = useRef(null);
    const productsChartRef = useRef(null);
    const categoriesChartRef = useRef(null);
    const orderStatusChartRef = useRef(null);

    // Chart data from API
    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [yearlySalesData, setYearlySalesData] = useState([]);
    const [topProductsData, setTopProductsData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [orderStatusData, setOrderStatusData] = useState([]);
    const [outOfStockCount, setOutOfStockCount] = useState(0);

    // Fetch all dashboard data from the new API endpoint
    const fetchDashboardData = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const { data } = await axios.get(
                `${import.meta.env.VITE_API}/admin/dashboard`,
                { 
                    params,
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                }
            );

            if (data.success) {
                // Set stats
                const stats = data.data.stats;
                setTotalAmount(stats.totalSales || 0);
                
                // Set counts for cards
                setProducts(Array(stats.totalProducts).fill({})); // Create dummy array for count
                setOrders(Array(stats.totalOrders).fill({}));
                setUsers(Array(stats.totalUsers).fill({}));
                
                // Store the actual chart data
                setMonthlySalesData(data.data.monthlySales || []);
                setYearlySalesData(data.data.yearlySales || []); // NEW: Yearly sales data
                setTopProductsData(data.data.topProducts || []);
                setCategoryData(data.data.categoryDistribution || []);
                setOrderStatusData(data.data.orderStatusDistribution || []);
                
                // Store out of stock count
                setOutOfStockCount(stats.outOfStock || 0);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Error loading dashboard data');
        }
    }

    // Chart data functions now return data from API
    const getSalesChartData = () => {
        return monthlySalesData;
    }

    const getYearlySalesChartData = () => {
        return yearlySalesData;
    }

    const getMostOrderedProductsData = () => {
        return topProductsData;
    }

    const getCategoryChartData = () => {
        return categoryData;
    }

    const getOrderStatusChartData = () => {
        return orderStatusData;
    }

    // Colors for pie charts
    const COLORS = ['#e10600', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'];

    // Export charts to PDF
    const exportToPDF = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        let yPosition = 20;
        
        pdf.setFontSize(18);
        pdf.text('Dashboard Report', 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        pdf.setFontSize(11);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
        yPosition += 5;
        
        if (startDate || endDate) {
            const dateRange = `Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`;
            pdf.text(dateRange, 105, yPosition, { align: 'center' });
            yPosition += 10;
        } else {
            yPosition += 10;
        }
        
        const charts = [
            { ref: salesChartRef, selected: selectedCharts.sales, title: 'Monthly Sales' },
            { ref: yearlySalesChartRef, selected: selectedCharts.yearlySales, title: 'Yearly Sales' },
            { ref: productsChartRef, selected: selectedCharts.products, title: 'Most Ordered Products' },
            { ref: categoriesChartRef, selected: selectedCharts.categories, title: 'Product Categories' },
            { ref: orderStatusChartRef, selected: selectedCharts.orderStatus, title: 'Order Status' }
        ];
        
        for (const chart of charts) {
            if (chart.selected && chart.ref.current) {
                const canvas = await html2canvas(chart.ref.current);
                const imgData = canvas.toDataURL('image/png');
                
                if (yPosition > 250) {
                    pdf.addPage();
                    yPosition = 20;
                }
                
                pdf.setFontSize(14);
                pdf.text(chart.title, 105, yPosition, { align: 'center' });
                yPosition += 10;
                
                const imgWidth = 170;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 15;
            }
        }
        
        pdf.save(`dashboard_report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Dashboard exported to PDF');
    }

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

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            await fetchDashboardData();
            setLoading(false);
        };
        
        loadDashboard();
    }, [startDate, endDate])

    return (
        <>
            <MetaData title={'Admin Dashboard'} />
            
            <div className="admin-layout">
                {/* Hamburger menu button */}
                <button 
                    className="sidebar-toggle-btn"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <i className="fa fa-bars"></i>
                </button>

                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {/* Main Content */}
                <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="container-fluid">
                        <h1 className="my-4">Dashboard</h1>

                        {loading ? <Loader /> : (
                            <>
                                {/* Stats Cards */}
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <div className="card text-white bg-primary o-hidden h-100">
                                            <div className="card-body">
                                                <div className="text-center card-font-size">
                                                    Total Sales<br /> 
                                                    <b>₱{totalAmount.toFixed ? totalAmount.toFixed(2) : '0.00'}</b>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-xl-3 col-sm-6 mb-3">
                                        <div className="card text-white bg-success o-hidden h-100">
                                            <div className="card-body">
                                                <div className="text-center card-font-size">
                                                    Products<br /> 
                                                    <b>{products.length}</b>
                                                </div>
                                            </div>
                                            <Link className="card-footer text-white clearfix small z-1" to="/admin/products">
                                                <span className="float-left">View Details</span>
                                                <span className="float-right"><i className="fa fa-angle-right"></i></span>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="col-xl-3 col-sm-6 mb-3">
                                        <div className="card text-white bg-danger o-hidden h-100">
                                            <div className="card-body">
                                                <div className="text-center card-font-size">
                                                    Orders<br /> 
                                                    <b>{orders.length}</b>
                                                </div>
                                            </div>
                                            <Link className="card-footer text-white clearfix small z-1" to="/admin/orders">
                                                <span className="float-left">View Details</span>
                                                <span className="float-right"><i className="fa fa-angle-right"></i></span>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="col-xl-3 col-sm-6 mb-3">
                                        <div className="card text-white bg-info o-hidden h-100">
                                            <div className="card-body">
                                                <div className="text-center card-font-size">
                                                    Users<br /> 
                                                    <b>{users.length}</b>
                                                </div>
                                            </div>
                                            <Link className="card-footer text-white clearfix small z-1" to="/admin/users">
                                                <span className="float-left">View Details</span>
                                                <span className="float-right"><i className="fa fa-angle-right"></i></span>
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="col-xl-3 col-sm-6 mb-3">
                                        <div className="card text-white bg-warning o-hidden h-100">
                                            <div className="card-body">
                                                <div className="text-center card-font-size">
                                                    Out of Stock<br /> 
                                                    <b>{outOfStockCount}</b>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Date Range Filter & Export */}
                                <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label="Start Date"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label="End Date"
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                                >
                                                    Clear Filters
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<PictureAsPdfIcon />}
                                                    onClick={exportToPDF}
                                                    size="small"
                                                    sx={{ backgroundColor: '#e10600', '&:hover': { backgroundColor: '#b00500' } }}
                                                >
                                                    Export to PDF
                                                </Button>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Charts to Export:</Typography>
                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                <FormControlLabel
                                                    control={<Checkbox checked={selectedCharts.sales} onChange={(e) => setSelectedCharts({...selectedCharts, sales: e.target.checked})} />}
                                                    label="Monthly Sales"
                                                />
                                                <FormControlLabel
                                                    control={<Checkbox checked={selectedCharts.yearlySales} onChange={(e) => setSelectedCharts({...selectedCharts, yearlySales: e.target.checked})} />}
                                                    label="Yearly Sales"
                                                />
                                                <FormControlLabel
                                                    control={<Checkbox checked={selectedCharts.products} onChange={(e) => setSelectedCharts({...selectedCharts, products: e.target.checked})} />}
                                                    label="Products Chart"
                                                />
                                                <FormControlLabel
                                                    control={<Checkbox checked={selectedCharts.categories} onChange={(e) => setSelectedCharts({...selectedCharts, categories: e.target.checked})} />}
                                                    label="Categories Chart"
                                                />
                                                <FormControlLabel
                                                    control={<Checkbox checked={selectedCharts.orderStatus} onChange={(e) => setSelectedCharts({...selectedCharts, orderStatus: e.target.checked})} />}
                                                    label="Order Status Chart"
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Charts */}
                                <div className="row">
                                    {/* Monthly Sales Chart */}
                                    <div className="col-12 mb-4">
                                        <Paper ref={salesChartRef} sx={{ p: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                                Monthly Sales
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={getSalesChartData()}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                                    <XAxis dataKey="month" stroke="#fff" />
                                                    <YAxis stroke="#fff" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #e10600' }}
                                                        labelStyle={{ color: '#fff' }}
                                                    />
                                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="sales" 
                                                        stroke="#e10600" 
                                                        strokeWidth={2}
                                                        fill="#e10600"
                                                        name="Sales (₱)"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </div>

                                    {/* Yearly Sales Chart */}
                                    <div className="col-12 mb-4">
                                        <Paper ref={yearlySalesChartRef} sx={{ p: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                                Yearly Sales
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={getYearlySalesChartData()}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                                    <XAxis dataKey="year" stroke="#fff" />
                                                    <YAxis stroke="#fff" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #e10600' }}
                                                        labelStyle={{ color: '#fff' }}
                                                    />
                                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                                    <Bar 
                                                        dataKey="sales" 
                                                        fill="#e10600" 
                                                        name="Sales (₱)"
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </div>

                                    {/* Most Ordered Products Chart */}
                                    <div className="col-md-6 mb-4">
                                        <Paper ref={productsChartRef} sx={{ p: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                                Most Ordered Products (Top 10)
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={getMostOrderedProductsData()}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        stroke="#fff" 
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={100}
                                                    />
                                                    <YAxis stroke="#fff" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #e10600' }}
                                                        labelStyle={{ color: '#fff' }}
                                                    />
                                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                                    <Bar dataKey="units" fill="#e10600" name="Units Sold" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </div>

                                    {/* Product Categories Chart */}
                                    <div className="col-md-6 mb-4">
                                        <Paper ref={categoriesChartRef} sx={{ p: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                                Product Categories Distribution
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={getCategoryChartData()}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {getCategoryChartData().map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #e10600' }}
                                                    />
                                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </div>

                                    {/* Order Status Chart */}
                                    <div className="col-md-6 mb-4">
                                        <Paper ref={orderStatusChartRef} sx={{ p: 3, background: 'linear-gradient(145deg, #2c2c2c 0%, #1a1a1a 100%)' }}>
                                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                                Order Status Distribution
                                            </Typography>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={getOrderStatusChartData()}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {getOrderStatusChartData().map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #e10600' }}
                                                    />
                                                    <Legend wrapperStyle={{ color: '#fff' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Paper>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard