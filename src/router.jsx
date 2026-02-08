import { createBrowserRouter, Navigate, Link, useRouteError } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import { dataManager } from './services/dataManager';
import { articleService } from './services/articleService';
import { AlertTriangle, Home as HomeIcon, ArrowLeft } from 'lucide-react';

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
const Settings = lazy(() => import('./pages/Settings'));
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

// Route-level error boundary
const RouteErrorBoundary = () => {
    const error = useRouteError();
    const is404 = error?.status === 404 || error?.message?.includes('not found');

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in"
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
                <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
            </div>
            <h1
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
            >
                {is404 ? 'Page Not Found' : 'Something Went Wrong'}
            </h1>
            <p
                className="mb-6 max-w-md"
                style={{ color: 'var(--color-text-muted)' }}
            >
                {is404
                    ? "The page you're looking for doesn't exist or has been moved."
                    : 'An unexpected error occurred. Your downloaded content is safe.'
                }
            </p>
            <div className="flex gap-3">
                <Link
                    to="/"
                    className="btn btn-primary btn-md"
                >
                    <HomeIcon className="w-4 h-4" />
                    Go Home
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="btn btn-secondary btn-md"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
            </div>
        </div>
    );
};

// 404 page for catch-all route
const NotFound = () => (
    <div
        className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in"
    >
        <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
            <AlertTriangle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
        </div>
        <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
        >
            Page Not Found
        </h1>
        <p
            className="mb-6 max-w-md"
            style={{ color: 'var(--color-text-muted)' }}
        >
            The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
            to="/"
            className="btn btn-primary btn-md"
        >
            <HomeIcon className="w-4 h-4" />
            Go Home
        </Link>
    </div>
);

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <Layout><RouteErrorBoundary /></Layout>,
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
                loader: articleLoader,
                errorElement: <RouteErrorBoundary />
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
                path: "settings",
                element: <SuspenseWrapper><Settings /></SuspenseWrapper>
            },
            {
                path: "dev",
                element: <SuspenseWrapper><DevDashboard /></SuspenseWrapper>
            },
            {
                path: "*",
                element: <NotFound />
            }
        ]
    }
]);
