import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Home } from './pages/Home';
import { Runner } from './pages/Runner';
import { Summary } from './pages/Summary';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#800000', // Maroon color
      light: '#a33333',
      dark: '#4d0000',
    },
    secondary: {
      main: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/runner" element={<Runner />} />
          <Route path="/summary" element={<Summary />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;