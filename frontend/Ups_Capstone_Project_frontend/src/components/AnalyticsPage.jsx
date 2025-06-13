import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';

const POWER_BI_EMBED_URL = 'https://app.powerbi.com/view?r=YOUR_EMBED_URL'; // Replace with your Power BI embed link

const AnalyticsPage = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography variant="h5" gutterBottom>
          UPS Label Analytics (Power BI)
        </Typography>
        <Box sx={{ mt: 3, width: '100%', height: 600 }}>
          <iframe
            title="Power BI Dashboard"
            width="100%"
            height="100%"
            src={POWER_BI_EMBED_URL}
            frameBorder="0"
            allowFullScreen
            style={{ border: 0 }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default AnalyticsPage; 