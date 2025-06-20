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
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../auth/AuthContext';
import api from '../utils/api';
import printImage from './print.jpg'; // Import the print image

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isApproved } = useAuth();

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [errorRecords, setErrorRecords] = useState(null);
  const [pageRecords, setPageRecords] = useState(1);
  const [pageSizeRecords, setPageSizeRecords] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // State for print image dialog
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [printImageUrl, setPrintImageUrl] = useState('');

  // State for filename preview dialog
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'pending',
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

  // Handler for print button click
  const handlePrintClick = (record) => {
    setPrintImageUrl(printImage);
    setOpenPrintDialog(true);
  };

  const handleClosePrintDialog = () => {
    setOpenPrintDialog(false);
    setPrintImageUrl('');
  };

  // Handler for filename click to show actual uploaded image preview
  const handleFilenameClick = (record) => {
    // Construct the image URL based on the record
    // Option 1: If your backend serves images from /uploads/ endpoint
    const imageUrl = `/api/uploads/${record.filename}`;
    
    // Option 2: If your backend has a specific endpoint for images by record ID
    // const imageUrl = `/api/images/${record.id}`;
    
    // Option 3: If the record already contains an image_url field
    // const imageUrl = record.image_url;
    
    // Option 4: If images are served from a static folder
    // const imageUrl = `/uploads/${record.filename}`;

    setPreviewImageUrl(imageUrl);
    setPreviewFilename(record.filename);
    setOpenPreviewDialog(true);
  };

  const handleClosePreviewDialog = () => {
    setOpenPreviewDialog(false);
    setPreviewImageUrl('');
    setPreviewFilename('');
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
      fetchUsers();
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
              label="Search"
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
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Filename</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Upload Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Upload Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Extract Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Is Shipping Label</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tracking Number</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Origin Address</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Address(full)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Address(main)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee City</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Number</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Pincode</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Consignee Country</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Raw Extracted Info</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Print Barcode</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingRecords ? (
                        <TableRow><TableCell colSpan={18} align="center"><CircularProgress /></TableCell></TableRow>
                      ) : filteredRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={18} align="center">No records found.</TableCell></TableRow>
                      ) : (
                        filteredRecords.map((record) => {
                          const originAddress = record.origin_address_json || {};
                          const destinationAddress = record.destination_address_json || {};

                          const formatAddress = (address) => {
                            if (!address) return 'N/A';
                            const parts = [
                              address.name,
                              address.street_address,
                              address.city,
                              address.state,
                              address.zipcode,
                              address.country
                            ].filter(Boolean);
                            return parts.join(', ');
                          };

                          return (
                            <TableRow key={record.id}>
                              <TableCell>
                                <Button
                                  variant="text"
                                  color="primary"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleFilenameClick(record)}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    minWidth: 'auto',
                                    padding: '4px 8px'
                                  }}
                                >
                                  {highlightMatch(record.filename)}
                                </Button>
                              </TableCell>
                              <TableCell>{highlightMatch(new Date(record.upload_timestamp).toLocaleDateString())}</TableCell>
                              <TableCell>{highlightMatch(record.upload_status)}</TableCell>
                              <TableCell>{highlightMatch(record.extract_status)}</TableCell>
                              <TableCell>{highlightMatch(record.document_type || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.is_shipping_label ? 'Yes' : 'No')}</TableCell>
                              <TableCell>{highlightMatch(record.tracking_number || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.message || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(formatAddress(originAddress))}</TableCell>
                              <TableCell>{highlightMatch(formatAddress(destinationAddress))}</TableCell>
                              <TableCell>{highlightMatch(record.address || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.name || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.city || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.number || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.pincode || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.country || 'N/A')}</TableCell>
                              <TableCell>{highlightMatch(record.extracted_info ? 'Available' : 'N/A')}</TableCell>
                              <TableCell>
                                <Button
                                  variant="text"
                                  color="primary"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handlePrintClick(record)}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    minWidth: 'auto',
                                    padding: '4px 8px'
                                  }}
                                >
                                  Print
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {((pageRecords - 1) * pageSizeRecords) + 1} to {Math.min(pageRecords * pageSizeRecords, totalRecords)} of {totalRecords} records
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      onClick={() => setPageRecords(Math.max(1, pageRecords - 1))}
                      disabled={pageRecords === 1}
                      size="small"
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    {renderPageButtons()}
                    <IconButton
                      onClick={() => setPageRecords(Math.min(totalPagesRecords, pageRecords + 1))}
                      disabled={pageRecords === totalPagesRecords}
                      size="small"
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </>
      )}

      {/* Print Image Dialog */}
      <Dialog
        open={openPrintDialog}
        onClose={handleClosePrintDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Print Information
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {printImageUrl ? (
              <img
                src={printImageUrl}
                alt="Print Information"
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ display: 'none', mt: 2 }}
            >
              Image could not be loaded. Please check the image path.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrintDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filename Preview Dialog - Shows Actual Uploaded Image */}
      <Dialog
        open={openPreviewDialog}
        onClose={handleClosePreviewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview: {previewFilename}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={`Preview of ${previewFilename}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ display: 'none', mt: 2 }}
            >
              Image could not be loaded. Please check if the image exists on the server.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreviewDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rest of the component remains the same - User Management section, etc. */}
      {location.pathname === '/dashboard/users' && isAdmin && (
        <Paper elevation={3} sx={{ mt: 2, p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              User Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenAddUserDialog(true)}
            >
              Add User
            </Button>
          </Box>

          {loadingUsers && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Loading users...</Typography>
            </Box>
          )}

          {errorUsers && (
            <Alert severity="error" sx={{ my: 4 }}>
              {errorUsers}
            </Alert>
          )}

          {!loadingUsers && users.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
              No users found.
            </Typography>
          )}

          {!loadingUsers && users.length > 0 && (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: user.status === 'approved' ? 'green' : user.status === 'rejected' ? 'red' : 'orange',
                            fontWeight: 'bold'
                          }}
                        >
                          {user.status}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {user.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenConfirmDialog(user, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => handleOpenConfirmDialog(user, 'reject')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleOpenConfirmDialog(user, 'delete')}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to {actionType} user "{selectedUser?.username}"?
            {actionType === 'delete' && ' This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>
            {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={openAddUserDialog}
        onClose={() => setOpenAddUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newUser.status}
                  label="Status"
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddUserDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddUser} color="primary" variant="contained">
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;

