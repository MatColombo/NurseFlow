import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@app/App';
import '@shared/styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemento root di NurseFlow assente.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
