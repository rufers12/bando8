import {createRoot} from 'react-dom/client';
import {defineTheme, Theme} from '@astryxdesign/core/theme';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import App from './App';

const theme = defineTheme({
  name: 'bando',
  tokens: {
    '--color-background-surface': ['oklch(99% 0.009 90)', 'oklch(99% 0.009 90)'],
  },
});

createRoot(document.getElementById('root')!).render(<Theme theme={theme} mode="light"><App /></Theme>);
