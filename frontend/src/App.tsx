import { App as AntdApp } from 'antd';
import AppRouter from './router/AppRouter';
import ThemeProvider from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ThemeProvider>
  );
}

export default App;
