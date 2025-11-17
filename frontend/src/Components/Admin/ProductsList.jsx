import React, { useState, useEffect, useRef } from 'react';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser, isAdmin } from '../Utils/helpers';

// PrimeReact Components
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

// Material UI Components
import Button from '@mui/material/Button';
import { CSSTransition } from 'react-transition-group';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import StarIcon from '@mui/icons-material/Star';
import { Typography, TextField, InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Modals
import EditModal from "./Layout/EditModal";
import InfoModal from "./Layout/InfoModal";
import CreateModal from "./Layout/CreateModal";

import { productSchema, productEditSchema } from '../Utils/validationSchema';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';

const ProductList = () => {
  const navigate = useNavigate();
  const createRef = useRef(null);
  const editRef = useRef(null);
  const infoRef = useRef(null);
  const dt = useRef(null);

  // User and Auth
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // CRUD Necessities
  const [apiData, setApiData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [formState, setFormState] = useState({
    _id: '',
    name: '',
    price: '',
    description: '',
    category: '',
    team: '',
    stock: '',
    images: [],
    existingImages: []
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // DataTable State
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredData, setFilteredData] = useState([]);

  // Check authentication on mount
  useEffect(() => {
    const currentUser = getUser();
    const currentToken = getToken();
    
    if (!currentUser || !currentToken) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'admin') {
      navigate('/');
      return;
    }

    setUser(currentUser);
    setToken(currentToken);
  }, [navigate]);

  // Get axios config with auth header
  const getAxiosConfig = () => ({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const onChange = e => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setImagesPreview([]);

    const fileObjects = [];
    const newPreviews = [];

    files.forEach(file => {
      fileObjects.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          newPreviews.push(reader.result);
          if (newPreviews.length === files.length) {
            setImagesPreview(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setFormState((prevState) => ({
      ...prevState,
      images: fileObjects,
    }));
  }

  const resetFormstate = () => {
    setFormState({
      _id: '',
      name: '',
      price: '',
      description: '',
      category: '',
      team: '',
      stock: '',
      images: [],
      existingImages: []
    });
    setImagesPreview([]);
  }

  const loadModalCreate = () => {
    resetFormstate();
    setOpenModal(true);
  }

  const loadDataGen = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/product/${id}`, getAxiosConfig());
      const productData = response.data.data;
      
      setFormState({
        _id: id,
        name: productData.name,
        price: productData.price,
        description: productData.description,
        category: productData.category?._id || '',
        team: productData.team?._id || '',
        stock: productData.stock,
        images: [],
        existingImages: productData.images || []
      });

      const imagePreviews = (productData.images || []).map(image => image.url);
      setImagesPreview(imagePreviews);

      return productData;
    } catch (error) {
      console.error('Error loading product data:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        alert('Failed to load product data');
      }
    }
  }

  const loadDataByIdEdit = async (id) => {
    resetFormstate();
    await loadDataGen(id);
    setEditModal(true);
  }

  const loadDataByIdInfo = async (id) => {
    resetFormstate();
    const productData = await loadDataGen(id);

    setFormState(prev => ({
      ...prev,
      images: productData.images || [],
      existingImages: []
    }));

    setInfoModal(true);
  }

  const handleSubmit = async (validatedData) => {
    if (!token) {
      alert('Please log in to create products');
      navigate('/login');
      return;
    }

    try {
      const base64Images = await Promise.all(
        Array.from(validatedData.images).map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const productData = {
        name: validatedData.name.trim(),
        price: parseFloat(validatedData.price),
        description: validatedData.description.trim(),
        category: validatedData.category,
        team: validatedData.team,
        stock: parseInt(validatedData.stock),
        images: base64Images
      };

      console.log('Sending product data:', productData);

      const response = await axios.post('http://localhost:8000/api/v1/product/', productData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000,
      });

      if (response.data.success) {
        alert('Product created successfully!');
        setOpenModal(false);
        resetFormstate();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create product';
        alert('Failed to create product: ' + errorMessage);
      }
    }
  };

  const handleUpdate = async (validatedData) => {
    if (!token) {
      alert('Please log in to update products');
      navigate('/login');
      return;
    }

    try {
      const priceValue = parseFloat(validatedData.price);

      const productData = {
        name: validatedData.name,
        price: priceValue,
        description: validatedData.description,
        category: validatedData.category,
        team: validatedData.team,
        stock: parseInt(validatedData.stock)
      };

      if (validatedData.images && validatedData.images.length > 0) {
        console.log('New images provided, replacing existing images');
        productData.images = validatedData.images;
      } else {
        console.log('No new images provided, keeping existing images');
        productData.images = formState.existingImages;
      }

      console.log('Updating product with data:', productData);

      const response = await axios.put(
        `http://localhost:8000/api/v1/product/${formState._id}`,
        productData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000
        }
      );

      if (response.data.success) {
        alert('Product updated successfully!');
        setEditModal(false);
        resetFormstate();
        fetchProducts();
      }

    } catch (error) {
      console.error('Error updating product:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        alert('Failed to update product: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      alert('Please log in to delete products');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:8000/api/v1/product/${id}`,
        getAxiosConfig()
      );
      
      if (response.data.success) {
        setApiData((prevData) => prevData.filter((product) => product._id !== id));
        setSelectedProducts((prev) => prev.filter((prod) => prod._id !== id));
        alert('Product deleted successfully!');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete product';
        alert('Failed to delete product: ' + errorMessage);
      }
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      try {
        for (const product of selectedProducts) {
          await handleDelete(product._id);
        }
        setSelectedProducts([]);
      } catch (e) {
        console.log(e);
      }
    }
  };

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

  // Fetch categories and teams
  useEffect(() => {
    if (!token) return;

    const fetchCategoriesAndTeams = async () => {
      try {
        const [categoriesRes, teamsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/category'),
          axios.get('http://localhost:8000/api/v1/team')
        ]);

        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
        }
        if (teamsRes.data.success) {
          setTeams(teamsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories/teams:', error);
      }
    };

    fetchCategoriesAndTeams();
  }, [token]);

  // Fetch products function
  const fetchProducts = async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Fetch all products without pagination limits
      const response = await axios.get(`http://localhost:8000/api/v1/product?limit=1000`);

      if (response.data.success) {
        const products = response.data.data;

        // Fetch reviews for each product to calculate accurate ratings
        const productsWithReviews = await Promise.all(
          products.map(async (product) => {
            try {
              const reviewsResponse = await axios.get(`http://localhost:8000/api/v1/review`);
              if (reviewsResponse.data.success) {
                const productReviews = reviewsResponse.data.data.filter(
                  review => review.product?._id === product._id
                );

                const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
                const averageRating = productReviews.length > 0
                  ? (totalRating / productReviews.length).toFixed(1)
                  : 0;

                return {
                  ...product,
                  ratings: parseFloat(averageRating),
                  numOfReviews: productReviews.length
                };
              }
              return product;
            } catch (error) {
              console.error(`Error fetching reviews for product ${product._id}:`, error);
              return product;
            }
          })
        );

        setApiData(productsWithReviews);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  // Apply category filter and search - show all products by default when 'all' is selected
  useEffect(() => {
    let filtered = [...apiData];

    // Apply category filter first
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?._id === categoryFilter);
    }

    // Apply search filter
    if (globalFilter && globalFilter.trim() !== '') {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.name?.toLowerCase().includes(searchLower) ||
        product.team?.name?.toLowerCase().includes(searchLower) ||
        product._id?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
    // Reset to first page when filters change
    setFirst(0);
  }, [categoryFilter, globalFilter, apiData]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredData.map(product => ({
      'Product ID': product._id,
      'Name': product.name,
      'Price': product.price,
      'Category': product.category?.name || 'N/A',
      'Team': product.team?.name || 'N/A',
      'Stock': product.stock,
      'Ratings': product.ratings,
      'Reviews': product.numOfReviews,
      'Created': new Date(product.createdAt).toLocaleString()
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert('Products exported to CSV');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Products Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Products: ${filteredData.length}`, 14, 36);

    const tableData = filteredData.map(product => [
      product._id.substring(0, 8) + '...',
      product.name.substring(0, 20),
      `₱${product.price}`,
      product.category?.name || 'N/A',
      product.stock,
      product.ratings
    ]);

    autoTable(doc, {
      head: [['Product ID', 'Name', 'Price', 'Category', 'Stock', 'Rating']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [198, 40, 40] }
    });

    doc.save(`products_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('Products exported to PDF');
  };

  // PrimeReact Templates
  const rowExpansionTemplate = (data) => {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a' }}>
        <Typography variant="h6" gutterBottom component="div" style={{ marginBottom: '1rem', color: '#fff' }}>
          Product Details
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" style={{ color: '#fff' }}>
            <strong>Description:</strong> {data.description}
          </Typography>
          <Typography variant="body2" style={{ color: '#fff' }}>
            <strong>Created At:</strong> {new Date(data.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="body2" style={{ color: '#fff' }}>
            <strong>Rating:</strong> {data.ratings > 0 ? `${data.ratings} / 5.0` : 'No ratings yet'}
            ({data.numOfReviews} {data.numOfReviews === 1 ? 'review' : 'reviews'})
          </Typography>
        </Box>

        {/* Images Section */}
        <Typography variant="subtitle2" gutterBottom style={{ color: '#fff' }}>
          Product Images
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          {data.images && data.images.length > 0 ? (
            data.images.map((image, index) => (
              <Box key={index} sx={{ width: 150, height: 150 }}>
                <img
                  src={image.url}
                  alt={`Product ${data.name} - Image ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              </Box>
            ))
          ) : (
            <Typography variant="body2" style={{ color: '#aaa' }}>
              No images available
            </Typography>
          )}
        </Box>

        <div className="collapsible-table__controls">
          {user?.role === 'admin' && (
            <>
              <Button
                className='collapsible-control__item delete'
                variant="contained"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    handleDelete(data._id);
                  }
                }}
              >
                Delete
              </Button>
              <Button
                className='collapsible-control__item update'
                variant="contained"
                onClick={() => loadDataByIdEdit(data._id)}
              >
                Update
              </Button>
            </>
          )}
          <Button
            className='collapsible-control__item info'
            variant="contained"
            onClick={() => loadDataByIdInfo(data._id)}
          >
            View Info
          </Button>
        </div>
      </div>
    );
  };

  const idBodyTemplate = (rowData) => {
    return <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{rowData._id}</span>;
  };

  const priceBodyTemplate = (rowData) => {
    return `₱${rowData.price}`;
  };

  const categoryBodyTemplate = (rowData) => {
    return rowData.category?.name || 'N/A';
  };

  const teamBodyTemplate = (rowData) => {
    return rowData.team?.name || 'N/A';
  };

  const ratingBodyTemplate = (rowData) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <StarIcon sx={{ fontSize: 16, color: '#ffa726' }} />
        <Typography variant="body2">
          {rowData.ratings > 0 ? rowData.ratings : 'N/A'} ({rowData.numOfReviews})
        </Typography>
      </Box>
    );
  };

  const modalData = {
    title: 'Product',
    content: 'product.',
    fields: [
      {
        label: 'Product Name',
        type: 'text',
        name: 'name',
        placeholder: 'Enter Product Name',
        className: 'input-field',
        value: formState.name,
        onChange: (e) => setFormState({ ...formState, name: e.target.value }),
        required: true,
      },
      {
        label: 'Price',
        type: 'number',
        name: 'price',
        placeholder: 'Enter Price',
        value: formState.price,
        onChange: (e) => setFormState({ ...formState, price: e.target.value }),
        required: true,
        min: 0,
        step: '0.01'
      },
      {
        label: 'Description',
        type: 'textarea',
        name: 'description',
        placeholder: 'Enter Description',
        value: formState.description,
        onChange: (e) => setFormState({ ...formState, description: e.target.value }),
        required: true,
      },
      {
        label: 'Category',
        type: 'select',
        name: 'category',
        value: formState.category,
        onChange: (e) => setFormState({ ...formState, category: e.target.value }),
        required: true,
        options: categories.map(cat => ({ value: cat._id, label: cat.name }))
      },
      {
        label: 'Team',
        type: 'select',
        name: 'team',
        value: formState.team,
        onChange: (e) => setFormState({ ...formState, team: e.target.value }),
        required: true,
        options: teams.map(team => ({ value: team._id, label: team.name }))
      },
      {
        label: 'Stock',
        type: 'number',
        name: 'stock',
        placeholder: 'Enter Stock Quantity',
        value: formState.stock,
        onChange: (e) => setFormState({ ...formState, stock: e.target.value }),
        required: true,
        min: 0,
      },
      {
        label: 'Images',
        type: 'file',
        name: 'images',
        id: 'custom_file',
        onChange: (e) => onChange(e),
        required: false,
        multiple: true,
      },
    ]
  };

  // Calculate pagination values
  const totalRecords = filteredData.length;
  const currentPage = Math.floor(first / rows) + 1;
  const totalPages = Math.ceil(totalRecords / rows) || 1;

  // Paginated data for display
  const paginatedData = filteredData.slice(first, first + rows);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Checking authentication...</div>;

  return (
    <>
      <MetaData title={'Products Management'} />

      <div className="admin-layout">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <i className="fa fa-bars"></i>
        </button>

        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />

        <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="container-fluid">
            <h1 className="my-4">Products Management</h1>

            <div className="main-container__admin">
              <div className="sub-container__single-lg">
                {/* Search, Filter and Export */}
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
                    placeholder="Search by Name, Category, Team or ID..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    sx={{ minWidth: 300, flexGrow: 1 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Category Filter</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category Filter"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                      ))}
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

                {/* DataTable */}
                <Box sx={{ 
                  padding: '0 20px', 
                  height: 'calc(100vh - 420px)',
                  minHeight: '400px',
                  overflow: 'auto'
                }}>
                  <DataTable
                    ref={dt}
                    value={paginatedData}
                    selection={selectedProducts}
                    onSelectionChange={(e) => setSelectedProducts(e.value)}
                    dataKey="_id"
                    paginator={false}
                    responsiveLayout="scroll"
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    emptyMessage="No products found"
                    stripedRows
                    loading={loading}
                    scrollable
                    scrollHeight="100%"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Column expander style={{ width: '3rem' }} />
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="_id" header="ID" body={idBodyTemplate} sortable style={{ minWidth: '300px' }} />
                    <Column field="name" header="Name" sortable style={{ minWidth: '150px' }} />
                    <Column field="price" header="Price" body={priceBodyTemplate} sortable style={{ minWidth: '100px' }} />
                    <Column field="category.name" header="Category" body={categoryBodyTemplate} sortable style={{ minWidth: '120px' }} />
                    <Column field="team.name" header="Team" body={teamBodyTemplate} sortable style={{ minWidth: '120px' }} />
                    <Column field="stock" header="Stock" sortable style={{ minWidth: '80px' }} />
                    <Column field="ratings" header="Rating" body={ratingBodyTemplate} sortable style={{ minWidth: '150px' }} />
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
                        className='MuiButton-custom___btn'
                        variant="contained"
                        onClick={loadModalCreate}
                      >
                        Create New Product
                      </Button>
                      <Button
                        variant="contained"
                        className='invert-button'
                        onClick={bulkDelete}
                        disabled={selectedProducts.length === 0}
                      >
                        Bulk Delete {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''}
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
                          Total Products: {totalRecords}
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
                          Page {currentPage} of {totalPages}
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

      {/* Modals with proper z-index */}
      <CSSTransition
        in={openModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={createRef}
      >
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <CreateModal
            ref={createRef}
            setOpenModal={setOpenModal}
            modalData={modalData}
            handleSubmit={handleSubmit}
            imagesPreview={imagesPreview}
            setImagesPreview={setImagesPreview}
            validationSchema={productSchema}
          />
        </div>
      </CSSTransition>

      <CSSTransition
        in={editModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={editRef}
      >
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <EditModal
            ref={editRef}
            setOpenModal={setEditModal}
            modalData={modalData}
            handleUpdate={handleUpdate}
            formState={formState}
            imagesPreview={imagesPreview}
            setImagesPreview={setImagesPreview}
            validationSchema={productEditSchema}
          />
        </div>
      </CSSTransition>

      <CSSTransition
        in={infoModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={infoRef}
      >
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <InfoModal
            ref={infoRef}
            setOpenModal={setInfoModal}
            modalData={modalData}
            formState={formState}
            categories={categories}
            teams={teams}
          />
        </div>
      </CSSTransition>
    </>
  );
}

export default ProductList;