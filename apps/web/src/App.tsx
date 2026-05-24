import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useBootstrapAuth } from './hooks/useAuth';

export function App() {
  useBootstrapAuth();
  return <RouterProvider router={router} />;
}
