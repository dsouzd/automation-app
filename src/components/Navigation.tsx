import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Home, PlayArrow, Assessment } from '@mui/icons-material';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Web Automation Platform
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ 
              bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            startIcon={<PlayArrow />}
            onClick={() => navigate('/runner')}
            sx={{ 
              bgcolor: location.pathname === '/runner' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Runner
          </Button>
          <Button
            color="inherit"
            startIcon={<Assessment />}
            onClick={() => navigate('/summary')}
            sx={{ 
              bgcolor: location.pathname === '/summary' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Summary
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};