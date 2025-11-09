import React from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: { xs: 2, md: 4 },
          px: 0,
          overflowY: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
