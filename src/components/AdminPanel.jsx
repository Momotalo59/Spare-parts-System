
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AddCircleOutline, History } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ onAddItemClick }) => {
    const navigate = useNavigate();

    const createGlowStyle = (color, hoverColor) => ({
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
        transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
            backgroundColor: hoverColor,
            boxShadow: `0 0 12px ${hoverColor}, 0 0 18px ${hoverColor}`,
        }
    });

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column', 
            gap: 1.5,                
            width: '100%',
        }}>
            <Typography variant="h6" sx={{ fontFamily: 'Kanit', fontWeight: 'bold', color: '#E0E0E0' }}>
                เมนูสำหรับ Admin
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignSelf: 'center' }}>
                <Button 
                    variant="contained" 
                    sx={{
                        fontFamily: 'Kanit', 
                        fontWeight: 'bold', 
                        borderRadius: '9999px',
                        color: '#fff',
                        px: 2.5, 
                        py: 1,
                        textTransform: 'none',
                        ...createGlowStyle('#A076F9', '#8952f5')
                    }} 
                    startIcon={<AddCircleOutline />} 
                    onClick={onAddItemClick}
                >
                    เพิ่มรายการใหม่
                </Button>
                <Button 
                    variant="contained" 
                    sx={{
                        fontFamily: 'Kanit', 
                        fontWeight: 'bold', 
                        borderRadius: '9999px',
                        color: '#fff',
                        px: 2.5, 
                        py: 1,
                        textTransform: 'none',
                        ...createGlowStyle('#ff7043', '#ff5722')
                    }} 
                    startIcon={<History />} 
                    onClick={() => navigate('/history')}
                >
                    ประวัติการใช้งาน
                </Button>
            </Box>
        </Box>
    );
}

export default AdminPanel;
