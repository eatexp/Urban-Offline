# Grokopedia Specification (V1.0)

## Overview
Grokopedia is a dedicated "Knowledge Base" view within Urban-Offline. While the AI Chat provides answers, Grokopedia allows users to directly browse, search, and read the offline content archives (ZIM files) like a traditional encyclopedia.

## Core Value
- **Trust**: Users can verify AI answers by reading source material directly.
- **Exploration**: Users can learn proactively without asking specific questions.
- **Accessibility**: Provides access to data even if the AI model fails or is disabled (e.g., extremely low battery).

## Feature Scope (V1.0)

### 1. Library View
- display list of installed Content Packs (ZIM files).
- Metadata: Name, Size, Date, Article Count.
- Status: Ready / Indexing / Corrupt.

### 2. Search Interface
- **Hybrid Search**: Instant title match + Full-text search (using existing `SearchService`).
- **Filters**: By Content Pack (e.g., "Medical Only").

### 3. Article Reader
- **Clean Reader View**: Distraction-free reading experience.
- **Native Styling**: Use app's CSS variables (Typography, Colors) instead of raw ZIM HTML styles where possible.
- **Images**: Support offline image loading from blob/ZIM.
- **Navigation**: Internal link support (intercept clicks to route within app).

## Technical Implementation
- **Route**: `/grokopedia`
- **Services**: Reuse `ZimService` and `SearchService`.
- **UI Components**:
    - `GrokLibrary`: List of packs.
    - `GrokSearch`: Search bar + results.
    - `GrokArticle`: Rendered article content (sanitize HTML, inject styles).

## Integration with AI
- **"Read Original"**: AI citations link directly to `GrokArticle` view.
- **"Explain This"**: Context menu in Article Reader to send text selection to AI Chat.
