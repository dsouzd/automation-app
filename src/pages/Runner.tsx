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
          
          const iframe = iframeRef.current;
          
          // Method 1: Try direct DOM access (same origin)
          try {
            const iframeDoc = iframe?.contentDocument;
            if (iframeDoc) {
              const selectors = action.selector.split(',').map((s: string) => s.trim());
              let element: HTMLElement | null = null;
              
              for (const sel of selectors) {
                try {
                  element = iframeDoc.querySelector(sel) as HTMLElement;
                  if (element) break;
                } catch (e) { continue; }
              }
              
              if (element) {
                // Highlight element
                const originalStyle = element.style.cssText;
                element.style.cssText += 'border: 3px solid #f97316 !important; background-color: #fff7ed !important; box-shadow: 0 0 10px #f97316 !important;';
                
                // Execute action after highlight
                setTimeout(() => {
                  switch (action.action) {
                    case 'click':
                      element!.click();
                      console.log('✅ Clicked:', element);
                      break;
                    case 'type':
                      if (element!.tagName === 'INPUT' && action.value) {
                        (element as HTMLInputElement).focus();
                        (element as HTMLInputElement).value = action.value;
                        element!.dispatchEvent(new Event('input', { bubbles: true }));
                        element!.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('✅ Typed:', action.value, 'into', element);
                      }
                      break;
                  }
                  
                  // Remove highlight
                  setTimeout(() => {
                    element!.style.cssText = originalStyle;
                  }, 1000);
                }, 800);
                
                continue; // Skip postMessage if direct access worked
              }
            }
          } catch (error) {
            console.log('Direct access failed, trying postMessage...');
          }
          
          // Method 2: PostMessage for cross-origin
          const message = {
            type: 'AUTOMATION_ACTION',
            action: action.action,
            selector: action.selector,
            value: action.value,
            step: i + 1
          };
          
          iframe?.contentWindow?.postMessage(message, '*');
          console.log('📤 Sent postMessage:', message);
          

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
        <Paper sx={{ height: '100%', bgcolor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
          {/* Status Bar */}
          {isExecuting && currentStep > 0 && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bgcolor: 'primary.main',
              color: 'white',
              px: 2,
              py: 1,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={14} sx={{ color: 'white', mr: 1 }} />
                <span>Executing: {scriptActions[currentStep - 1]?.action.toUpperCase()}</span>
              </Box>
              <span>Step {currentStep}/{scriptActions.length}</span>
            </Box>
          )}
          
          <iframe
            ref={iframeRef}
            src={url || 'http://localhost:4001'}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none', 
              borderRadius: '8px',
              marginTop: isExecuting && currentStep > 0 ? '40px' : '0',
              transition: 'margin-top 0.3s ease'
            }}
            title="Target Application"
          />
        </Paper>
      </Box>
      
      <Box sx={{ flex: 1, p: 1 }}>
        <Paper sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesome sx={{ color: 'primary.main', mr: 1.5, fontSize: 20 }} />
              <Typography variant="h6" sx={{ 
                color: 'text.primary', 
                fontWeight: 500,
                fontFamily: '"Inter", "Roboto", sans-serif'
              }}>
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
            <Box sx={{ mb: 2, p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CircularProgress size={16} sx={{ mr: 2, color: 'primary.main' }} />
                <Typography sx={{ 
                  fontWeight: 500, 
                  color: 'text.primary',
                  fontSize: '0.95rem'
                }}>
                  Processing Request
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                fontSize: '0.85rem'
              }}>
                {loadingMessage || 'Initializing processing...'}
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 1.5, 
                  height: 3, 
                  borderRadius: 2,
                  bgcolor: '#e2e8f0'
                }} 
              />
            </Box>
          )}

          {isExecuting && (
            <Box sx={{ mb: 2, p: 2.5, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CircularProgress size={16} sx={{ color: 'primary.main', mr: 2 }} />
                <Typography sx={{ 
                  fontWeight: 500, 
                  color: 'text.primary',
                  fontSize: '0.95rem'
                }}>
                  Step {currentStep} of {scriptActions.length}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(currentStep / scriptActions.length) * 100} 
                sx={{ 
                  height: 4, 
                  borderRadius: 2,
                  bgcolor: '#e0f2fe'
                }}
              />
              {scriptActions[currentStep - 1] && (
                <Typography variant="body2" sx={{ 
                  mt: 1.5, 
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}>
                  {scriptActions[currentStep - 1].action.toUpperCase()}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ 
              color: 'text.primary', 
              fontWeight: 500,
              fontSize: '1.1rem'
            }}>
              Execution Logs ({logs.length})
            </Typography>
          </Box>
          
          <List sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            bgcolor: '#fafbfc', 
            borderRadius: 2, 
            p: 1,
            border: '1px solid #e1e5e9',
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
                    bgcolor: isCurrentStep ? '#f0f9ff' : 'white', 
                    mb: 0.5, 
                    borderRadius: 2,
                    border: isCurrentStep ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
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
                        fontWeight: isCurrentStep ? 500 : 400,
                        fontSize: '0.9rem'
                      },
                      '& .MuiListItemText-secondary': {
                        fontSize: '0.8rem',
                        fontFamily: 'monospace'
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