import React from 'react';
import { Modal, Box, Typography, Button, Paper, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
  outline: 'none'
};

const ProfileModal = ({ open, onClose, user, userData }) => {
  if (!user || !userData) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontFamily: 'Kanit', fontWeight: 'bold' }}>
            โปรไฟล์ผู้ใช้
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Box>
          <Typography sx={{ fontFamily: 'Kanit', mb: 1 }}>
            <strong>ชื่อ:</strong> {userData.displayName || 'N/A'}
          </Typography>
          <Typography sx={{ fontFamily: 'Kanit', mb: 1 }}>
            <strong>อีเมล:</strong> {user.email || 'N/A'}
          </Typography>
          <Typography sx={{ fontFamily: 'Kanit', textTransform: 'capitalize' }}>
            <strong>บทบาท:</strong> {userData.role || 'user'}
          </Typography>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button onClick={onClose} variant="contained" sx={{ fontFamily: 'Kanit' }}>
            ปิด
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ProfileModal;
