
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Chip,
    Tooltip
} from '@mui/material';
import { Logout, AdminPanelSettings, Person } from '@mui/icons-material';

const Header = ({ displayName, userRole }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <AppBar position="static" sx={{ 
            backgroundColor: '#1f1f1f',
            boxShadow: 'none',
            borderBottom: '1px solid #333'
        }}>
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px', px: { xs: 2, sm: 3 } }}>
                {/* Left Side */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 1, overflow: 'hidden' }}>
                    <img 
                        src="https://img2.pic.in.th/pic/LOGO-OVERBROOK-2023-02_03c4ebbf7ce6b3bcc.png" 
                        alt="Logo" 
                        style={{ height: '45px', marginRight: '16px' }} 
                    />
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Typography 
                            variant="h6" 
                            component="div" 
                            sx={{ fontFamily: 'Kanit', fontWeight: 'bold', lineHeight: 1.3 }}
                        >
                            คลังพัสดุและเครื่องมือ
                        </Typography>
                         <Typography 
                            variant="body2" 
                            sx={{ fontFamily: 'Kanit', color: 'text.secondary' }}
                         >
                            แผนกช่างเทคนิคควบคุมระบบ โรงพยาบาลโอเวอร์บรุ๊ค
                        </Typography>
                    </Box>
                </Box>

                {/* Right Side - Welcome text and User Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Show full welcome message on small screens and up */}
                    <Typography sx={{ fontFamily: 'Kanit', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}>
                        {`ยินดีต้อนรับ, ${displayName}`}
                    </Typography>

                    {/* Show only the name on extra-small screens */}
                    <Typography sx={{ fontFamily: 'Kanit', whiteSpace: 'nowrap', display: { xs: 'block', sm: 'none' } }}>
                        {displayName}
                    </Typography>
                    
                    {/* --- STATUS CHIP (REFINED) --- */}
                    {userRole === 'admin' ? (
                        <Chip
                            icon={<AdminPanelSettings />}
                            label="Admin"
                            variant="filled"
                            sx={{
                                fontFamily: 'Kanit',
                                fontWeight: 'bold',
                                color: 'white',
                                backgroundColor: '#8e44ad',
                                boxShadow: '0 0 8px rgba(142, 68, 173, 0.9)',
                            }}
                        />
                    ) : (
                        <Chip
                            icon={<Person />}
                            label="User"
                            variant="filled"
                            sx={{
                                fontFamily: 'Kanit',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                backgroundColor: '#546e7a', // Blue Grey Color
                                boxShadow: '0 0 6px rgba(84, 110, 122, 0.8)', // Subtle Glow Effect
                            }}
                        />
                    )}
                    {/* --- END STATUS CHIP --- */}
                    
                    <Tooltip title="ออกจากระบบ">
                        <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
                            <Logout />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
