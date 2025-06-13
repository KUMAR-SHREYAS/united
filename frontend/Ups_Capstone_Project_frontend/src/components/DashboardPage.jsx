import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableContainer,
  Tabs,
  Tab,
  TextField,
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../auth/AuthContext'; // Import useAuth
import api from '../utils/api'; // Import the custom API axios instance

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isApproved } = useAuth(); // Get user, isAdmin, isApproved from AuthContext

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [errorRecords, setErrorRecords] = useState(null);
  const [pageRecords, setPageRecords] = useState(1);
  const [pageSizeRecords, setPageSizeRecords] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'delete'
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false); // New state for Add User dialog
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user', // Default role
    status: 'pending', // Default status
  });

  const navTabs = [
    { label: 'Upload', path: '/upload' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analytics', path: '/analytics' },
  ];

  if (isAdmin) {
    navTabs.push({ label: 'User Management', path: '/dashboard/users' });
  }

  const [currentTab, setCurrentTab] = useState(location.pathname);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    navigate(newValue);
  };

  const fetchRecords = async () => {
    setLoadingRecords(true);
    setErrorRecords(null);
    try {
      const queryParams = new URLSearchParams({
        page: pageRecords,
        size: pageSizeRecords,
      });

      const response = await api.get(`/upload-records/?${queryParams.toString()}`);
      setRecords(response.data.items);
      setTotalRecords(response.data.total);
    } catch (err) {
      setErrorRecords("Failed to fetch records: " + (err.response?.data?.detail || err.message));
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      setErrorUsers("Failed to fetch users: " + (err.response?.data?.detail || err.message));
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      fetchRecords();
    } else if (location.pathname === '/dashboard/users' && isAdmin) {
      fetchUsers();
    }
  }, [location.pathname, isAdmin, pageRecords, pageSizeRecords]);

  const handlePageChangeRecords = (event, value) => {
    setPageRecords(value);
  };

  const handleOpenConfirmDialog = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setSelectedUser(null);
    setActionType('');
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'approve') {
        await api.put(`/users/approve/${selectedUser.id}`);
      } else if (actionType === 'reject') {
        await api.put(`/users/reject/${selectedUser.id}`);
      } else if (actionType === 'delete') {
        await api.delete(`/users/${selectedUser.id}`);
      }
      fetchUsers(); // Refresh the user list
      handleCloseConfirmDialog();
    } catch (err) {
      setErrorUsers("Action failed: " + (err.response?.data?.detail || err.message));
      handleCloseConfirmDialog();
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await api.post('/users/', newUser);
      setUsers([...users, response.data]);
      setOpenAddUserDialog(false);
    } catch (err) {
      setErrorUsers("Failed to add user: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!isApproved) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="warning">
          Your account is currently {user?.status}. Access to the dashboard is restricted until your account is approved by an administrator.
        </Alert>
      </Container>
    );
  }

  const highlightMatch = (text) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? <mark key={i}>{part}</mark> : part
    );
  };

  const filteredRecords = records.filter(record => {
    const combined = Object.values(record).join(' ').toLowerCase();
    return combined.includes(searchTerm.toLowerCase());
  });

  const totalPagesRecords = Math.ceil(totalRecords / pageSizeRecords);

  const renderPageButtons = () => {
    const pageButtons = [];

    if (totalPagesRecords <= 5) {
      for (let i = 1; i <= totalPagesRecords; i++) {
        pageButtons.push(
          <span
            key={i}
            onClick={() => setPageRecords(i)}
            style={{
              cursor: 'pointer',
              margin: '0 4px',
              textDecoration: pageRecords === i ? 'underline' : 'none',
              fontWeight: pageRecords === i ? 'bold' : 'normal',
              fontSize: '14px'
            }}
          >
            {i}
          </span>
        );
      }
    } else {
      pageButtons.push(
        <span
          key="1"
          onClick={() => setPageRecords(1)}
          style={{
            cursor: 'pointer',
            margin: '0 4px',
            textDecoration: pageRecords === 1 ? 'underline' : 'none',
            fontWeight: pageRecords === 1 ? 'bold' : 'normal',
            fontSize: '14px'
          }}
        >
          1
        </span>
      );

      if (pageRecords > 3) {
        pageButtons.push(<span key="start-ellipsis">...</span>);
      }

      const start = Math.max(2, pageRecords - 1);
      const end = Math.min(totalPagesRecords - 1, pageRecords + 1);

      for (let i = start; i <= end; i++) {
        pageButtons.push(
          <span
            key={i}
            onClick={() => setPageRecords(i)}
            style={{
              cursor: 'pointer',
              margin: '0 4px',
              textDecoration: pageRecords === i ? 'underline' : 'none',
              fontWeight: pageRecords === i ? 'bold' : 'normal',
              fontSize: '14px'
            }}
          >
            {i}
          </span>
        );
      }

      if (pageRecords < totalPagesRecords - 2) {
        pageButtons.push(<span key="end-ellipsis">...</span>);
      }

      pageButtons.push(
        <span
          key={totalPagesRecords}
          onClick={() => setPageRecords(totalPagesRecords)}
          style={{
            cursor: 'pointer',
            margin: '0 4px',
            textDecoration: pageRecords === totalPagesRecords ? 'underline' : 'none',
            fontWeight: pageRecords === totalPagesRecords ? 'bold' : 'normal',
            fontSize: '14px'
          }}
        >
          {totalPagesRecords}
        </span>
      );
    }

    return pageButtons;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '.MuiTabs-indicator': {
              height: '4px',
              borderRadius: '4px 4px 0 0',
            },
          }}
        >
          {navTabs.map((tab) => (
            <Tab
              key={tab.path}
              label={tab.label}
              value={tab.path}
              sx={{ fontWeight: 'bold' }}
            />
          ))}
        </Tabs>
      </Box>

      {location.pathname === '/dashboard' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rows</InputLabel>
              <Select
                value={pageSizeRecords}
                label="Rows"
                onChange={(e) => {
                  setPageSizeRecords(e.target.value);
                  setPageRecords(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Search All"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Paper elevation={3} sx={{ mt: 2, p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Extracted Records History
            </Typography>

            {loadingRecords && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading records...</Typography>
              </Box>
            )}

            {errorRecords && (
              <Alert severity="error" sx={{ my: 4 }}>
                {errorRecords}
              </Alert>
            )}

            {!loadingRecords && !errorRecords && filteredRecords.length === 0 && (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
                No matching records found.
              </Typography>
            )}

            {!loadingRecords && filteredRecords.length > 0 && (
              <>
                <TableContainer component={Paper} elevation={1} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.light', '& th': { color: 'common.white', fontWeight: 'bold' } }}>
                        <TableCell>Uploaded Time</TableCell>
                        <TableCell>Tracking ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>City</TableCell>
                        <TableCell>Pincode</TableCell>
                        <TableCell>Country</TableCell>
                        <TableCell>Upload Status</TableCell>
                        <TableCell>Extract Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>{highlightMatch(new Date(record.upload_timestamp).toLocaleString())}</TableCell>
                          <TableCell>{highlightMatch(record.tracking_id || 'N/A')}</TableCell>
                          <TableCell>{highlightMatch(record.name || 'N/A')}</TableCell>
                          <TableCell>{highlightMatch(record.city || 'N/A')}</TableCell>
                          <TableCell>{highlightMatch(record.pincode || 'N/A')}</TableCell>
                          <TableCell>{highlightMatch(record.country || 'N/A')}</TableCell>
                          <TableCell>{highlightMatch(record.upload_status.charAt(0).toUpperCase() + record.upload_status.slice(1))}</TableCell>
                          <TableCell>{highlightMatch(record.extract_status.charAt(0).toUpperCase() + record.extract_status.slice(1))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 3, flexWrap: 'wrap' }}>
                  <IconButton onClick={() => setPageRecords((prev) => Math.max(prev - 1, 1))} disabled={pageRecords === 1}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>

                  {renderPageButtons()}

                  <IconButton onClick={() => setPageRecords((prev) => Math.min(prev + 1, totalPagesRecords))} disabled={pageRecords === totalPagesRecords}>
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            )}
          </Paper>
        </>
      )}

      {location.pathname === '/dashboard/users' && isAdmin && (
        <Paper elevation={3} sx={{ mt: 2, p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenAddUserDialog(true)}
            sx={{ mb: 3 }}
          >
            Add New User
          </Button>
          {loadingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Loading users...</Typography>
            </Box>
          )}
          {errorUsers && (
            <Alert severity="error" sx={{ mb: 2 }}>{errorUsers}</Alert>
          )}
          {!loadingUsers && !errorUsers && users.length === 0 && (
            <Typography>No users found.</Typography>
          )}
          {!loadingUsers && !errorUsers && users.length > 0 && (
            <TableContainer component={Paper} elevation={1} sx={{ mt: 3 }}>
              <Table aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>
                        {user.status === 'pending' && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => handleOpenConfirmDialog(user, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleOpenConfirmDialog(user, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {user.status !== 'pending' && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleOpenConfirmDialog(user, 'delete')}
                            >
                                Delete
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Dialog
            open={openConfirmDialog}
            onClose={handleCloseConfirmDialog}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <DialogTitle id="confirm-dialog-title">
              {actionType === 'approve' ? 'Approve User' : actionType === 'reject' ? 'Reject User' : 'Delete User'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="confirm-dialog-description">
                Are you sure you want to {actionType} user "{selectedUser?.username}"? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
              <Button onClick={handleConfirmAction} autoFocus color={actionType === 'delete' ? 'error' : 'primary'}>
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Add User Dialog */}
          <Dialog open={openAddUserDialog} onClose={() => setOpenAddUserDialog(false)}>
            <DialogTitle>Add New User</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Username"
                type="text"
                fullWidth
                variant="outlined"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                margin="dense"
                label="Role"
                fullWidth
                variant="outlined"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </TextField>
              <TextField
                select
                margin="dense"
                label="Status"
                fullWidth
                variant="outlined"
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAddUserDialog(false)}>Cancel</Button>
              <Button onClick={handleAddUser} variant="contained" color="primary">Add User</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      )}
    </Container>
  );
};

export default DashboardPage; 