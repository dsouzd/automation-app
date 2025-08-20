import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '../store/useStore';
import { getSummaryAPI, SummaryResponse } from '../services/api';

export const Summary: React.FC = () => {
  const navigate = useNavigate();
  const { logs, clearLogs } = useStore();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getSummaryAPI(logs);
        setSummary(response);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [logs]);

  const successCount = logs.filter(log => log.result === 'success').length;
  const failedCount = logs.filter(log => log.result === 'failed').length;

  const chartData = [
    { name: 'Success', value: successCount, color: '#4caf50' },
    { name: 'Failed', value: failedCount, color: '#800000' }
  ];

  const handleNewTest = () => {
    clearLogs();
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          color: 'primary.main', 
          fontWeight: 'bold',
          textAlign: 'center',
          mb: 4
        }}
      >
        Execution Summary
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Results Overview
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Card sx={{ height: '100%', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Statistics
              </Typography>
              {summary && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Total Steps: {summary.summary.totalSteps}</Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#4caf50' }}>Successful: {summary.summary.successCount}</Typography>
                  <Typography variant="h6" sx={{ mb: 2, color: '#800000' }}>Failed: {summary.summary.failedCount}</Typography>
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>Execution Time: {summary.summary.executionTime}s</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Detailed Logs
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Step</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Selector</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{log.step}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{log.selector}</TableCell>
                    <TableCell>{log.value || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.result} 
                        color={log.result === 'success' ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell>{log.timestamp.toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleNewTest}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          New Test
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/runner')}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': { 
              borderColor: 'primary.dark',
              bgcolor: 'primary.light',
              color: 'white'
            }
          }}
        >
          Run Again
        </Button>
      </Box>
    </Container>
  );
};