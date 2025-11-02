import React, { useState, useEffect, useRef } from 'react';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import axios from 'axios';

// Icons and Imported Components
import Button from '@mui/material/Button';
import { CSSTransition } from 'react-transition-group';

// Modals
import EditModal from "./Layout/EditModal";
import InfoModal from "./Layout/InfoModal";
import CreateModal from "./Layout/CreateModal";

import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { IconButton, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';

const ProductList = () => {
  const createRef = useRef(null);
  const editRef = useRef(null);
  const infoRef = useRef(null);

  // CRUD Necessities
  const [apiData, setApiData] = useState([]);
  const [flattenData, setFlattenData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [checkedId, setCheckedId] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
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

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
      const response = await axios.get(`http://localhost:8000/api/v1/product/${id}`);
      const productData = response.data.data; // Changed from response.data.product

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
      alert('Failed to load product data');
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

  const handleSubmit = async (event) => {
  event.preventDefault();
  
  // Validate all required fields
  if (!formState.name || !formState.description || !formState.category || !formState.team || !formState.stock) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Validate price
  const priceValue = parseFloat(formState.price);
  if (isNaN(priceValue) || priceValue < 0 || priceValue > 5000) {
    alert('Please enter a valid price between 0 and 5000');
    return;
  }
  
  // Validate stock
  const stockValue = parseInt(formState.stock);
  if (isNaN(stockValue) || stockValue < 0) {
    alert('Please enter a valid stock quantity (must be 0 or greater)');
    return;
  }
  
  // Validate images
  if (!formState.images || formState.images.length === 0) {
    alert('Please upload at least one product image');
    return;
  }
  
  try {
    // Convert images to base64
    const base64Images = await Promise.all(
      formState.images.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const productData = {
      name: formState.name.trim(),
      price: priceValue,
      description: formState.description.trim(),
      category: formState.category,
      team: formState.team, // THIS WAS MISSING!
      stock: stockValue,
      images: base64Images
    };

    console.log('Sending product data:', productData);

    const response = await axios.post('http://localhost:8000/api/v1/product/', productData, {
      headers: {
        'Content-Type': 'application/json',
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
    
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create product';
    alert('Failed to create product: ' + errorMessage);
  }
};

  const handleUpdate = async () => {
  // Validate price
  const priceValue = parseInt(formState.price);
  if (isNaN(priceValue) || priceValue < 0 || priceValue > 5000) {
    alert('Please enter a valid price between 0 and 5000');
    return;
  }
  
  try {
    let imagesToSend = formState.existingImages;

    if (formState.images && formState.images.length > 0) {
      const base64Images = await Promise.all(
        formState.images.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        })
      );
      imagesToSend = base64Images;
    }

    const productData = {
      name: formState.name,
      price: priceValue, // Use validated integer
      description: formState.description,
      category: formState.category,
      team: formState.team,
      stock: parseInt(formState.stock),
      images: imagesToSend
    };

    console.log('Updating product with data:', productData); // Debug log

    const response = await axios.put(
      `http://localhost:8000/api/v1/product/${formState._id}`,
      productData,
      {
        headers: { 'Content-Type': 'application/json' },
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
    console.error('Error response:', error.response?.data); // Debug log
    alert('Failed to update product: ' + (error.response?.data?.message || error.message));
  }
};

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:8000/api/v1/product/${id}`);
      if (response.data.success) {
        alert('Product deleted successfully!');
        setCheckedId((prevChecked) => prevChecked.filter((checkedId) => checkedId !== id));
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
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

  // Fetch categories and teams
  useEffect(() => {
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
  }, []);

  // Fetch products function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/v1/product?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        setApiData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.data.length);
        setTotalPages(response.data.pagination?.pages || Math.ceil(response.data.data.length / limit));
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

  // Fetch products on mount and when page/limit changes
  useEffect(() => {
    fetchProducts();
  }, [page, limit]);

  useEffect(() => {
    if (apiData.length > 0) {
      const flattened = apiData.map(product => ({
        id: product._id,
        name: product.name || 'No Name',
        price: product.price || 0,
        description: product.description || 'No Description',
        category: product.category?.name || 'No Category',
        categoryId: product.category?._id || '',
        team: product.team?.name || 'No Team',
        teamId: product.team?._id || '',
        stock: product.stock || 0,
        ratings: product.ratings || 0,
        numOfReviews: product.numOfReviews || 0,
        images: Array.isArray(product.images) ? product.images : [],
        createdAt: new Date(product.createdAt).toLocaleString(),
      }));
      setFlattenData(flattened);
    }
  }, [apiData]);

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
      const allIds = flattenData.map(row => row.id);
      setCheckedId(allIds);
    } else {
      setCheckedId([]);
    }
  };

  useEffect(() => {
    if (flattenData.length > 0) {
      setSelectAll(checkedId.length === flattenData.length);
    }
  }, [checkedId, flattenData]);

  const bulkDelete = async () => {
    if (checkedId.length === 0) {
      alert('Please select at least one product to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${checkedId.length} product(s)?`)) {
      try {
        await Promise.all(checkedId.map(id => handleDelete(id)));
        setCheckedId([]);
        setSelectAll(false);
      } catch (e) {
        console.log(e);
      }
    }
  }

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
        type: 'text',
        name: 'price',
        placeholder: 'Enter Price',
        value: formState.price,
        onChange: (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? '' : parseFloat(value);
      if (value === '' || (numValue >= 0 && numValue <= 5000)) {
        setFormState({ ...formState, price: value });
      }
    }
  },
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
        onChange: (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setFormState({ ...formState, stock: value });
    }
  },
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

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error: {error}</div>;

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

        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="container-fluid">
            <h1 className="my-4">Products Management</h1>

            <div className="main-container__admin">
              <div className="container sub-container__single-lg">
                <div className="container-body">
                  <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                    <Table aria-label="collapsible table">
                      <TableHead>
                        <TableRow>
                          <TableCell />
                          <TableCell align="center">
                            <Checkbox
                              checked={selectAll}
                              indeterminate={checkedId.length > 0 && checkedId.length < flattenData.length}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              inputProps={{ 'aria-label': 'select all products' }}
                            />
                          </TableCell>
                          <TableCell>ID</TableCell>
                          <TableCell align="right">Name</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Category</TableCell>
                          <TableCell align="right">Team</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell align="right">Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {flattenData ? (
                          flattenData.length > 0 ? (
                            flattenData.map((row) => (
                              <Row
                                key={row.id}
                                row={row}
                                handleCheck={handleCheck}
                                isChecked={checkedId.includes(row.id)}
                                loadEditModal={loadDataByIdEdit}
                                loadInfoModal={loadDataByIdInfo}
                                deleteProduct={handleDelete}
                              />
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} align="center">
                                <Typography>No Data Available</Typography>
                              </TableCell>
                            </TableRow>
                          )
                        ) : null}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>

                <div className="container-footer" style={{ padding: '16px' }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      gap: 2,
                      borderBottom: '1px solid rgba(224, 224, 224, 1)',
                      pb: 2
                    }}>
                      <Button
                        className='MuiButton-custom___btn'
                        variant="contained"
                        onClick={loadModalCreate}
                        sx={{
                          backgroundColor: '#1976d2',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          }
                        }}
                      >
                        Create New Product
                      </Button>
                      <Button
                        variant="contained"
                        className='invert-button'
                        onClick={bulkDelete}
                        disabled={checkedId.length === 0}
                        sx={{
                          backgroundColor: '#d32f2f',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#c62828',
                          },
                          '&:disabled': {
                            backgroundColor: '#9e9e9e',
                            color: '#e0e0e0',
                          }
                        }}
                      >
                        Bulk Delete {checkedId.length > 0 ? `(${checkedId.length})` : ''}
                      </Button>
                    </Box>

                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2
                    }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flex: '1 1 auto'
                      }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={limit}
                            onChange={(e) => {
                              setLimit(Number(e.target.value));
                              setPage(1); // Reset to first page when limit changes
                            }}
                            sx={{
                              height: '36px',
                              '& .MuiSelect-select': {
                                paddingY: '8px',
                              }
                            }}
                          >
                            <MenuItem value={4}>4 per page</MenuItem>
                            <MenuItem value={8}>8 per page</MenuItem>
                            <MenuItem value={12}>12 per page</MenuItem>
                            <MenuItem value={20}>20 per page</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '200px' }}>
                          Total Products: {total}
                        </Typography>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: '0 0 auto'
                      }}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={page === 1}
                          onClick={() => setPage(prev => Math.max(1, prev - 1))}
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
                            textAlign: 'center'
                          }}
                        >
                          Page {page} of {totalPages}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={page === totalPages}
                          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CSSTransition
        in={openModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={createRef}
      >
        <CreateModal
          ref={createRef}
          setOpenModal={setOpenModal}
          modalData={modalData}
          handleSubmit={handleSubmit}
          imagesPreview={imagesPreview}
          setImagesPreview={setImagesPreview}
        />
      </CSSTransition>

      <CSSTransition
        in={editModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={editRef}
      >
        <EditModal
          ref={editRef}
          setOpenModal={setEditModal}
          modalData={modalData}
          handleUpdate={handleUpdate}
          formState={formState}
          imagesPreview={imagesPreview}
          setImagesPreview={setImagesPreview}
          existingImages={formState.existingImages}
        />
      </CSSTransition>

      <CSSTransition
        in={infoModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
        nodeRef={infoRef}
      >
        <InfoModal
          ref={infoRef}
          setOpenModal={setInfoModal}
          modalData={modalData}
          formState={formState}
          categories={categories}
          teams={teams}
        />
      </CSSTransition>
    </>
  );
}

function Row(props) {
  const { row, handleCheck, isChecked, loadEditModal, loadInfoModal, deleteProduct } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="center">
          <Checkbox
            checked={isChecked}
            onChange={(e) => handleCheck(row.id, e.target.checked)}
            inputProps={{ 'aria-label': 'controlled' }}
          />
        </TableCell>
        <TableCell component="th" scope="row" sx={{ minWidth: '300px' }}>
          {row.id}
        </TableCell>
        <TableCell align="right">{row.name}</TableCell>
        <TableCell align="right">${row.price}</TableCell>
        <TableCell align="right">{row.category}</TableCell>
        <TableCell align="right">{row.team}</TableCell>
        <TableCell align="right">{row.stock}</TableCell>
        <TableCell align="right">{row.ratings} ({row.numOfReviews})</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, width: '100%' }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Product Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2"><strong>Description:</strong> {row.description}</Typography>
                <Typography variant="body2"><strong>Created At:</strong> {row.createdAt}</Typography>
              </Box>
              <Typography variant="h6" gutterBottom component="div">
                Product Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                {row.images && row.images.length > 0 ? (
                  row.images.map((image, index) => (
                    <Box key={index} sx={{ width: 150, height: 150 }}>
                      <img
                        src={image.url}
                        alt={`Product ${row.name} - Image ${index + 1}`}
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
                  <Typography variant="body2" color="text.secondary">
                    No images available
                  </Typography>
                )}
              </Box>
            </Box>
            <div className="collapsible-table__controls">
              <Button
                className='collapsible-control__item delete'
                variant="contained"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    deleteProduct(row.id);
                  }
                }}
              >
                Delete
              </Button>
              <Button
                className='collapsible-control__item update'
                variant="contained"
                onClick={() => loadEditModal(row.id)}
              >
                Update
              </Button>
              <Button
                className='collapsible-control__item info'
                variant="contained"
                onClick={() => loadInfoModal(row.id)}
              >
                View Info
              </Button>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default ProductList;