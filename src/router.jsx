import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';

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
const DevDashboard = lazy(() => import('./components/clawdBot/DevDashboard'));

// Loaders
import { homeLoader, articleLoader } from './loaders';

import SuspenseWrapper from './components/SuspenseWrapper';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
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
                element: <SuspenseWrapper><Map /></SuspenseWrapper>
            },
            {
                path: "library",
                element: <SuspenseWrapper><Library /></SuspenseWrapper>
            },
            {
                path: "resources",
                element: <Navigate to="/library" replace />
            },
            {
                path: "browse",
                element: <SuspenseWrapper><ContentBrowser /></SuspenseWrapper>
            },
            {
                path: "ai",
                element: <SuspenseWrapper><AIChat /></SuspenseWrapper>
            },
            {
                path: "ai-models",
                element: <SuspenseWrapper><AIModels /></SuspenseWrapper>
            },
            {
                path: "article/:slug",
                element: <SuspenseWrapper><ArticleView /></SuspenseWrapper>,
                loader: articleLoader
            },
            {
                path: "health",
                element: <SuspenseWrapper><Health /></SuspenseWrapper>
            },
            {
                path: "triage/*",
                element: <SuspenseWrapper><TriagePage /></SuspenseWrapper>
            },
            {
                path: "survival",
                element: <SuspenseWrapper><Survival /></SuspenseWrapper>
            },
            {
                path: "law",
                element: <SuspenseWrapper><Law /></SuspenseWrapper>
            },
            {
                path: "protocol/:scenarioId",
                element: <SuspenseWrapper><ProtocolPage /></SuspenseWrapper>
            },
            {
                path: "grokopedia",
                element: <SuspenseWrapper><Grokopedia /></SuspenseWrapper>
            },
            {
                path: "grokopedia/article/:articleId",
                element: <SuspenseWrapper><GrokopediaArticle /></SuspenseWrapper>
            },
            {
                path: "dev",
                element: <SuspenseWrapper><DevDashboard /></SuspenseWrapper>
            }
        ]
    }
]);
