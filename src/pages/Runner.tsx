import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { PlayArrow, CheckCircle, Error } from '@mui/icons-material';
import { useStore } from '../store/useStore';
import { executeScript } from '../utils/scriptExecutor';
import { convertPromptToScriptAPI } from '../services/api';
import { AutomationOverlay } from '../components/AutomationOverlay';

interface FormData {
  prompt: string;
}

export const Runner: React.FC = () => {
  const navigate = useNavigate();
  const { url, logs, isExecuting, addLog, setExecuting } = useStore();
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scriptActions, setScriptActions] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!iframeRef.current) return;
    
    setIsLoadingScript(true);
    try {
      const response = await convertPromptToScriptAPI(data.prompt);
      setIsLoadingScript(false);
      
      if (response.success) {
        setScriptActions(response.script);
        setExecuting(true);
        setCurrentStep(0);
        
        // Execute with step tracking
        for (let i = 0; i < response.script.length; i++) {
          setCurrentStep(i + 1);
          const action = response.script[i];
          
          // Log the action as starting
          addLog({
            step: i + 1,
            action: action.action,
            selector: action.selector,
            value: action.value,
            result: 'success',
            timestamp: new Date()
          });
          
          // Visual delay to show the action
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Send action to iframe
          const message = {
            type: 'AUTOMATION_ACTION',
            action: action.action,
            selector: action.selector,
            value: action.value,
            step: i + 1
          };
          
          iframeRef.current?.contentWindow?.postMessage(message, '*');
        }
      }
    } catch (error) {
      console.error('Script execution failed:', error);
    } finally {
      setExecuting(false);
      setIsLoadingScript(false);
      setCurrentStep(0);
      reset();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', p: 2, gap: 2 }}>
      <Box sx={{ flex: 2, position: 'relative' }}>
        <Paper sx={{ height: '100%', p: 1, bgcolor: '#f5f5f5', position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src={url || 'http://localhost:4001'}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            title="Target Application"
          />
          <AutomationOverlay
            isVisible={isExecuting && currentStep > 0}
            currentAction={scriptActions[currentStep - 1]?.action}
            currentSelector={scriptActions[currentStep - 1]?.selector}
            step={currentStep}
          />
          
          {/* Floating Action Indicator */}
          {isExecuting && currentStep > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                bgcolor: 'primary.main',
                color: 'white',
                p: 2,
                borderRadius: 2,
                zIndex: 1001,
                minWidth: 200,
                animation: 'slideIn 0.5s ease-out',
                '@keyframes slideIn': {
                  '0%': { transform: 'translateX(100%)', opacity: 0 },
                  '100%': { transform: 'translateX(0)', opacity: 1 }
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🤖 Automation Active
              </Typography>
              <Typography variant="body2">
                {scriptActions[currentStep - 1]?.action.toUpperCase()}: {scriptActions[currentStep - 1]?.value || 'Element'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Paper sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', bgcolor: '#fff', boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Automation Panel
          </Typography>
          
          {!isExecuting && !isLoadingScript && (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
              <TextField
                {...register('prompt', { required: 'Prompt is required' })}
                fullWidth
                multiline
                rows={4}
                label="Enter instructions"
                placeholder="e.g., Click on login navigation, enter username=test, password=1234, and click login"
                error={!!errors.prompt}
                helperText={errors.prompt?.message}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: 'primary.main' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth 
                size="large"
                sx={{ 
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  py: 1.5
                }}
              >
                Execute Automation
              </Button>
            </Box>
          )}

          {isLoadingScript && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, p: 2, bgcolor: '#f0f0f0', borderRadius: 1 }}>
              <CircularProgress sx={{ color: 'primary.main', mr: 2 }} />
              <Typography>Converting prompt to script...</Typography>
            </Box>
          )}

          {isExecuting && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ color: 'primary.main', mr: 2 }} />
                <Typography color="primary.main" fontWeight="bold">
                  Executing Step {currentStep} of {scriptActions.length}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(currentStep / scriptActions.length) * 100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              {scriptActions[currentStep - 1] && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Current: {scriptActions[currentStep - 1].action} - {scriptActions[currentStep - 1].selector}
                </Typography>
              )}
            </Box>
          )}

          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
            Execution Logs
          </Typography>
          
          <List sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1, p: 1 }}>
            {logs.map((log, index) => {
              const isCurrentStep = isExecuting && log.step === currentStep;
              const isCompleted = log.step < currentStep;
              
              return (
                <ListItem 
                  key={index} 
                  divider 
                  sx={{ 
                    bgcolor: isCurrentStep ? '#fff3cd' : 'white', 
                    mb: 1, 
                    borderRadius: 1,
                    border: isCurrentStep ? '2px solid #800000' : 'none',
                    animation: isCurrentStep ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(128, 0, 0, 0.4)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(128, 0, 0, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(128, 0, 0, 0)' }
                    }
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    {isCurrentStep ? (
                      <PlayArrow sx={{ color: 'primary.main' }} />
                    ) : isCompleted ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : (
                      <Box sx={{ width: 24, height: 24 }} />
                    )}
                  </Box>
                  <ListItemText
                    primary={`Step ${log.step}: ${log.action} ${log.selector}`}
                    secondary={log.value ? `Value: ${log.value}` : undefined}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: isCurrentStep ? 'bold' : 'medium',
                        color: isCurrentStep ? 'primary.main' : 'inherit'
                      } 
                    }}
                  />
                  <Chip 
                    label={log.result} 
                    color={log.result === 'success' ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </ListItem>
              );
            })}
          </List>
          
          {logs.length > 0 && (
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => navigate('/summary')}
              sx={{ 
                mt: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { 
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              View Summary
            </Button>
          )}
        </Paper>
      </Box>
    </Box>
  );
};