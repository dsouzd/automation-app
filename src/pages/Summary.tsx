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
  CircularProgress,
  Paper,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Assessment, Refresh, Home } from '@mui/icons-material';
import { useStore } from '../store/useStore';
import { getSummaryAPI, SummaryResponse } from '../services/api';

export const Summary: React.FC = () => {
  const navigate = useNavigate();
  const { logs, clearLogs } = useStore();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getSummaryAPI(logs, setLoadingMessage);
        setSummary(response);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
        setLoadingMessage('');
      }
    };
    
    if (logs.length > 0) {
      fetchSummary();
    } else {
      setLoading(false);
    }
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Generating Summary Report</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {loadingMessage || 'Processing data...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (logs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom>No Execution Data</Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Run an automation test to see the summary report
          </Typography>
          <Button variant="contained" onClick={() => navigate('/runner')}>
            Start Automation
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ color: 'primary.main', mr: 1, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Execution Summary
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => navigate('/runner')}
          >
            New Test
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {logs.length}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total Steps
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {successCount}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Successful
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: failedCount > 0 ? 'error.main' : 'text.secondary', fontWeight: 'bold' }}>
                {failedCount}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                Results Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
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
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                Step Performance
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logs.map((log, index) => ({ step: `Step ${log.step}`, success: log.result === 'success' ? 1 : 0, failed: log.result === 'failed' ? 1 : 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success" fill="#4caf50" name="Success" />
                    <Bar dataKey="failed" fill="#f44336" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Execution Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Step</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Target</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{log.step}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.action.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {log.selector.split(',')[0]}
                    </TableCell>
                    <TableCell sx={{ fontStyle: log.value ? 'normal' : 'italic' }}>
                      {log.value || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={log.result} 
                        color={log.result === 'success' ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {log.timestamp.toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};