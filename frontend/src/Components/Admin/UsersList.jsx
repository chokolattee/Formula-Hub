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
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    Checkbox,
    Collapse,
    Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoMdEye } from "react-icons/io";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { CSSTransition } from "react-transition-group";

// Import Sidebar
import Sidebar from './Layout/SideBar';
import MetaData from '../Layout/MetaData';
import '../../Styles/admin.css';

const Users = () => {
    // Refs for modals
    const createRef = useRef(null);
    const editRef = useRef(null);
    const viewRef = useRef(null);

    // State management
    const [users, setUsers] = useState([]);
    const [flattenData, setFlattenData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [checkedId, setCheckedId] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const [currentUser, setCurrentUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: "user",
        status: "active",
        birthday: "",
        gender: "",
        contact_number: "",
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
        contact_number: "",
    });

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

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

    // Fetch users data with pagination
    useEffect(() => {
        const retrieveUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8000/api/v1/user?page=${page}&limit=${limit}`);

                if (response.data.success) {
                    setUsers(response.data.data);
                    setTotal(response.data.pagination?.total || response.data.data.length);
                    setTotalPages(response.data.pagination?.pages || Math.ceil(response.data.data.length / limit));
                } else {
                    setUsers(response.data.data);
                    setTotal(response.data.data.length);
                    setTotalPages(Math.ceil(response.data.data.length / limit));
                }
            } catch (error) {
                console.error("Error fetching users:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        retrieveUsers();
    }, [page, limit]);

    // Flatten data for table display
    useEffect(() => {
        if (users.length > 0) {
            const flattened = users.map(user => ({
                id: user._id,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                role: user.role || 'user',
                status: user.status || 'active',
                contact_number: user.contact_number || '',
                gender: user.gender || '',
                birthday: user.birthday || '',
                avatar: user.avatar || [],
                createdAt: new Date(user.createdAt).toLocaleString(),
                updatedAt: new Date(user.updatedAt).toLocaleString(),
            }));
            setFlattenData(flattened);
        }
    }, [users]);

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
            contact_number: "",
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
                contact_number: userData.contact_number,
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
                contact_number: userData.contact_number,
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
            setCheckedId(prevChecked => prevChecked.filter(checkedId => checkedId !== id));
            alert("User deleted successfully!");
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(error.response?.data?.message || "Failed to delete user");
        }
    };

    // Handle checkbox
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

    // Bulk delete
    const bulkDelete = () => {
        if (checkedId.length === 0) {
            alert('Please select at least one user to delete');
            return;
        }

        const hasActiveUsers = checkedId.some(id => {
            const user = users.find(u => u._id === id);
            return user && user.status === 'active';
        });

        if (hasActiveUsers) {
            alert('Cannot delete active users. Please deactivate them first.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${checkedId.length} user(s)?`)) {
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
    };

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
                                                            inputProps={{ 'aria-label': 'select all users' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>ID</TableCell>
                                                    <TableCell align="right">First Name</TableCell>
                                                    <TableCell align="right">Last Name</TableCell>
                                                    <TableCell align="right">Email</TableCell>
                                                    <TableCell align="right">Role</TableCell>
                                                    <TableCell align="right">Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {flattenData.length > 0 ? (
                                                    flattenData.map((row) => (
                                                        <Row
                                                            key={row.id}
                                                            row={row}
                                                            handleCheck={handleCheck}
                                                            isChecked={checkedId.includes(row.id)}
                                                            loadEditModal={loadDataByIdEdit}
                                                            loadViewModal={loadDataByIdView}
                                                            deleteUser={handleDelete}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center">
                                                            <Typography>No Data Available</Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
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
                                                    backgroundColor: '#c62828',
                                                    '&:hover': {
                                                        backgroundColor: '#b71c1c',
                                                    }
                                                }}
                                            >
                                                Create New User
                                            </Button>
                                            <Button
                                                variant="contained"
                                                className='invert-button'
                                                onClick={bulkDelete}
                                                disabled={checkedId.length === 0}
                                                sx={{
                                                    backgroundColor: '#212121',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#000000',
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
                                                    Total Users: {total}
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

            {/* Create Modal */}
            <CSSTransition
                in={openModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={createRef}
            >
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
                            <TextField
                                name="contact_number"
                                label="Contact Number"
                                value={formState.contact_number}
                                onChange={(e) => setFormState({ ...formState, contact_number: e.target.value })}
                                fullWidth
                                variant="outlined"
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
            </CSSTransition>

            {/* Edit Modal - ONLY Role and Status */}
            <CSSTransition
                in={editModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={editRef}
            >
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
            </CSSTransition>

            {/* View Modal - Display Only with Avatar */}
            <CSSTransition
                in={viewModal}
                timeout={300}
                classNames="modal"
                unmountOnExit
                nodeRef={viewRef}
            >
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

                            {/* Contact Information Section */}
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
                                    Contact Information
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Box sx={{ gridColumn: 'span 2' }}>
                                        <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                            Email
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                            {currentUser.email || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.9rem', color: '#757575', fontWeight: 600 }}>
                                            Contact Number
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.1rem', color: '#212121', fontWeight: 500, mt: 0.5 }}>
                                            {currentUser.contact_number || 'N/A'}
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
            </CSSTransition>
        </>
    );
};

// Row component with collapsible details
function Row(props) {
    const { row, handleCheck, isChecked, loadEditModal, loadViewModal, deleteUser } = props;
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
                <TableCell align="right">{row.first_name}</TableCell>
                <TableCell align="right">{row.last_name}</TableCell>
                <TableCell align="right">{row.email}</TableCell>
                <TableCell align="right">
                    <Chip
                        label={row.role}
                        size="small"
                        sx={{
                            fontWeight: 600,
                            backgroundColor: row.role === 'admin' ? '#c62828' : '#2e7d32', // red / green
                            color: 'white'
                        }}
                    />
                </TableCell>
                <TableCell align="right">
                    <Chip
                        label={row.status}
                        size="small"
                        sx={{
                            fontWeight: 600,
                            backgroundColor: row.status === 'active' ? '#2e7d32' : '#c62828', // green / red
                            color: 'white'
                        }}
                    />
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0, width: '100%' }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{
                                color: '#c62828',
                                fontWeight: 600
                            }}>
                                User Details
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#e0e0e0' }}>
                                    <strong style={{ color: '#ffffff' }}>Contact Number:</strong> {row.contact_number || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#e0e0e0' }}>
                                    <strong style={{ color: '#ffffff' }}>Gender:</strong> {row.gender || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#e0e0e0' }}>
                                    <strong style={{ color: '#ffffff' }}>Birthday:</strong> {row.birthday || 'N/A'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#e0e0e0' }}>
                                    <strong style={{ color: '#ffffff' }}>Created At:</strong> {row.createdAt}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '1rem', color: '#e0e0e0' }}>
                                    <strong style={{ color: '#ffffff' }}>Updated At:</strong> {row.updatedAt}
                                </Typography>
                            </Box>
                        </Box>
                        <div className="collapsible-table__controls">
                            <Button
                                className='collapsible-control__item delete'
                                variant="contained"
                                disabled={row.status === 'active'}
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                        deleteUser(row.id);
                                    }
                                }}
                                sx={{
                                    backgroundColor: '#212121',
                                    '&:hover': {
                                        backgroundColor: '#000000',
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#9e9e9e',
                                    }
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                className='collapsible-control__item update'
                                variant="contained"
                                onClick={() => loadEditModal(row.id)}
                                sx={{
                                    backgroundColor: '#c62828',
                                    '&:hover': {
                                        backgroundColor: '#b71c1c',
                                    }
                                }}
                            >
                                Update
                            </Button>
                            <Button
                                className='collapsible-control__item info'
                                variant="contained"
                                onClick={() => loadViewModal(row.id)}
                                sx={{
                                    backgroundColor: '#424242',
                                    '&:hover': {
                                        backgroundColor: '#212121',
                                    }
                                }}
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

export default Users;