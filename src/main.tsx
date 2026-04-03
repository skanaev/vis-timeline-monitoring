import { LIGHT_THEME } from '@admiral-ds/react-ui';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { App } from './app/App';
import './app/styles/global.css';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={LIGHT_THEME}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
