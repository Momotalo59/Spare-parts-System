import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Copyright = () => {
  return (
    <Box 
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: '#343a40',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
          {'Copyright © 2025 แผนกช่างเทคนิคควบคุมระบบ โรงพยาบาลโอเวอร์บรุ๊คเชียงราย All rights reserved.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Copyright;
