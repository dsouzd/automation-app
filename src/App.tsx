import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Runner } from './pages/Runner';
import { Summary } from './pages/Summary';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16f98fff',
      light: '#75fb3cff',
      dark: '#d0ea0cff',
    },
    secondary: {
      main: '#fff7ed',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navigation />
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/runner" element={<Runner />} />
              <Route path="/summary" element={<Summary />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;