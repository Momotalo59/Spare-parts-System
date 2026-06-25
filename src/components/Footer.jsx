
import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer"
      sx={{
        p: 2, 
        backgroundColor: '#000000', // Black background
        color: 'grey.500', // Light grey text
        textAlign: 'center',
        width: '100%',
        flexShrink: 0 
      }}
    >
      <Typography variant="body2" sx={{ fontFamily: 'Kanit' }}>
        Copyright © 2025 แผนกช่างเทคนิคควบคุมระบบ โรงพยาบาลโอเวอร์บรุ๊คเชียงราย All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
