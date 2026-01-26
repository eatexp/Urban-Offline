import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { router } from './router';

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;


