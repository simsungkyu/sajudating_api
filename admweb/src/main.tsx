import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { ApolloProvider } from '@apollo/client';
import { client } from './api/client.ts';

const theme = createTheme({
  palette: {
    primary: { main: '#0ea5e9' },
    secondary: { main: '#f97316' },
    background: {
      default: '#f6f7fb',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Noto Sans KR"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider>
      <ThemeProvider theme={theme}>
        <ApolloProvider client={client}>
          <CssBaseline />
          <App />
        </ApolloProvider>
      </ThemeProvider>
    </JotaiProvider>
  </StrictMode>,
);
