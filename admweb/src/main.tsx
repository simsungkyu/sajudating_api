// Entry point: Jotai + Apollo + shadcn/Tailwind; MUI ThemeProvider kept for pages not yet migrated.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './index.css';
import App from './App.tsx';
import { ApolloProvider } from '@apollo/client';
import { client } from './api/client.ts';

const muiTheme = createTheme({
  palette: {
    primary: { main: '#0ea5e9' },
    secondary: { main: '#f97316' },
    background: { default: '#f6f7fb' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['"Noto Sans KR"', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JotaiProvider>
      <ThemeProvider theme={muiTheme}>
        <ApolloProvider client={client}>
          <CssBaseline />
          <App />
        </ApolloProvider>
      </ThemeProvider>
    </JotaiProvider>
  </StrictMode>,
);
