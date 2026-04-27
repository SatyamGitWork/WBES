import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { AppRouter } from './router';
import { DesktopGate } from './components/layout/DesktopGate';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DesktopGate>
          <div className="min-h-screen bg-background">
            <AppRouter />
          </div>
        </DesktopGate>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
