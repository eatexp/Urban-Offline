/**
 * Component Index - Centralized exports for all components
 * 
 * Updated to reflect modular features/layout/shared structure.
 */

// UI & Layout
export { default as Layout } from './layout/Layout';
export { default as Navbar } from './layout/Navbar';
export { default as Search } from './layout/Search';
export { default as SuspenseWrapper } from './layout/SuspenseWrapper';

// Shared / Infrastructure
export { default as AskAIChip } from './shared/AskAIChip';
export { default as CategoryGrid } from './shared/CategoryGrid';
export { default as DatasetActivityIndicator } from './shared/DatasetActivityIndicator';
export { default as EmptyState } from './shared/EmptyState';
export { default as ErrorBoundary } from './shared/ErrorBoundary';
export { default as MLStatusIndicator } from './shared/MLStatusIndicator';
export { default as OfflineIndicator } from './shared/OfflineIndicator';
export { default as RouteErrorBoundary } from './shared/RouteErrorBoundary';
export { default as SkeletonPage } from './shared/SkeletonPage';
export { default as StatusBars } from './shared/StatusBars';
export { default as ProUnlockBanner } from './shared/ProUnlockBanner';

// Emergency Features
export { default as EmergencyCommandBar } from './features/emergency/EmergencyCommandBar';
export { default as EmergencyQuickAccess } from './features/emergency/EmergencyQuickAccess';
export { default as HighStakesDeleteModal } from './features/emergency/HighStakesDeleteModal';
export { default as ProtocolButton } from './features/emergency/ProtocolButton';
export { default as ProtocolView } from './features/emergency/ProtocolView';
export { default as TriageScreen } from './features/emergency/TriageScreen';

// AI Features
export { default as Cartridge } from './features/ai/Cartridge';
export { default as CitationChip } from './features/ai/CitationChip';
export { default as Composer } from './features/ai/Composer';
export { default as ContextSettings } from './features/ai/ContextSettings';
export { default as DatasetManager } from './features/ai/DatasetManager';
export { default as MessageBubble } from './features/ai/MessageBubble';
export { default as MessageThread } from './features/ai/MessageThread';
export { default as SourcePreviewSheet } from './features/ai/SourcePreviewSheet';
export { default as SourceViewer } from './features/ai/SourceViewer';
export { default as DatasetAIBridge } from './features/bridge/DatasetAIBridge';

// Marketplace & Models
export { default as ModelCard } from './features/marketplace/ModelCard';
export { default as ModelCardEnhanced } from './features/marketplace/ModelCardEnhanced';
export { default as ModelImportDialog } from './features/marketplace/ModelImportDialog';
export { default as ModelMarketplaceEnhanced } from './features/marketplace/ModelMarketplaceEnhanced';
export { default as ModelPicker } from './features/marketplace/ModelPicker';

// Grokopedia
export { default as GrokopediaClean } from './features/grokopedia/GrokopediaClean';
export { default as GrokopediaEnhanced } from './features/grokopedia/GrokopediaEnhanced';
export { default as GrokopediaPremium } from './features/grokopedia/GrokopediaPremium';

// Library
export { default as DownloadCard } from './features/library/DownloadCard';
export { default as StorageBar } from './features/library/StorageBar';
export { default as ZimImportManager } from './features/library/ZimImportManager';
export { default as ZimImportManagerEnhanced } from './features/library/ZimImportManagerEnhanced';

// Map
export { default as MapComponent } from './features/map/MapComponent';
export { default as OfflineMap } from './features/map/OfflineMap';
export { default as OfflineTileLayer } from './features/map/OfflineTileLayer';

// ClawdBot
export { default as ClawdBotFAB } from './features/clawdBot/ClawdBotFAB';
export { default as DevDashboard } from './features/clawdBot/DevDashboard';