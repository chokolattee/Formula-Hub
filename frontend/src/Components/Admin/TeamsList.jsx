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
import { Button as PrimeButton } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

// Material UI Components (keeping for modals and some UI elements)
import Button from '@mui/material/Button';
import { CSSTransition } from 'react-transition-group';
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Typography, TextField } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Modals
import EditModal from "./Layout/EditModal";
import InfoModal from "./Layout/InfoModal";
import CreateModal from "./Layout/CreateModal";

// Import validation schemas
import { teamSchema, teamEditSchema } from '../Utils/validationSchema';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import '../../Styles/admin.css';

const Team = () => {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [imagesPreview, setImagesPreview] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [formState, setFormState] = useState({
    _id: '',
    name: '',
    description: '',
    images: [],
    existingImages: [] 
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // DataTable State
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

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

  const fileObjects = []; // Store actual File objects
  const newPreviews = [];

  files.forEach(file => {
    fileObjects.push(file); // Store the File object

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
    images: fileObjects, // Store File objects, not base64
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
    const response = await axios.get(`http://localhost:8000/api/v1/team/${id}`, getAxiosConfig());
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
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      alert('Unauthorized. Please log in as admin.');
      navigate('/login');
    } else {
      alert('Failed to load team data');
    }
  }
}

  const loadDataByIdEdit = async (id) => {
    try {
      resetFormstate();
      await loadDataGen(id);
      setEditModal(true);
    } catch (error) {
      console.error('Failed to load team for editing:', error);
    }
  }

  const loadDataByIdInfo = async (id) => {
    try {
      resetFormstate();
      const teamData = await loadDataGen(id);
      
      setFormState(prev => ({
          ...prev,
          images: teamData.images || [], 
          existingImages: []
      }));
      
      setInfoModal(true);
    } catch (error) {
      console.error('Failed to load team info:', error);
    }
  }

  // Handle Submit for CREATE
  const handleSubmit = async (validatedData) => {
  if (!token) {
    alert('Please log in to create teams');
    navigate('/login');
    return;
  }

  try {
    // Convert File objects to base64
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

    const teamData = {
      name: validatedData.name.trim(),
      description: validatedData.description.trim(),
      images: base64Images
    };

    console.log('Sending team data:', teamData);

    const response = await axios.post('http://localhost:8000/api/v1/team/', teamData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000,
    });

    if (response.data.success) {
      alert('Team created successfully!');
      setOpenModal(false);
      resetFormstate();
      // Refresh the team list
      const teamsResponse = await axios.get('http://localhost:8000/api/v1/team');
      if (teamsResponse.data.success) {
        setApiData(teamsResponse.data.data);
      }
    }
  } catch (error) {
    console.error('Error creating team:', error);
    console.error('Error response:', error.response?.data);

    if (error.response?.status === 401 || error.response?.status === 403) {
      alert('Unauthorized. Please log in as admin.');
      navigate('/login');
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create team';
      alert('Failed to create team: ' + errorMessage);
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
    const teamData = {
      name: validatedData.name,
      description: validatedData.description
    };

    // KEY PART: Only process images if NEW files were uploaded
    if (validatedData.images && validatedData.images.length > 0) {
      console.log('New images provided, replacing existing images');
      teamData.images = validatedData.images; // These are already base64 from EditModal
    } else {
      console.log('No new images provided, keeping existing images');
      teamData.images = formState.existingImages; // Keep existing image objects
    }

    console.log('Updating team with data:', teamData);

    const response = await axios.put(
      `http://localhost:8000/api/v1/team/${formState._id}`,
      teamData,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000
      }
    );

    if (response.data.success) {
      alert('Team updated successfully!');
      setEditModal(false);
      resetFormstate();
      // Refresh the team list
      const teamsResponse = await axios.get('http://localhost:8000/api/v1/team');
      if (teamsResponse.data.success) {
        setApiData(teamsResponse.data.data);
      }
    }

  } catch (error) {
    console.error('Error updating team:', error);
    console.error('Error response:', error.response?.data);
    
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
    const response = await axios.delete(
      `http://localhost:8000/api/v1/team/${id}`,
      getAxiosConfig()
    );
    
    if (response.data.success) {
      setApiData((prevData) => prevData.filter((team) => team._id !== id));
      setSelectedTeams((prev) => prev.filter((team) => team._id !== id));
      alert('Team deleted successfully!');
      // Refresh the team list to be sure
      const teamsResponse = await axios.get('http://localhost:8000/api/v1/team');
      if (teamsResponse.data.success) {
        setApiData(teamsResponse.data.data);
      }
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      alert('Unauthorized. Please log in as admin.');
      navigate('/login');
    } else {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete team';
      alert('Failed to delete team: ' + errorMessage);
    }
  }
};


  const bulkDelete = async () => {
    if (selectedTeams.length === 0) {
      alert('Please select at least one team to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedTeams.length} team(s)?`)) {
      try {
        for (const team of selectedTeams) {
          await handleDelete(team._id);
        }
        setSelectedTeams([]);
      } catch (e) {
        console.log(e);
      }
    }
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
    if (!token) return;

    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/api/v1/team`);
        if (response.data.success) {
          setApiData(response.data.data);
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
  }, [token]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = apiData.map(team => ({
      'Team ID': team._id,
      'Name': team.name,
      'Description': team.description,
      'Created': new Date(team.createdAt).toLocaleString(),
      'Updated': new Date(team.updatedAt).toLocaleString()
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

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Teams Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Teams: ${apiData.length}`, 14, 36);
    
    const tableData = apiData.map(team => [
      team._id.substring(0, 8) + '...',
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

  // PrimeReact Templates
  const rowExpansionTemplate = (data) => {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#2a2a2a' }}>
        <Typography variant="h6" gutterBottom component="div" style={{ marginBottom: '1rem', color: '#fff' }}>
          Team Details
        </Typography>

        {/* Images Section */}
        <Typography variant="subtitle2" gutterBottom style={{ color: '#fff' }}>
          Team Images
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          {data.images && data.images.length > 0 ? (
            data.images.map((image, index) => (
              <Box key={index} sx={{ width: 150, height: 150 }}>
                <img
                  src={image.url}
                  alt={`Team ${data.name} - Image ${index + 1}`}
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
                  if (window.confirm('Are you sure you want to delete this team?')) {
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

  const dateBodyTemplate = (rowData) => {
    return new Date(rowData.createdAt).toLocaleString();
  };

  const idBodyTemplate = (rowData) => {
    return <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{rowData._id}</span>;
  };

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
        type: 'textarea',
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

  // Calculate pagination values
  const totalRecords = apiData.length;
  const currentPage = Math.floor(first / rows) + 1;
  const totalPages = Math.ceil(totalRecords / rows);

  // Paginated data for display
  const paginatedData = apiData.slice(first, first + rows);

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
              <div className="sub-container__single-lg">
                {/* Search and Export Header */}
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
                    placeholder="Search by Name, Description or ID..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
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
                    selection={selectedTeams}
                    onSelectionChange={(e) => setSelectedTeams(e.value)}
                    dataKey="_id"
                    paginator={false}
                    globalFilter={globalFilter}
                    responsiveLayout="scroll"
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={rowExpansionTemplate}
                    emptyMessage="No teams found"
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
                    <Column field="description" header="Description" sortable style={{ minWidth: '450px', width: '45%' }} />
                    <Column 
                      field="createdAt" 
                      header="Created At" 
                      body={dateBodyTemplate} 
                      sortable
                      style={{ minWidth: '180px' }}
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
                        className='MuiButton-custom___btn'
                        variant="contained"
                        onClick={loadModalCreate}
                      >
                        Create New Team
                      </Button>
                      <Button
                        variant="contained"
                        className='invert-button'
                        onClick={bulkDelete}
                        disabled={selectedTeams.length === 0}
                      >
                        Bulk Delete {selectedTeams.length > 0 ? `(${selectedTeams.length})` : ''}
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
                          Total Teams: {totalRecords}
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
            validationSchema={teamSchema}
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
            validationSchema={teamEditSchema}
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
          />
        </div>
      </CSSTransition>
    </>
  );
}

export default Team;