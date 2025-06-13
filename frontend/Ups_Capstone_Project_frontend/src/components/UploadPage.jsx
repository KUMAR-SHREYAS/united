import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  IconButton,
  useTheme,
  Fade,
  Zoom,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { JsonToTable } from 'react-json-to-table';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { API_BASE_URL } from '../config';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// import { mockOcrApi } from '../utils/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_BATCH_UPLOAD_LIMIT = 10; // New constant for batch upload limit

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processedResults, setProcessedResults] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const theme = useTheme();

  // Define the tabs for navigation
  const navTabs = [
    { label: 'Upload', path: '/upload' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analytics', path: '/analytics' },
  ];

  const [currentTab, setCurrentTab] = useState(navTabs[0].path);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    navigate(newValue);
  };

  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png'];
    const extension = file.name.split('.').pop().toLowerCase();

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const hasValidExtension = allowedExtensions.includes(extension);

    const hasValidMimeType = validTypes.includes(file.type);

    if (!hasValidExtension || !hasValidMimeType) {
      setError(`Only JPEG and PNG files are allowed. Invalid file: ${file.name}`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size for ${file.name} must be less than 5MB`);
      return false;
    }

    return true;
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > MAX_BATCH_UPLOAD_LIMIT) {
      setError(`You can only upload a maximum of ${MAX_BATCH_UPLOAD_LIMIT} images at once. You selected ${selectedFiles.length}.`);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const validFiles = [];
    setProcessedResults([]);
    setError('');

    for (const f of selectedFiles) {
      if (!validateFile(f)) {
        continue;
      }
      try {
        const isValidImage = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = URL.createObjectURL(f);
        });

        if (!isValidImage) {
          setError(`The file ${f.name} appears to be corrupted or is not a valid image. Please try another file.`);
          continue;
        }
        validFiles.push(f);
      } catch (err) {
        setError(`Failed to process the file ${f.name}: ` + err.message);
        continue;
      }
    }

    setFiles(validFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);

    if (droppedFiles.length > MAX_BATCH_UPLOAD_LIMIT) {
      setError(`You can only upload a maximum of ${MAX_BATCH_UPLOAD_LIMIT} images at once. You dropped ${droppedFiles.length}.`);
      setFiles([]);
      return;
    }

    const validFiles = [];
    setProcessedResults([]);
    setError('');

    for (const f of droppedFiles) {
      if (!validateFile(f)) {
        continue;
      }
      try {
        const isValidImage = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = URL.createObjectURL(f);
        });

        if (!isValidImage) {
          setError(`The file ${f.name} appears to be corrupted or is not a valid image. Please try another file.`);
          continue;
        }
        validFiles.push(f);
      } catch (err) {
        setError(`Failed to process the file ${f.name}: ` + err.message);
        continue;
      }
    }
    setFiles(validFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setProcessedResults([]);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload-images-batch/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Batch upload failed');
      }

      const results = await response.json();
      console.log('Batch upload successful:', results);
      setProcessedResults(results);

      const allSuccessful = results.every(res => res.upload_status === "successful" && res.extract_status === "successful");
      if (allSuccessful) {
        setSuccessMessage('All files uploaded and processed successfully!');
      } else {
        setSuccessMessage('Some files processed with warnings or failures. See details below.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError('');
    setSuccessMessage('');
    setProcessedResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container maxWidth="md">
      <Fade in timeout={800}>
        <Box>
          <Box sx={{ width: '100%', mb: 4 }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              aria-label="navigation tabs"
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

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Upload Labels
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload shipping label images for analysis (supports multiple files)
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Paper 
            elevation={0}
            sx={{ 
              border: '2px dashed',
              borderColor: files.length > 0 ? 'primary.main' : 'divider',
              borderRadius: 3,
              p: 4,
              bgcolor: files.length > 0 ? 'primary.main' : 'background.paper',
              transition: 'all 0.3s ease-in-out',
              transform: files.length > 0 ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 300,
                justifyContent: 'center',
                color: files.length > 0 ? 'common.white' : 'text.primary',
              }}
            >
              {files.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 1, color: 'inherit' }}>
                    Selected Files:
                  </Typography>
                  <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
                    {files.map((file, index) => (
                      <ListItem key={file.name + index} dense>
                        <ListItemIcon>
                          <InsertDriveFileIcon sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name} 
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} 
                          primaryTypographyProps={{ noWrap: true }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={clearFiles}
                    startIcon={<DeleteIcon />} 
                    sx={{ 
                      mt: 2,
                      borderColor: 'inherit',
                      color: 'inherit',
                      '&:hover': {
                        borderColor: 'inherit',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    Clear All Files
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <CloudUploadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drag & drop your labels here, or
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => fileInputRef.current.click()}
                    startIcon={<CloudUploadIcon />} 
                  >
                    Browse Files
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png"
                    multiple
                  />
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    JPEG or PNG, max 5MB per file, up to {MAX_BATCH_UPLOAD_LIMIT} files
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={handleUpload}
              disabled={files.length === 0 || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Uploading...' : 'Upload and Extract All'}
            </Button>
          </Box>

          {processedResults.length > 0 && (
            <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Processing Results
              </Typography>
              <List>
                {processedResults.map((result, index) => (
                  <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, bgcolor: result.error ? '#ffe0e0' : result.extract_status === 'successful' ? '#e0ffe0' : '#fff0b3' }}>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        {result.error || result.upload_status === 'failed' || result.extract_status === 'failed' ? (
                          <ErrorOutlineIcon color="error" />
                        ) : (
                          <CheckCircleOutlineIcon color="success" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={result.filename} 
                        secondary={
                          result.error ? `Error: ${result.error}` : 
                          `Upload Status: ${result.upload_status}, Extract Status: ${result.extract_status}`
                        }
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                    </ListItem>
                    {result.extracted_info && Object.keys(result.extracted_info).length > 0 && (
                      <Box sx={{ mt: 2, ml: 4, bgcolor: '#f8f8f8', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Extracted Details:</Typography>
                        <JsonToTable json={result.extracted_info} />
                      </Box>
                    )}
                     {!result.extracted_info && !result.error && result.extract_status === "successful" && (
                      <Box sx={{ mt: 2, ml: 4 }}>
                        <Typography variant="body2" color="text.secondary">No specific information extracted (e.g., if image did not contain expected data).</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default UploadPage; 