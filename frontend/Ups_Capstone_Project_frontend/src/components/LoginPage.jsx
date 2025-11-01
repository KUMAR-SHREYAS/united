import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService from '../auth/authService';
import { useAuth } from '../auth/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await authService.login(username, password);
      await login(data.access_token);
      navigate('/upload');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* LOGO - Temporarily Hidden */}
        {/* <img
          src="images (1).png"
          alt="PARS Logo"
          style={{
            width: '200x',
            height: '120px',
            marginBottom: '1rem',
            objectFit: 'contain',
          }}
        /> */}

        {/* APP NAME */}
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 500,
            mb: 3,
            color: 'text.primary',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <strong>P</strong>ackage <strong>A</strong>nalysis & <strong>R</strong>erouting <strong>S</strong>ystem
        </Typography>

        {/* LOGIN FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ '& fieldset': { borderRadius: '12px' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ '& fieldset': { borderRadius: '12px' } }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              background: 'linear-gradient(to right, #4e2600, #7a4d1b)',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}
          >
            Sign In
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>

        {/* Register Redirect */}
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#4e2600',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => navigate('/register')}
        >
          New user? Register here
        </Typography>

      </Box>
    </Container>
  );
}

export default LoginPage;