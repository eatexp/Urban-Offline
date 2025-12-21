import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';

// Lazy load non-critical pages for better initial load performance
const Guides = lazy(() => import('./pages/Guides'));
const Map = lazy(() => import('./pages/Map'));
const Resources = lazy(() => import('./pages/Resources'));
const ArticleView = lazy(() => import('./pages/ArticleView'));
const ContentBrowser = lazy(() => import('./pages/ContentBrowser'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Health = lazy(() => import('./pages/Health'));
const TriagePage = lazy(() => import('./pages/TriagePage'));
const Survival = lazy(() => import('./pages/Survival'));
const Law = lazy(() => import('./pages/Law'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="guides" element={
              <Suspense fallback={<PageLoader />}>
                <Guides />
              </Suspense>
            } />
            <Route path="map" element={
              <Suspense fallback={<PageLoader />}>
                <Map />
              </Suspense>
            } />
            <Route path="resources" element={
              <Suspense fallback={<PageLoader />}>
                <Resources />
              </Suspense>
            } />
            <Route path="browse" element={
              <Suspense fallback={<PageLoader />}>
                <ContentBrowser />
              </Suspense>
            } />
            <Route path="ai" element={
              <Suspense fallback={<PageLoader />}>
                <AIChat />
              </Suspense>
            } />

            <Route path="article/:slug" element={
              <Suspense fallback={<PageLoader />}>
                <ArticleView />
              </Suspense>
            } />
            <Route path="health" element={
              <Suspense fallback={<PageLoader />}>
                <Health />
              </Suspense>
            } />
            <Route path="triage/:storyId" element={
              <Suspense fallback={<PageLoader />}>
                <TriagePage />
              </Suspense>
            } />
            <Route path="survival" element={
              <Suspense fallback={<PageLoader />}>
                <Survival />
              </Suspense>
            } />
            <Route path="law" element={
              <Suspense fallback={<PageLoader />}>
                <Law />
              </Suspense>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
