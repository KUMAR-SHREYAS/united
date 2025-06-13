import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, CircularProgress, Alert, Avatar, Stack, Tabs, Tab
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '../auth/AuthContext';

const UserManagementPage = () => {
  const { getToken, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch users.');
      }

      let data = await response.json();

      if (selectedTab !== 'all') {
        data = data.filter(user => user.status === selectedTab);
      }

      setUsers(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    } else if (user) {
      setError('You do not have administrative privileges to view this page.');
      setLoading(false);
    }
  }, [user, selectedTab]);

  const handleAction = async (userId, actionType) => {
    setSuccess(null);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      let url = `http://localhost:8000/users/${userId}`;
      let method = 'DELETE';

      if (actionType === 'approve') {
        url = `http://localhost:8000/users/approve/${userId}`;
        method = 'PUT';
      } else if (actionType === 'reject') {
        url = `http://localhost:8000/users/reject/${userId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${actionType} user.`);
      }

      setSuccess(`User ${userId} ${actionType}d successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || `An unexpected error occurred during ${actionType} action.`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading users...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Access Denied: You must be an administrator to view this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AdminPanelSettingsIcon sx={{ mr: 1 }} /> User Management
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(event, newValue) => setSelectedTab(newValue)} aria-label="user status tabs">
          <Tab label="All Users" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="user management table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((row) => (
              <TableRow
                key={row.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">{row.id}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {row.status === 'pending' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleOutlineIcon />}
                          onClick={() => handleAction(row.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          startIcon={<HighlightOffIcon />}
                          onClick={() => handleAction(row.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => handleAction(row.id, 'delete')}
                      disabled={user && user.id === row.id}
                    >
                      Delete
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagementPage; 