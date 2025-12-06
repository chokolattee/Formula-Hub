import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Chip,
    Typography,
    Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoMdEye } from "react-icons/io";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { CSSTransition } from "react-transition-group";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// PrimeReact Components
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import '../../Styles/admin.css';

const Users = () => {
    // Refs for modals and DataTable
    const createRef = useRef(null);
    const editRef = useRef(null);
    const viewRef = useRef(null);
    const dt = useRef(null);

    // State management
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [currentUser, setCurrentUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: "user",
        status: "active",
        birthday: "",
        gender: "",
        avatar: [],
        createdAt: "",
        updatedAt: "",
    });

    const [formState, setFormState] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "user",
        status: "active",
        birthday: "",
        gender: "",
    });

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // DataTable State
    const [globalFilter, setGlobalFilter] = useState('');
    const [expandedRows, setExpandedRows] = useState(null);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    // Filters
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

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

    // Fetch users data
    useEffect(() => {
        const retrieveUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8000/api/v1/user`);

                if (response.data.success) {
                    setUsers(response.data.data);
                } else {
                    setUsers(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        retrieveUsers();
    }, []);

    // Filter users by role and status
    const getFilteredUsers = () => {
        let filtered = [...users];
        
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }
        
        return filtered;
    };

    const filteredUsers = getFilteredUsers();

    // Export to CSV
    const exportToCSV = () => {
        const csvData = filteredUsers.map(user => ({
            'User ID': user._id,
            'First Name': user.first_name || '',
            'Last Name': user.last_name || '',
            'Email': user.email || '',
            'Role': user.role,
            'Status': user.status,
            'Gender': user.gender || 'N/A',
            'Created': new Date(user.createdAt).toLocaleDateString()
        }));

        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        alert('Users exported to CSV');
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
    doc.text('USERS REPORT', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 26, { align: 'center' });
    doc.text(`Total Users: ${filteredUsers.length}`, 105, 32, { align: 'center' });

    // Summary section
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('USER SUMMARY', 14, 50);

    const adminCount = filteredUsers.filter(u => u.role === 'admin').length;
    const userCount = filteredUsers.filter(u => u.role === 'user').length;
    const activeCount = filteredUsers.filter(u => u.status === 'active').length;
    const deactivatedCount = filteredUsers.filter(u => u.status === 'deactivated').length;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Admins: ${adminCount} | Users: ${userCount}`, 14, 58);
    doc.text(`Active: ${activeCount} | Deactivated: ${deactivatedCount}`, 14, 64);

    // Table data
    const tableData = filteredUsers.map(user => [
        user._id.substring(0, 10) + '...',
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
        user.email || 'N/A',
        user.role,
        user.status,
        new Date(user.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
        head: [['User ID', 'Name', 'Email', 'Role', 'Status', 'Created']],
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
            0: { cellWidth: 30, fontStyle: 'bold', fontSize: 8 },
            1: { cellWidth: 40 },
            2: { cellWidth: 50 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'center' }
        },
        didParseCell: function (data) {
            // Color code role cells
            if (data.column.index === 3 && data.section === 'body') {
                const role = data.cell.raw;
                if (role === 'admin') {
                    data.cell.styles.textColor = [220, 0, 0]; // Red
                    data.cell.styles.fontStyle = 'bold';
                } else {
                    data.cell.styles.textColor = [33, 150, 243]; // Blue
                }
            }
            // Color code status cells
            if (data.column.index === 4 && data.section === 'body') {
                const status = data.cell.raw;
                if (status === 'active') {
                    data.cell.styles.textColor = [76, 175, 80]; // Green
                    data.cell.styles.fontStyle = 'bold';
                } else {
                    data.cell.styles.textColor = [158, 158, 158]; // Gray
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
            `Page ${i} of ${pageCount} | FormulaHub Users Report`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`formulahub_users_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('Users exported to PDF');
};

    // Reset form state
    const resetFormState = () => {
        setFormState({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            role: "user",
            status: "active",
            birthday: "",
            gender: "",
        });
    };

    // Open Create User Modal
    const loadModalCreate = () => {
        resetFormState();
        setOpenModal(true);
    };

    // Load user data by ID for editing (ONLY role and status)
    const loadDataByIdEdit = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/user/${id}`);
            const userData = response.data.data;

            setFormState({
                _id: id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                gender: userData.gender,
                birthday: userData.birthday,
            });
            setEditModal(true);
        } catch (error) {
            console.error("Error loading user data:", error);
            alert("Failed to load user data");
        }
    };

    // Load user data for viewing (with avatar)
    const loadDataByIdView = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/v1/user/${id}`);
            const userData = response.data.data;

            setCurrentUser({
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                birthday: userData.birthday,
                gender: userData.gender,
                avatar: userData.avatar || [],
                createdAt: new Date(userData.createdAt).toLocaleString(),
                updatedAt: new Date(userData.updatedAt).toLocaleString(),
            });
            setViewModal(true);
        } catch (error) {
            console.error("Error loading user data:", error);
            alert("Failed to load user data");
        }
    };

    // Handle Create User Submit
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post("http://localhost:8000/api/v1/user", formState);

            setUsers(prevUsers => [...prevUsers, response.data.data]);
            setOpenModal(false);
            resetFormState();
            alert("User created successfully!");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Error creating user:", error);
            alert(error.response?.data?.message || "Failed to create user");
        }
    };

    // Handle Edit User Submit (ONLY role and status)
    const handleUpdate = async () => {
        try {
            // Only send role and status for update
            const updateData = {
                role: formState.role,
                status: formState.status,
            };

            const response = await axios.put(
                `http://localhost:8000/api/v1/user/${formState._id}`,
                updateData
            );

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === formState._id ? response.data.data : user
                )
            );
            setEditModal(false);
            alert("User updated successfully!");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Error updating user:", error);
            alert(error.response?.data?.message || "Failed to update user");
        }
    };

    // Handle Delete User
    const handleDelete = async (id) => {
        const userToDelete = users.find(user => user._id === id);

        if (userToDelete.status !== 'deactivated') {
            alert("Cannot delete an active user. Please deactivate the user first.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8000/api/v1/user/${id}`);
            setUsers(users.filter(user => user._id !== id));
            setSelectedUsers(prev => prev.filter(user => user._id !== id));
            alert("User deleted successfully!");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(error.response?.data?.message || "Failed to delete user");
        }
    };

    // Bulk delete
    const bulkDelete = () => {
        if (selectedUsers.length === 0) {
            alert('Please select at least one user to delete');
            return;
        }

        const hasActiveUsers = selectedUsers.some(user => user.status === 'active');

        if (hasActiveUsers) {
            alert('Cannot delete active users. Please deactivate them first.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
            try {
                selectedUsers.forEach((user) => {
                    handleDelete(user._id);
                });
                setSelectedUsers([]);
            } catch (e) {
                console.log(e);
            }
        }
    };

    // PrimeReact Templates
    const rowExpansionTemplate = (data) => {
        return (
            <div style={{ padding: '1rem', backgroundColor: '#2a2a2a' }}>
                <Typography variant="h6" gutterBottom style={{ marginBottom: '1rem', color: '#fff' }}>
                    User Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Personal Information
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        Gender: {data.gender || 'N/A'}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        Birthday: {data.birthday ? new Date(data.birthday).toLocaleDateString() : 'N/A'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" style={{ color: '#fff', marginBottom: '0.5rem' }}>
                        Account Information
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        Created: {new Date(data.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ddd' }}>
                        Updated: {new Date(data.updatedAt).toLocaleString()}
                    </Typography>
                </Box>

                <div className="collapsible-table__controls">
                    <Button
                        className='collapsible-control__item info'
                        variant="contained"
                        onClick={() => loadDataByIdView(data._id)}
                        startIcon={<IoMdEye />}
                    >
                        View Details
                    </Button>
                    <Button
                        className='collapsible-control__item update'
                        variant="contained"
                        onClick={() => loadDataByIdEdit(data._id)}
                        startIcon={<EditIcon />}
                    >
                        Edit
                    </Button>
                    <Button
                        className='collapsible-control__item delete'
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                                handleDelete(data._id);
                            }
                        }}
                        disabled={data.status === 'active'}
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

    const roleBodyTemplate = (rowData) => {
        return (
            <Chip
                label={rowData.role}
                size="small"
                sx={{
                    fontWeight: 600,
                    backgroundColor: rowData.role === 'admin' ? '#c62828' : '#2e7d32',
                    color: 'white'
                }}
            />
        );
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <Chip
                label={rowData.status}
                size="small"
                sx={{
                    fontWeight: 600,
                    backgroundColor: rowData.status === 'active' ? '#2e7d32' : '#c62828',
                    color: 'white'
                }}
            />
        );
    };

    // Calculate pagination values
    const totalRecords = filteredUsers.length;
    const currentPage = Math.floor(first / rows) + 1;
    const totalPages = Math.ceil(totalRecords / rows);

    // Paginated data for display
    const paginatedData = filteredUsers.slice(first, first + rows);

    if (loading) return <div>Loading users...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <MetaData title={'Users Management'} />

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
                        <h1 className="my-4">Users Management</h1>

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
                                        placeholder="Search by Name, Email or ID..."
                                        value={globalFilter}
                                        onChange={(e) => setGlobalFilter(e.target.value)}
                                        sx={{ minWidth: 300, flexGrow: 1 }}
                                        InputProps={{
                                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                        }}
                                    />
                                    
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <InputLabel>Role Filter</InputLabel>
                                        <Select
                                            value={roleFilter}
                                            label="Role Filter"
                                            onChange={(e) => {
                                                setRoleFilter(e.target.value);
                                                setFirst(0);
                                            }}
                                        >
                                            <MenuItem value="all">All Roles</MenuItem>
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ minWidth: 150 }}>
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
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="deactivated">Deactivated</MenuItem>
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
                                        selection={selectedUsers}
                                        onSelectionChange={(e) => setSelectedUsers(e.value)}
                                        dataKey="_id"
                                        paginator={false}
                                        globalFilter={globalFilter}
                                        responsiveLayout="scroll"
                                        expandedRows={expandedRows}
                                        onRowToggle={(e) => setExpandedRows(e.data)}
                                        rowExpansionTemplate={rowExpansionTemplate}
                                        emptyMessage="No users found"
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
                                            header="User ID" 
                                            body={idBodyTemplate} 
                                            sortable 
                                            style={{ minWidth: '250px' }} 
                                        />
                                        <Column 
                                            field="first_name" 
                                            header="First Name" 
                                            sortable
                                            style={{ minWidth: '150px' }}
                                        />
                                        <Column 
                                            field="last_name" 
                                            header="Last Name" 
                                            sortable
                                            style={{ minWidth: '150px' }}
                                        />
                                        <Column 
                                            field="email" 
                                            header="Email" 
                                            sortable
                                            style={{ minWidth: '200px' }}
                                        />
                                        <Column 
                                            field="role" 
                                            header="Role" 
                                            body={roleBodyTemplate} 
                                            sortable
                                            style={{ minWidth: '120px' }}
                                        />
                                        <Column 
                                            field="status" 
                                            header="Status" 
                                            body={statusBodyTemplate} 
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
                                                className='MuiButton-custom___btn'
                                                variant="contained"
                                                onClick={loadModalCreate}
                                            >
                                                Create New User
                                            </Button>
                                            <Button
                                                variant="contained"
                                                className='invert-button'
                                                onClick={bulkDelete}
                                                disabled={selectedUsers.length === 0}
                                                startIcon={<DeleteIcon />}
                                            >
                                                Bulk Delete {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
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
                                                    Total Users: {totalRecords}
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

            {/* Create Modal */}
            <CSSTransition
                in={openModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={createRef}
            >
                <div style={{ position: 'fixed', zIndex: 9999 }}>
                    <Dialog
                        ref={createRef}
                        open={openModal}
                        onClose={() => setOpenModal(false)}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{
                            sx: {
                                '& .MuiDialogTitle-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 600,
                                    color: '#212121',
                                    backgroundColor: '#f5f5f5',
                                    borderBottom: '3px solid #c62828',
                                },
                                '& .MuiInputLabel-root': {
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: '#000000 !important',
                                    '&.Mui-focused': {
                                        color: '#c62828 !important',
                                    }
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '1.1rem',
                                    color: '#000000 !important',
                                    fontWeight: 600,
                                },
                                '& .MuiSelect-select': {
                                    color: '#000000 !important',
                                    fontSize: '1.1rem !important',
                                    fontWeight: '600 !important',
                                },
                                '& .MuiMenuItem-root': {
                                    fontSize: '1.05rem',
                                    color: '#000000',
                                },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#bdbdbd',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#c62828',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#c62828',
                                    },
                                },
                            }
                        }}
                    >
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 2 }}>
                                <TextField
                                    name="first_name"
                                    label="First Name"
                                    value={formState.first_name}
                                    onChange={(e) => setFormState({ ...formState, first_name: e.target.value })}
                                    fullWidth
                                    variant="outlined"
                                />
                                <TextField
                                    name="last_name"
                                    label="Last Name"
                                    value={formState.last_name}
                                    onChange={(e) => setFormState({ ...formState, last_name: e.target.value })}
                                    fullWidth
                                    variant="outlined"
                                />
                                <TextField
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={formState.email}
                                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                    fullWidth
                                    variant="outlined"
                                    required
                                />
                                <TextField
                                    name="password"
                                    label="Password"
                                    type="password"
                                    value={formState.password}
                                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                                    fullWidth
                                    variant="outlined"
                                    required
                                />
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        name="gender"
                                        value={formState.gender}
                                        onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                                        label="Gender"
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        value={formState.role}
                                        onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                        label="Role"
                                    >
                                        <MenuItem value="user">User</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={formState.status}
                                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                                        label="Status"
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="deactivated">Deactivated</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ padding: '16px 24px' }}>
                            <Button
                                onClick={() => setOpenModal(false)}
                                sx={{
                                    fontSize: '1rem',
                                    color: '#424242',
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5',
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                sx={{
                                    fontSize: '1rem',
                                    backgroundColor: '#c62828',
                                    '&:hover': {
                                        backgroundColor: '#b71c1c',
                                    }
                                }}
                            >
                                Create User
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </CSSTransition>

            {/* Edit Modal - ONLY Role and Status */}
            <CSSTransition
                in={editModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={editRef}
            >
                <div style={{ position: 'fixed', zIndex: 9999 }}>
                    <Dialog
                        ref={editRef}
                        open={editModal}
                        onClose={() => setEditModal(false)}
                        fullWidth
                        maxWidth="sm"
                        PaperProps={{
                            sx: {
                                '& .MuiDialogTitle-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 600,
                                    color: '#212121',
                                    backgroundColor: '#f5f5f5',
                                    borderBottom: '3px solid #c62828',
                                },
                                '& .MuiInputLabel-root': {
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    color: '#424242',
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '1.1rem',
                                    color: '#212121',
                                },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#bdbdbd',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#c62828',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#c62828',
                                    },
                                },
                            }
                        }}
                    >
                        <DialogTitle>Edit User - Role & Status</DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={2.5} sx={{ mt: 2 }}>
                                {/* Display user info (read-only) */}
                                <Box sx={{
                                    backgroundColor: '#fafafa',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="subtitle2" sx={{
                                        color: '#c62828',
                                        fontWeight: 600,
                                        mb: 1.5,
                                        fontSize: '1rem'
                                    }}>
                                        User Information (Read-Only)
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Typography sx={{ fontSize: '1rem', color: '#212121' }}>
                                            <strong style={{ color: '#000000' }}>Name:</strong> {formState.first_name} {formState.last_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1rem', color: '#212121' }}>
                                            <strong style={{ color: '#000000' }}>Email:</strong> {formState.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Divider */}
                                <Box sx={{
                                    borderBottom: '2px solid #c62828',
                                    pb: 1,
                                    mb: 1
                                }}>
                                    <Typography variant="h6" sx={{
                                        color: '#c62828',
                                        fontWeight: 600,
                                        fontSize: '1.25rem'
                                    }}>
                                        Editable Fields
                                    </Typography>
                                </Box>

                                {/* Editable fields */}
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel sx={{
                                        color: '#000000 !important',
                                        fontWeight: '600 !important',
                                        fontSize: '1.1rem !important'
                                    }}>
                                        Role
                                    </InputLabel>
                                    <Select
                                        name="role"
                                        value={formState.role}
                                        onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                                        label="Role"
                                        sx={{
                                            '& .MuiSelect-select': {
                                                color: '#000000 !important',
                                                fontWeight: '600 !important',
                                                fontSize: '1.1rem !important'
                                            }
                                        }}
                                    >
                                        <MenuItem value="user" sx={{ color: '#000000', fontSize: '1.05rem' }}>User</MenuItem>
                                        <MenuItem value="admin" sx={{ color: '#000000', fontSize: '1.05rem' }}>Admin</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel sx={{
                                        color: '#000000 !important',
                                        fontWeight: '600 !important',
                                        fontSize: '1.1rem !important'
                                    }}>
                                        Status
                                    </InputLabel>
                                    <Select
                                        name="status"
                                        value={formState.status}
                                        onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                                        label="Status"
                                        sx={{
                                            '& .MuiSelect-select': {
                                                color: '#000000 !important',
                                                fontWeight: '600 !important',
                                                fontSize: '1.1rem !important'
                                            }
                                        }}
                                    >
                                        <MenuItem value="active" sx={{ color: '#000000', fontSize: '1.05rem' }}>Active</MenuItem>
                                        <MenuItem value="deactivated" sx={{ color: '#000000', fontSize: '1.05rem' }}>Deactivated</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ padding: '16px 24px' }}>
                            <Button
                                onClick={() => setEditModal(false)}
                                sx={{
                                    fontSize: '1rem',
                                    color: '#424242',
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5',
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleUpdate}
                                sx={{
                                    fontSize: '1rem',
                                    backgroundColor: '#c62828',
                                    '&:hover': {
                                        backgroundColor: '#b71c1c',
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </CSSTransition>

            {/* View Modal - Display Only with Avatar */}
            <CSSTransition
                in={viewModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={viewRef}
            >
                <div style={{ position: 'fixed', zIndex: 9999 }}>
                    <Dialog
                        ref={viewRef}
                        open={viewModal}
                        onClose={() => setViewModal(false)}
                        fullWidth
                        maxWidth="md"
                        PaperProps={{
                            sx: {
                                '& .MuiDialogTitle-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 600,
                                    color: '#212121',
                                    backgroundColor: '#f5f5f5',
                                    borderBottom: '3px solid #c62828',
                                },
                                '& .MuiInputLabel-root': {
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    color: '#424242',
                                },
                                '& .MuiInputBase-input': {
                                    fontSize: '1.05rem',
                                    color: '#212121',
                                    fontWeight: 500,
                                },
                            }
                        }}
                    >
                        <DialogTitle>User Details</DialogTitle>
                        <DialogContent>
                            <Box display="flex" flexDirection="column" gap={2.5} sx={{ mt: 2 }}>
                                {/* User Avatar */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    mb: 2,
                                    padding: '20px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '12px',
                                    border: '2px solid #e0e0e0'
                                }}>
                                    {currentUser.avatar && currentUser.avatar.length > 0 ? (
                                        <Avatar
                                            src={currentUser.avatar[0].url}
                                            alt={`${currentUser.first_name} ${currentUser.last_name}`}
                                            sx={{
                                                width: 140,
                                                height: 140,
                                                border: '4px solid #c62828',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 140,
                                                height: 140,
                                                fontSize: '3.5rem',
                                                backgroundColor: '#c62828',
                                                color: 'white',
                                                fontWeight: 600,
                                                border: '4px solid #212121',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {currentUser.first_name?.charAt(0)}{currentUser.last_name?.charAt(0)}
                                        </Avatar>
                                    )}
                                </Box>

                                {/* Personal Information Section */}
                                <Box sx={{
                                    backgroundColor: '#fafafa',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="h6" sx={{
                                        color: '#c62828',
                                        fontWeight: 600,
                                        mb: 2,
                                        fontSize: '1.25rem',
                                        borderBottom: '2px solid #c62828',
                                        paddingBottom: '8px'
                                    }}>
                                        Personal Information
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                First Name
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.first_name || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Last Name
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.last_name || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Gender
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.gender || 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Birthday
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.birthday ? new Date(currentUser.birthday).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Account Information Section */}
                                <Box sx={{
                                    backgroundColor: '#fafafa',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="h6" sx={{
                                        color: '#c62828',
                                        fontWeight: 600,
                                        mb: 2,
                                        fontSize: '1.25rem',
                                        borderBottom: '2px solid #c62828',
                                        paddingBottom: '8px'
                                    }}>
                                        Account Information
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Role
                                            </Typography>
                                            <Chip
                                                label={currentUser.role?.toUpperCase()}
                                                sx={{
                                                    mt: 0.5,
                                                    backgroundColor: currentUser.role === 'admin' ? '#c62828' : '#212121',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '1rem',
                                                    height: '32px'
                                                }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Status
                                            </Typography>
                                            <Chip
                                                label={currentUser.status?.toUpperCase()}
                                                sx={{
                                                    mt: 0.5,
                                                    backgroundColor: currentUser.status === 'active' ? '#2e7d32' : '#757575',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '1rem',
                                                    height: '32px'
                                                }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Created At
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.05rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.createdAt}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                                Updated At
                                            </Typography>
                                            <Typography sx={{ fontSize: '1.05rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                                {currentUser.updatedAt}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ padding: '16px 24px' }}>
                            <Button
                                onClick={() => setViewModal(false)}
                                variant="contained"
                                sx={{
                                    fontSize: '1rem',
                                    backgroundColor: '#c62828',
                                    '&:hover': {
                                        backgroundColor: '#b71c1c',
                                    }
                                }}
                            >
                                Close
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </CSSTransition>
        </>
    );
};

export default Users;