
import React from 'react';
import { Outlet } from 'react-router-dom'; 
import { Box, AppBar, Toolbar } from '@mui/material';
import Footer from '../components/Footer';
import Header from '../components/Header';

const MainLayout = ({ userData }) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#121212'
    }}>
      <AppBar position="sticky" sx={{ backgroundColor: '#121212'}}>
        <Header displayName={userData?.displayName} userRole={userData?.role} />
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 2, sm: 3 } 
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
