import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import upsLogo from '../assets/ups-logo.png'; // Assuming you'll place a UPS logo here
import mountainImage from '../assets/mountains.jpeg'; // Corrected extension
import riverImage from '../assets/rivers.jpeg'; // Corrected extension
import milkyWayImage from '../assets/milkyway.jpeg'; // Corrected extension

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <Box>
            {/* Top Section - UPS Welcome */}
            <Box
                sx={{
                    height: '400px',
                    background: 'linear-gradient(to right, #4B2815 50%, #FF9900 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    p: 4,
                }}
            >
                <Box
                    component="img"
                    src={upsLogo}
                    alt="UPS Logo"
                    sx={{ width: 100, mb: 2 }}
                />
                <Typography variant="h3" component="h1" gutterBottom>
                    Welcome to UPS
                </Typography>
                <Typography variant="h6" sx={{ maxWidth: '600px' }}>
                    Delivering what matters. Trusted worldwide for logistics,
                    shipping, and supply chain solutions.
                </Typography>
            </Box>

            {/* Feature Cards */}
            <Container maxWidth="lg" sx={{ mt: -8, zIndex: 1, position: 'relative' }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2, height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Global Reach
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    UPS delivers to over 220 countries and territories, connecting businesses and people
                                    around the world.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2, height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Fast & Reliable
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    From next-day air to ground shipping, UPS ensures your packages arrive safely and on
                                    time, every time.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2, height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Trusted Service
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    With over a century of experience, UPS is a leader in logistics, innovation, and customer
                                    satisfaction.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Image Section */}
            <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={mountainImage}
                                alt="Mountains"
                                sx={{ borderRadius: 2 }}
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={riverImage}
                                alt="River"
                                sx={{ borderRadius: 2 }}
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 2 }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={milkyWayImage}
                                alt="Milky Way"
                                sx={{ borderRadius: 2 }}
                            />
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Navigation Buttons */}
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/upload')}
                >
                    Go to Upload Section
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                >
                    Go to Dashboard
                </Button>
            </Container>
        </Box>
    );
};

export default HomePage; 