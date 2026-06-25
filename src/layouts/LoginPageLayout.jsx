
import React from 'react';
import { Outlet } from 'react-router-dom'; // CRITICAL FIX: Import Outlet
import { Box } from '@mui/material';
import Footer from '../components/Footer';

const LoginPageLayout = () => { // Removed {children} prop as it is not used
    return (
        <Box sx={{
            height: '100vh',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#121212' // Ensure consistent background
        }}>
            <Box sx={{
                flex: '1 1 auto',
                display: 'flex',
                justifyContent: 'center', // Center the content horizontally
                alignItems: 'center',   // Center the content vertically
                overflowY: 'auto',      // Allow scrolling if content overflows
            }}>
                {/* CRITICAL FIX: Render the nested route component (Login, Signup) here */}
                <Outlet />
            </Box>
            <Footer /> 
        </Box>
    );
};

export default LoginPageLayout;
