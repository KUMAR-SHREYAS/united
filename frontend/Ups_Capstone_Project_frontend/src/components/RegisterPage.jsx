import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';
import authService from '../auth/authService';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    // Validation functions
    const validatePassword = (pwd) => {
        const minLength = 8;
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);
        const hasDigit = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (pwd.length < minLength) {
            return `Password must be at least ${minLength} characters long.`;
        }
        if (!hasUppercase) {
            return "Password must contain at least one uppercase letter.";
        }
        if (!hasLowercase) {
            return "Password must contain at least one lowercase letter.";
        }
        if (!hasDigit) {
            return "Password must contain at least one digit.";
        }
        if (!hasSpecialChar) {
            return "Password must contain at least one special character.";
        }
        return ""; // No error
    };

    const validateEmail = (mail) => {
        if (!mail.endsWith('@ups.com')) {
            return "Email must end with @ups.com.";
        }
        return ""; // No error
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setPasswordError('');
        setEmailError('');

        // Client-side validation
        const newPasswordError = validatePassword(password);
        const newEmailError = validateEmail(email);

        if (newPasswordError) {
            setPasswordError(newPasswordError);
            return;
        }
        if (newEmailError) {
            setEmailError(newEmailError);
            return;
        }

        try {
            await authService.register(username, email, password);
            setSuccess('Registration successful! Your account is pending administrator approval.');
            navigate('/confirmation'); // Navigate to confirmation page, or perhaps directly to login with a message
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Register
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!emailError}
                        helperText={emailError}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!passwordError}
                        helperText={passwordError}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Register
                    </Button>
                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}
                    <Button 
                        fullWidth 
                        variant="text" 
                        onClick={() => navigate('/login')} 
                        sx={{ mt: 1 }}
                    >
                        Already have an account? Login
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default RegisterPage; 