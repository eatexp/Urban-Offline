/* eslint-disable react-refresh/only-export-components -- Router config + RouteWrapper component must coexist */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import { RouteErrorBoundary } from './components/shared/RouteErrorBoundary';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Lazy Components
const Guides = lazy(() => import('./pages/Guides'));
const Map = lazy(() => import('./pages/Map'));
const Resources = lazy(() => import('./pages/Resources'));
const Library = lazy(() => import('./pages/Library'));
const ArticleView = lazy(() => import('./pages/ArticleView'));
const ContentBrowser = lazy(() => import('./pages/ContentBrowser'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Health = lazy(() => import('./pages/Health'));
const TriagePage = lazy(() => import('./pages/TriagePage'));
const Survival = lazy(() => import('./pages/Survival'));
const Law = lazy(() => import('./pages/Law'));
const ProtocolPage = lazy(() => import('./pages/ProtocolPage'));
const AIModels = lazy(() => import('./pages/AIModels'));
const Grokopedia = lazy(() => import('./pages/Grokopedia'));
const GrokopediaArticle = lazy(() => import('./pages/GrokopediaArticle'));
const DevDashboard = lazy(() => import('./components/features/clawdBot/DevDashboard'));

// Loaders
import { homeLoader, articleLoader } from './loaders';

import SuspenseWrapper from './components/layout/SuspenseWrapper';

/**
 * Wrapper component that combines SuspenseWrapper with ErrorBoundary
 * for consistent error handling across all routes
 */
const RouteWrapper = ({ children }) => (
    <ErrorBoundary>
        <SuspenseWrapper>{children}</SuspenseWrapper>
    </ErrorBoundary>
);

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                index: true,
                element: <Home />,
                loader: homeLoader,
            },
            {
                path: "guides",
                element: <Navigate to="/survival" replace />
            },
            {
                path: "map",
                element: <RouteWrapper><Map /></RouteWrapper>
            },
            {
                path: "library",
                element: <RouteWrapper><Library /></RouteWrapper>
            },
            {
                path: "resources",
                element: <Navigate to="/library" replace />
            },
            {
                path: "browse",
                element: <RouteWrapper><ContentBrowser /></RouteWrapper>
            },
            {
                path: "ai",
                element: <RouteWrapper><AIChat /></RouteWrapper>
            },
            {
                path: "ai-models",
                element: <RouteWrapper><AIModels /></RouteWrapper>
            },
            {
                path: "article/:slug",
                element: <RouteWrapper><ArticleView /></RouteWrapper>,
                loader: articleLoader
            },
            {
                path: "health",
                element: <RouteWrapper><Health /></RouteWrapper>
            },
            {
                path: "triage/*",
                element: <RouteWrapper><TriagePage /></RouteWrapper>
            },
            {
                path: "survival",
                element: <RouteWrapper><Survival /></RouteWrapper>
            },
            {
                path: "law",
                element: <RouteWrapper><Law /></RouteWrapper>
            },
            {
                path: "protocol/:scenarioId",
                element: <RouteWrapper><ProtocolPage /></RouteWrapper>
            },
            {
                path: "grokopedia",
                element: <RouteWrapper><Grokopedia /></RouteWrapper>
            },
            {
                path: "grokopedia/article/:articleId",
                element: <RouteWrapper><GrokopediaArticle /></RouteWrapper>
            },
            {
                path: "dev",
                element: <RouteWrapper><DevDashboard /></RouteWrapper>
            }
        ]
    }
]);
