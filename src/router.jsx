import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import { dataManager } from './services/dataManager';
import { articleService } from './services/articleService';

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
const DevDashboard = lazy(() => import('./components/clawdBot/DevDashboard'));

// Loaders
const homeLoader = async () => {
    try {
        const regions = await dataManager.getInstalledRegions();
        return {
            status: regions.length > 0 ? 'prepared' : 'not-prepared',
            activeRegion: regions[0] || null
        };
    } catch (error) {
        return { status: 'not-prepared', activeRegion: null, error };
    }
};

const articleLoader = async ({ params }) => {
    try {
        const article = await articleService.getArticleBySlug(params.slug);
        if (!article) throw new Error('Article not found');
        return article;
    } catch (error) {
        throw error;
    }
};

import SkeletonPage from './components/SkeletonPage';

// Loading Wrapper
const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={<SkeletonPage />}>
        {children}
    </Suspense>
);

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
                path: "dev",
                element: <SuspenseWrapper><DevDashboard /></SuspenseWrapper>
            }
        ]
    }
]);
