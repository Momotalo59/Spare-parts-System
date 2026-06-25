import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, History, QrCodeScanner } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

function AppNav() {
    const location = useLocation();

    return (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }} elevation={3}>
            <BottomNavigation showLabels value={location.pathname}>
                <BottomNavigationAction label="หน้าหลัก" icon={<Home />} component={Link} to="/" value="/" />
                <BottomNavigationAction label="สแกน" icon={<QrCodeScanner />} component={Link} to="/scan" value="/scan" />
                <BottomNavigationAction label="ประวัติ" icon={<History />} component={Link} to="/history" value="/history" />
            </BottomNavigation>
        </Paper>
    );
}

export default AppNav;
