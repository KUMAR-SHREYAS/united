import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ConfirmationPage = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                textAlign: 'center',
                p: 3,
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom>
                Registration Successful!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
                Thank you for registering. Your account has been successfully created and is pending approval by an administrator. You will be able to log in once your account is approved.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/login"
            >
                Go to Login
            </Button>
        </Box>
    );
};

export default ConfirmationPage; 