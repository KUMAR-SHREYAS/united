import React from 'react';
import { Container, Paper, Typography, Box, Divider } from '@mui/material';

const AnalyticsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper 
        elevation={4}
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          bgcolor: '#fdfdfd',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          UPS Label Insights
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          A visual dashboard analyzing shipment label trends and routing hotspots.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            pb: '56.25%', // 16:9 aspect ratio
            height: 0,
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          <iframe
            title="Looker Studio Dashboard"
            src="https://lookerstudio.google.com/embed/reporting/62d4c3a0-21a9-4a20-b5de-18f827c1a93c/page/wpnNF"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          ></iframe>
        </Box>
      </Paper>
    </Container>
  );
};

export default AnalyticsPage;
