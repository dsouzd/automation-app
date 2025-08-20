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
import { PlayArrow, CheckCircle, Error, Clear, AutoAwesome } from '@mui/icons-material';
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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [scriptActions, setScriptActions] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (!iframeRef.current) return;
    if (!url) {
      alert('Please enter a URL on the Home page first');
      navigate('/');
      return;
    }
    
    setIsLoadingScript(true);
    try {
      const response = await convertPromptToScriptAPI(data.prompt, setLoadingMessage);
      setIsLoadingScript(false);
      setLoadingMessage('');
      
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
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Inject automation script directly into iframe
          const automationScript = `
            (function() {
              const selectors = '${action.selector}'.split(',').map(s => s.trim());
              let element = null;
              
              for (const sel of selectors) {
                try {
                  element = document.querySelector(sel);
                  if (element) break;
                } catch (e) { continue; }
              }
              
              if (element) {
                const originalStyle = element.style.cssText;
                element.style.cssText += 'border: 3px solid red !important; background-color: yellow !important; transition: all 0.3s;';
                
                setTimeout(() => {
                  switch ('${action.action}') {
                    case 'click':
                      element.click();
                      break;
                    case 'type':
                      if (element.tagName === 'INPUT' && '${action.value}') {
                        element.focus();
                        element.value = '${action.value}';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                      break;
                  }
                  
                  setTimeout(() => {
                    element.style.cssText = originalStyle;
                  }, 1000);
                }, 500);
              }
            })();
          `;
          
          // Execute script in iframe
          const iframe = iframeRef.current;
          let executed = false;
          
          try {
            if (iframe?.contentDocument) {
              const script = iframe.contentDocument.createElement('script');
              script.textContent = automationScript;
              iframe.contentDocument.head.appendChild(script);
              iframe.contentDocument.head.removeChild(script);
              executed = true;
            }
          } catch (error) {
            executed = false;
          }
          
          if (!executed) {
            // Fallback to postMessage
            const message = {
              type: 'AUTOMATION_ACTION',
              action: action.action,
              selector: action.selector,
              value: action.value,
              step: i + 1
            };
            iframe?.contentWindow?.postMessage(message, '*');
          }
        }
      }
    } catch (error) {
      console.error('Script execution failed:', error);
    } finally {
      setExecuting(false);
      setIsLoadingScript(false);
      setLoadingMessage('');
      setCurrentStep(0);
      reset();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <Box sx={{ flex: 2, p: 1 }}>
        <Paper sx={{ height: '100%', bgcolor: '#f8f9fa', position: 'relative' }}>
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
      
      <Box sx={{ flex: 1, p: 1 }}>
        <Paper sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesome sx={{ color: 'primary.main', mr: 1, fontSize: 24 }} />
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Automation Control
              </Typography>
            </Box>
            {logs.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                onClick={() => useStore.getState().clearLogs()}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': { borderColor: 'error.dark', bgcolor: 'error.light' }
                }}
              >
                Clear Logs
              </Button>
            )}
          </Box>
          
          {!url && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffd93d' }}>
              <Typography sx={{ fontWeight: 500, color: '#856404' }}>
                ⚠️ No URL configured. Please go to Home page and enter your application URL first.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/')}
                sx={{ mt: 1 }}
              >
                Go to Home
              </Button>
            </Box>
          )}

          {url && !isExecuting && !isLoadingScript && (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
              <TextField
                {...register('prompt', { required: 'Prompt is required' })}
                fullWidth
                multiline
                rows={4}
                label="Automation Instructions"
                placeholder="e.g., Click on login, enter username=test@gmail.com, password=test123, and click login button"
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
                sx={{ py: 1.5 }}
              >
                Execute Automation
              </Button>
            </Box>
          )}

          {isLoadingScript && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f4f8', borderRadius: 1, border: '1px solid #e3f2fd' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CircularProgress size={18} sx={{ mr: 2, color: 'primary.main' }} />
                <Typography sx={{ fontWeight: 500, color: 'primary.main' }}>
                  AI Processing Pipeline
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                {loadingMessage || 'Initializing AI processing...'}
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 1, 
                  height: 4, 
                  borderRadius: 2,
                  '& .MuiLinearProgress-bar': {
                    transition: 'transform 0.8s ease'
                  }
                }} 
              />
            </Box>
          )}

          {isExecuting && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #c8e6c9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CircularProgress size={18} sx={{ color: 'success.main', mr: 2 }} />
                <Typography sx={{ fontWeight: 500, color: 'success.dark' }}>
                  Executing Step {currentStep} of {scriptActions.length}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(currentStep / scriptActions.length) * 100} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'success.main'
                  }
                }}
              />
              {scriptActions[currentStep - 1] && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.dark', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  ▶️ {scriptActions[currentStep - 1].action.toUpperCase()}: {scriptActions[currentStep - 1].selector.split(',')[0]}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Execution Logs ({logs.length})
            </Typography>
          </Box>
          
          <List sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            bgcolor: '#f8f9fa', 
            borderRadius: 1, 
            p: 1,
            border: '1px solid #dee2e6',
            maxHeight: 'calc(100vh - 400px)'
          }}>
            {logs.length === 0 && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: 150,
                color: 'text.secondary'
              }}>
                <AutoAwesome sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>Ready for Automation</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Enter instructions above to see execution logs</Typography>
              </Box>
            )}
            {logs.map((log, index) => {
              const isCurrentStep = isExecuting && log.step === currentStep;
              const isCompleted = log.step < currentStep;
              
              return (
                <ListItem 
                  key={index} 
                  divider 
                  sx={{ 
                    bgcolor: isCurrentStep ? '#e3f2fd' : 'white', 
                    mb: 0.5, 
                    borderRadius: 1,
                    border: isCurrentStep ? '1px solid #1976d2' : '1px solid #e0e0e0'
                  }}
                >
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                    {isCurrentStep ? (
                      <PlayArrow sx={{ color: 'primary.main' }} />
                    ) : isCompleted ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : (
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%', 
                        bgcolor: '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="caption" sx={{ fontSize: 9 }}>
                          {log.step}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <ListItemText
                    primary={`Step ${log.step}: ${log.action} ${log.selector}`}
                    secondary={log.value ? `Value: ${log.value}` : undefined}
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontWeight: isCurrentStep ? 600 : 400,
                        fontSize: '0.9rem'
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