import { Toaster } from 'sonner';
import ThemeProvider from './contexts/ThemeContext';
import AppRouter from './router/AppRouter';
import { SidebarStylesInjector } from './styles/sidebar.styles';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <SidebarStylesInjector />
      <AppRouter />
      <Toaster position='top-right' richColors />
    </ThemeProvider>
  );
}

export default App;
