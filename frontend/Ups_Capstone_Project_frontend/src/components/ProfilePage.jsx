import React, { useState } from 'react';
import { Box, Typography, Container, Button, Paper, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import api from '../utils/api'; // Import the custom API axios instance

const ProfilePage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleOpenConfirmDialog = () => {
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = () => {
        setOpenConfirmDialog(false);
    };

    const handleDeleteProfile = async () => {
        try {
            await api.delete('/users/me/');
            alert("Profile deleted successfully.");
            logout();
            navigate('/login');
        } catch (error) {
            console.error("Error deleting profile:", error);
            alert("Failed to delete profile: " + (error.response?.data?.detail || error.message));
        } finally {
            handleCloseConfirmDialog();
        }
    };

    if (!user) {
        // Handle case where user data is not yet loaded or not available
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Loading user profile...
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    User Profile
                </Typography>
                <Box sx={{ mt: 3, mb: 4, textAlign: 'left' }}>
                    <Typography variant="h6" gutterBottom>
                        Username: <Typography component="span" variant="body1" sx={{ fontWeight: 'normal' }}>{user.username}</Typography>
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Email: <Typography component="span" variant="body1" sx={{ fontWeight: 'normal' }}>{user.email}</Typography>
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Role: <Typography component="span" variant="body1" sx={{ fontWeight: 'normal' }}>{user.role}</Typography>
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Status: <Typography component="span" variant="body1" sx={{ fontWeight: 'normal' }}>{user.status}</Typography>
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/dashboard')}
                    sx={{ mr: 2 }}
                >
                    Go to Dashboard
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLogout}
                >
                    Logout
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleOpenConfirmDialog}
                    sx={{ ml: 2 }}
                >
                    Delete Profile
                </Button>
            </Paper>
            <Dialog
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                aria-labelledby="delete-profile-dialog-title"
                aria-describedby="delete-profile-dialog-description"
            >
                <DialogTitle id="delete-profile-dialog-title">
                    Confirm Profile Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-profile-dialog-description">
                        Are you sure you want to delete your profile? This action cannot be undone and you will be logged out.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                    <Button onClick={handleDeleteProfile} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProfilePage; 