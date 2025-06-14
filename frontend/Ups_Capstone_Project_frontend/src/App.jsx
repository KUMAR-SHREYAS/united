import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import LoginPage from './components/LoginPage';
import UploadPage from './components/UploadPage';
import DashboardPage from './components/DashboardPage';
import AnalyticsPage from './components/AnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Container, Stack, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import { AuthProvider, useAuth } from './auth/AuthContext';
import theme from './theme';
import { useNavigate } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import ConfirmationPage from './components/ConfirmationPage';
import ProfilePage from './components/ProfilePage';

function App() {
  const { isAuthenticated, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null); // State for the menu anchor
  const menuOpen = Boolean(anchorEl);

  // Define paths where the AppBar should not be shown
  const noAppBarPaths = ['/login', '/register', '/confirmation'];
  const shouldShowAppBar = !noAppBarPaths.includes(location.pathname);

  console.log('App Render: isAuthenticated =', isAuthenticated);
  console.log('App Render: shouldShowAppBar =', shouldShowAppBar);
  console.log('App Render: isLoading =', isLoading);

  const navItems = [
    { label: 'Upload', path: '/upload', icon: <CloudUploadIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  ];

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}>
          <Typography variant="h5">Loading application...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {shouldShowAppBar && (
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
            <Container maxWidth="lg">
              <Toolbar sx={{ px: { xs: 0 } }}>
                  {isAuthenticated && (
                    <IconButton
                      color="inherit"
                      aria-label="open drawer"
                      edge="start"
                      onClick={handleMenuClick} // Open menu on click
                      sx={{ mr: 2 }}
                    >
                      <MenuIcon />
                    </IconButton>
                  )}
                <Typography 
                  variant="h5" 
                  sx={{ 
                    flexGrow: 1, 
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                    onClick={() => navigate(isAuthenticated ? '/upload' : '/login')} // Changed to /upload after login
                >
                  PARS
                </Typography>
                {isAuthenticated && (
                  <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
                      {/* These items are now in the dropdown menu */}
                  </Stack>
                )}
                {isAuthenticated && (
                    <IconButton
                    color="inherit" 
                      onClick={() => navigate('/profile')}
                      sx={{ ml: 2 }} // Margin left for spacing from logout button if it exists
                    >
                      <AccountCircle />
                    </IconButton>
                )}
              </Toolbar>
            </Container>
          </AppBar>
          )}
          {isAuthenticated && (
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              {navItems.map((item) => (
                <MenuItem key={item.label} onClick={() => handleMenuItemClick(item.path)}>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>
              ))}
              <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                alert('Settings page not implemented yet.');
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => {
                logout();
                navigate('/login');
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          )}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              bgcolor: 'background.default',
              py: 4
            }}
          >
            <Container maxWidth="lg">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/upload" : "/login"} />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
  );
}

export default App; 