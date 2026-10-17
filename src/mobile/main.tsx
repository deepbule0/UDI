import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../i18n';
import MobileApp from './MobileApp';
import './mobile.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><I18nProvider><MobileApp /></I18nProvider></React.StrictMode>);
