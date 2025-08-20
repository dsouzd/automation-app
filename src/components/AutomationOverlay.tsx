import React from 'react';
import { Box, Typography, Fade } from '@mui/material';

interface AutomationOverlayProps {
  isVisible: boolean;
  currentAction?: string;
  currentSelector?: string;
  step?: number;
}

export const AutomationOverlay: React.FC<AutomationOverlayProps> = ({
  isVisible,
  currentAction,
  currentSelector,
  step
}) => {
  if (!isVisible) return null;

  return (
    <Fade in={isVisible}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(128, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(128, 0, 0, 0.9)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            textAlign: 'center',
            minWidth: 300,
            animation: 'bounce 1s infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
              '40%': { transform: 'translateY(-10px)' },
              '60%': { transform: 'translateY(-5px)' }
            }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Step {step}: Executing Action
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Action: <strong>{currentAction}</strong>
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            Target: {currentSelector}
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};