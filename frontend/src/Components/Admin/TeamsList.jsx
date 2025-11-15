import React, { useState, useEffect, useRef } from 'react';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser, isAdmin } from '../Utils/helpers';

// Validation Schemas
import { teamSchema, teamEditSchema } from '../Utils/validationSchema';

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

import { IconButton, Typography, TextField } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import '../../Styles/admin.css'

const Team = () => {
  const navigate = useNavigate();
  const createRef = useRef(null);
  const editRef = useRef(null);
  const infoRef = useRef(null);

  // User and Auth
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

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

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
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

  // Handle Submit for CREATE
  const handleSubmit = async (validatedData) => {
    if (!token) {
      alert('Please log in to create teams');
      navigate('/login');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', validatedData.name);
      formData.append('description', validatedData.description);

      if (validatedData.images && validatedData.images.length > 0) {
        Array.from(validatedData.images).forEach((file) => {
          formData.append('images', file);
        });
      }

      const response = await axios.post(
        'http://localhost:8000/api/v1/team', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000,
        }
      );

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
      alert('Team created successfully!');

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error creating team:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        alert('Failed to create team: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Handle Update for EDIT
  const handleUpdate = async (validatedData) => {
    if (!token) {
      alert('Please log in to update teams');
      navigate('/login');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', validatedData.name);
      formData.append('description', validatedData.description);

      if (validatedData.images && validatedData.images.length > 0) {
        Array.from(validatedData.images).forEach(file => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else {
        if (formState.existingImages && formState.existingImages.length > 0) {
          formData.append('existingImages', JSON.stringify(formState.existingImages));
        }
      }

      const response = await axios.put(
        `http://localhost:8000/api/v1/team/${formState._id}`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000 
        }
      );

      const updatedTeam = response.data.data;
      setApiData(prevData =>
        prevData.map(t => (t._id === updatedTeam._id ? updatedTeam : t))
      );

      setEditModal(false);
      alert('Team updated successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error updating team:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        alert('Failed to update team: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      alert('Please log in to delete teams');
      navigate('/login');
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/team/${id}`,
        getAxiosConfig()
      );
      setApiData((prevData) => prevData.filter((data) => data._id !== id));
      setCheckedId((prevChecked) => prevChecked.filter((checkedId) => checkedId !== id));
      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Error deleting team:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Unauthorized. Please log in as admin.');
        navigate('/login');
      } else {
        alert('Failed to delete team: ' + (error.response?.data?.message || error.message));
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

  useEffect(() => {
    if (!token) return;

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
  }, [page, limit, token]);

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
      setFilteredData(flattened);
    }
  }, [apiData]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = flattenData.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(flattenData);
    }
  }, [searchTerm, flattenData]);

  const exportToCSV = () => {
    const csvData = filteredData.map(team => ({
      'Team ID': team.id,
      'Name': team.name,
      'Description': team.description,
      'Created': team.createdAt,
      'Updated': team.updatedAt
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teams_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert('Teams exported to CSV');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Teams Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Teams: ${filteredData.length}`, 14, 36);
    
    const tableData = filteredData.map(team => [
      team.id.substring(0, 8) + '...',
      team.name,
      team.description.substring(0, 40) + '...',
      new Date(team.createdAt).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      head: [['Team ID', 'Name', 'Description', 'Created']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [198, 40, 40] }
    });
    
    doc.save(`teams_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('Teams exported to PDF');
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
      alert('Please select at least one team to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${checkedId.length} team(s)?`)) {
      try {
        for (const id of checkedId) {
          await handleDelete(id);
        }
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
        required: true,
      },
      {
        label: 'Description',
        type: 'textarea',
        name: 'description',
        placeholder: 'Enter Description',
        value: formState.description,
        required: true,
      },
      {
        label: 'Images',
        type: 'file',
        name: 'images',
        id: 'custom_file',
        required: false,
        multiple: true,
      },
    ]
  };

  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Checking authentication...</div>;

  return (
    <>
      <MetaData title={'Teams Management'} />

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
            <h1 className="my-4">Teams Management</h1>

            <div className="main-container__admin">
              <div className="container sub-container__single-lg">
                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', padding: '20px 20px 0 20px' }}>
                  <TextField
                    size="small"
                    placeholder="Search by Name, Description or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 300, flexGrow: 1 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                  
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
                        {filteredData ? (
                          filteredData.length > 0 ? (
                            filteredData.map((row) => (
                              <Row
                                key={row.id}
                                row={row}
                                handleCheck={handleCheck}
                                isChecked={checkedId.includes(row.id)}
                                loadEditModal={loadDataByIdEdit}
                                loadInfoModal={loadDataByIdInfo}
                                deleteTeam={handleDelete}
                                isAdmin={user?.role === 'admin'}
                              />
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography>No teams found</Typography>
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
          validationSchema={teamSchema}
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
          validationSchema={teamEditSchema}
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
  const { row, handleCheck, isChecked, loadEditModal, loadInfoModal, deleteTeam, isAdmin } = props;
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
          {isAdmin && (
            <Checkbox
              checked={isChecked}
              onChange={(e) => handleCheck(row.id, e.target.checked)}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          )}
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
              {isAdmin && (
                <>
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
                </>
              )}
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