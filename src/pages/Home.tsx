import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import { useStore } from '../store/useStore';

interface FormData {
  url: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const setUrl = useStore(state => state.setUrl);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    setUrl(data.url);
    navigate('/runner');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        minHeight: '80vh',
        justifyContent: 'center'
      }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            color: 'primary.main', 
            fontWeight: 600,
            textAlign: 'center',
            mb: 2
          }}
        >
          Web Automation Platform
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.secondary',
            textAlign: 'center',
            mb: 4,
            maxWidth: '600px'
          }}
        >
          Enter your application URL and describe automation tasks in natural language
        </Typography>
        
        <Box 
          component="form" 
          onSubmit={handleSubmit(onSubmit)} 
          sx={{ 
            mt: 3, 
            width: '100%', 
            maxWidth: '500px',
            p: 4,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <TextField
            {...register('url', { required: 'URL is required' })}
            fullWidth
            label="Application URL"
            variant="outlined"
            placeholder="http://localhost:4001"
            error={!!errors.url}
            helperText={errors.url?.message || 'Enter the URL of your application to automate'}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              py: 1.5,
              fontSize: '1rem'
            }}
          >
            Start Automation
          </Button>
        </Box>
      </Box>
    </Container>
  );
};