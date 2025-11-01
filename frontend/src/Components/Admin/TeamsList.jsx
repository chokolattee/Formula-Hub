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
import '../../Styles/admin.css'

const Team = () => {
  // MOVED REFS INSIDE THE COMPONENT
  const createRef = useRef(null);
  const editRef = useRef(null);
  const infoRef = useRef(null);

  // CRUD Necessities
  const [apiData, setApiData] = useState([]);
  const [flattenData, setFlattenData] = useState([]);
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
    description: '',
    images: [],
    existingImages: [] 
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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

    // Create preview
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

  // for EDIT modal (stores File objects)
  const onChangeEdit = e => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    setImagesPreview([]);

    const fileObjects = [];
    const newPreviews = [];

    files.forEach(file => {
      fileObjects.push(file);

      // Create preview
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
      description: '', 
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
      const response = await axios.get(`http://localhost:8000/api/v1/team/${id}`);
      const teamData = response.data.data;

      setFormState({
        _id: id,
        name: teamData.name,
        description: teamData.description,
        images: [], 
        existingImages: teamData.images || [] 
      });

      const imagePreviews = (teamData.images || []).map(image => image.url);
      setImagesPreview(imagePreviews);

      return teamData;
    } catch (error) {
      console.error('Error loading team data:', error);
      alert('Failed to load team data');
    }
  }

  const loadDataByIdEdit = async (id) => {
    resetFormstate();
    await loadDataGen(id);
    setEditModal(true);
  }

  const loadDataByIdInfo = async (id) => {
    resetFormstate();
    const teamData = await loadDataGen(id);
    
    setFormState(prev => ({
        ...prev,
        images: teamData.images || [], 
        existingImages: []
    }));
    
    setInfoModal(true);
}

const handleSubmit = async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData();
    formData.append('name', formState.name);
    formData.append('description', formState.description);

    formState.images.forEach((file) => {
      formData.append('images', file);
    });

    const response = await axios.post('http://localhost:8000/api/v1/team', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const newTeam = {
      _id: response.data.data._id,
      name: response.data.data.name,
      description: response.data.data.description,
      images: response.data.data.images,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    
    setApiData((prevData) => [...prevData, newTeam]);
    setOpenModal(false);
    resetFormstate();

    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error('Error creating team:', error);
    alert('Failed to create team: ' + (error.response?.data?.message || error.message));
  }
};

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('name', formState.name);
      formData.append('description', formState.description);

      if (formState.images && formState.images.length > 0) {
        formState.images.forEach(file => {
          // New upload
          if (file instanceof File) {
            formData.append('images', file);
            console.log('Appending new file:', file.name);
          }
        });
      } else {
        if (formState.existingImages && formState.existingImages.length > 0) {
          formData.append('existingImages', JSON.stringify(formState.existingImages));
        }
      }

      console.log('Sending update request for team:', formState._id);
      
      const response = await axios.put(
        `http://localhost:8000/api/v1/team/${formState._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000 
        }
      );

      console.log('Update successful:', response.data);

      // Update local state with returned images
      const updatedTeam = response.data.data;
      setApiData(prevData =>
        prevData.map(t => (t._id === updatedTeam._id ? updatedTeam : t))
      );

      setEditModal(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error updating team:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to update team: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:8000/api/v1/team/${id}`);
    setApiData((prevData) => prevData.filter((data) => data._id !== id));
    setCheckedId((prevChecked) => prevChecked.filter((checkedId) => checkedId !== id));
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

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/api/v1/team?page=${page}&limit=${limit}`);
        if (response.data.success) {
          setApiData(response.data.data);
          setTotal(response.data.pagination.total);
          setTotalPages(response.data.pagination.pages);
        } else {
          setError('Failed to fetch teams');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [page, limit]);

  useEffect(() => {
    if (apiData.length > 0) {
      const flattened = apiData.map(team => ({
        id: team._id,
        name: team.name || 'No Name',
        description: team.description || 'No Description',
        images: Array.isArray(team.images) ? team.images : [],
        createdAt: new Date(team.createdAt).toLocaleString(),
        updatedAt: new Date(team.updatedAt).toLocaleString(),
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

  // SELECT ALL functionality
  const handleSelectAll = (isChecked) => {
    setSelectAll(isChecked);
    if (isChecked) {
      const allIds = flattenData.map(row => row.id);
      setCheckedId(allIds);
    } else {
      setCheckedId([]);
    }
  };

  // Update selectAll state when individual checkboxes change
  useEffect(() => {
    if (flattenData.length > 0) {
      setSelectAll(checkedId.length === flattenData.length);
    }
  }, [checkedId, flattenData]);

  const bulkDelete = () => {
    if (checkedId.length === 0) {
      alert('Please select at least one team to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${checkedId.length} team(s)?`)) {
      try {
        checkedId.forEach((id) => {
          handleDelete(id);
        });
        setCheckedId([]);
        setSelectAll(false);
      } catch (e) {
        console.log(e);
      }
    }
  }

  const modalData = {
    title: 'Team',
    content: 'team.',
    fields: [
      {
        label: 'Name',
        type: 'text',
        name: 'name',
        placeholder: 'Enter Team Name',
        className: 'input-field',
        value: formState.name,
        onChange: (e) => setFormState({ ...formState, name: e.target.value }),
        required: true,
      },
      {
        label: 'Description',
        type: 'text',
        name: 'description',
        placeholder: 'Enter Description',
        value: formState.description,
        onChange: (e) => setFormState({ ...formState, description: e.target.value }),
        required: true,
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

  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <MetaData title={'Teams Management'} />

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
            <h1 className="my-4">Teams Management</h1>

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
                              inputProps={{ 'aria-label': 'select all teams' }}
                            />
                          </TableCell>
                          <TableCell>ID</TableCell>
                          <TableCell align="right">Name</TableCell>
                          <TableCell align="right">Description</TableCell>
                          <TableCell align="right">Created At</TableCell>
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
                                deleteTeam={handleDelete}
                              />
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
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
                    {/* Action Buttons Row */}
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
                        Create New Team
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
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            sx={{
                              height: '36px',
                              '& .MuiSelect-select': {
                                paddingY: '8px',
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
                          Total Teams: {total}
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

      {/* Modals - Moved outside of container to ensure proper rendering */}
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
        />
      </CSSTransition>
    </>
  );
}

function Row(props) {
  const { row, handleCheck, isChecked, loadEditModal, loadInfoModal, deleteTeam } = props;
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
        <TableCell component="th" scope="row" sx={{ minWidth: '400px' }}>
          {row.id}
        </TableCell>
        <TableCell align="right">{row.name}</TableCell>
        <TableCell align="right">{row.description}</TableCell>
        <TableCell align="right">{row.createdAt}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, width: '100%' }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Team Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                {row.images && row.images.length > 0 ? (
                  row.images.map((image, index) => (
                    <Box key={index} sx={{ width: 150, height: 150 }}>
                      <img
                        src={image.url}
                        alt={`Team ${row.name} - Image ${index + 1}`}
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
                  if (window.confirm('Are you sure you want to delete this team?')) {
                    deleteTeam(row.id);
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

export default Team;