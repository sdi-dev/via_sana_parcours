import '@fontsource-variable/oswald';
import '@fontsource-variable/libre-baskerville';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '@auth/AuthContext';
import App from '@/App';
import { themeInitial } from '@/theme';
import '@/index.css';

document.documentElement.dataset.theme = themeInitial();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);