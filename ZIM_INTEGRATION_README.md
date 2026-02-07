# ZIM Integration Implementation

## Overview

This implementation adds runtime ZIM file processing to Urban-Offline, enabling users to import Wikipedia, StackOverflow, and other ZIM archives for offline use with the RAG pipeline.

## Architecture

### Components

| Component | Purpose | File |
|-----------|---------|------|
| **ZimReader** | Pure JavaScript ZIM file parser | `src/services/zim/ZimReader.js` |
| **ZimImportManager** | UI for drag-drop ZIM import | `src/components/ZimImportManager.jsx` |
| **importZimFile()** | ContentPackManager method | `src/services/contentPacks/ContentPackManager.js` |

### How It Works

```
User drops ZIM file
        ↓
ZimImportManager (UI)
        ↓
ContentPackManager.importZimFile()
        ↓
ZimReader parses ZIM header & articles
        ↓
Articles → HTML → Plain Text → Chunks
        ↓
IndexedDB (zim_content store)
        ↓
SearchService.index()
        ↓
Available in RAG pipeline!
```

## Features

### ✅ Implemented

1. **Pure JavaScript ZIM Reading**
   - No WASM required for basic functionality
   - Supports ZIM format versions 5.x and 6.x
   - Handles uncompressed and zlib-compressed clusters

2. **Drag & Drop Import UI**
   - Drag-drop or file picker
   - Real-time progress tracking
   - Import statistics and error reporting

3. **Content Processing Pipeline**
   - HTML → Plain text extraction
   - Wikipedia metadata cleaning (edit sections, references)
   - Automatic redirect following
   - Skip stubs and short articles

4. **RAG Integration**
   - Articles stored in IndexedDB
   - SearchService indexing
   - Available to RAGPipeline for queries

5. **Pack Management**
   - ZIM imports appear in pack list
   - Uninstall/remove functionality
   - Storage tracking

### 🚧 Future Enhancements

1. **Compression Support**
   - LZMA/XZ decompression (via WASM)
   - Zstandard decompression (via WASM)
   - Currently throws error for compressed clusters

2. **Full-Text Search**
   - Integrate `javascript-libzim` WASM for Xapian indices
   - Better search ranking using ZIM's built-in indices

3. **Performance**
   - Streaming/chunked reading for large ZIMs
   - Web Worker processing
   - Progress persistence

## Usage

### Import a ZIM File

```javascript
import { ContentPackManager } from './services/contentPacks/ContentPackManager';

// Import with progress tracking
const result = await ContentPackManager.importZimFile(file, (percent, message) => {
  console.log(`${percent}%: ${message}`);
});

if (result.success) {
  console.log(`Imported ${result.stats.importedArticles} articles`);
}
```

### Use in RAG Pipeline

```javascript
import { RAGPipeline } from './services/ai/RAGPipeline';

// ZIM articles are automatically available
const response = await RAGPipeline.query('What is CPR?');
// Response may include content from imported ZIM files
```

### List ZIM Imports

```javascript
const zimImports = await ContentPackManager.getZimImports();
```

### Uninstall ZIM Import

```javascript
await ContentPackManager.uninstallZimImport(packId);
```

## Supported ZIM Files

Tested with:
- Wikipedia (small dumps)
- WikiProject Medicine
- Stack Overflow (small tags)
- TED Talks

Limitations:
- Files >4GB may have issues (64-bit offset handling)
- LZMA/XZ compressed ZIMs not yet supported
- Very large ZIMs may cause memory issues

## Testing

### Sample ZIM Files

Download test ZIMs from:
- https://library.kiwix.org (Official Kiwix library)
- https://download.kiwix.org/zim/ (Direct downloads)

Recommended test files:
- `wikipedia_en_medicine_mini.zim` (~50MB)
- `wikipedia_en_cpr.zim` (~10MB)
- `ted_en_global_issues.zim` (~100MB)

### Manual Test

1. Go to Settings or Dataset Manager
2. Drag a .zim file onto the upload area
3. Wait for processing (progress shown)
4. Check that articles appear in search
5. Test RAG queries on imported content

## File Structure

```
src/
├── services/
│   ├── zim/
│   │   ├── ZimReader.js      # Core ZIM parsing
│   │   └── index.js          # Exports
│   └── contentPacks/
│       ├── ContentPackManager.js  # importZimFile() method
│       └── ContentPackSchema.js   # ZIM_IMPORT category
├── components/
│   └── ZimImportManager.jsx  # UI component
└── styles/
    └── components.css        # ZIM import styles
```

## API Reference

### ZimReader

```javascript
const reader = new ZimReader(file);
await reader.init();

// Get stats
const stats = reader.getStats();
// { fileName, fileSize, articleCount, clusterCount, version }

// Iterate articles
for await (const article of reader.iterateArticles({
  onlyHTML: true,
  skipRedirects: true,
  onProgress: (info) => console.log(info.percent + '%')
})) {
  const content = await article.getContent();
  const plainText = await article.getPlainText();
}

// Search by title prefix
const results = await reader.searchByPrefix('First aid', 10);
```

### ZimArticle

```javascript
{
  title: 'Article Title',
  url: 'Article_URL',
  namespace: 'A',
  mimeType: 'text/html',
  isRedirect: false,
  isHTML: true,
  
  // Methods
  async getContent(): string,     // HTML content
  async getPlainText(): string,   // Plain text
  id: 'zim-A-Article_URL'        // Unique ID
}
```

## Technical Details

### ZIM Format Support

| Feature | Status | Notes |
|---------|--------|-------|
| ZIM v5.x | ✅ | Full support |
| ZIM v6.x | ✅ | Full support |
| Uncompressed | ✅ | Native support |
| Zlib | ✅ | Via DecompressionStream |
| LZMA/XZ | 🚧 | Requires WASM |
| Zstandard | 🚧 | Requires WASM |
| Full-text index | 🚧 | Requires javascript-libzim |
| Xapian search | 🚧 | Requires javascript-libzim |

### Storage Schema

ZIM articles stored in `zim_content` IndexedDB store:

```javascript
{
  id: 'zim-import-123-456',
  slug: 'Article_URL',
  title: 'Article Title',
  content: 'Plain text content...',
  fullText: 'Plain text content...',
  html: '<html>...',
  category: 'zim-import',
  zimPath: 'Article_URL',
  zimNamespace: 'A',
  mimeType: 'text/html',
  source: 'zim-import',
  importedAt: '2024-01-...',
  packId: 'zim-import-123'
}
```

### Pack Metadata

```javascript
{
  id: 'zim-import-123',
  name: 'wikipedia_en_cpr',
  description: 'Imported ZIM archive: 150 articles, 15 MB',
  category: 'zim-import',
  version: '1.0.0',
  size: 15728640,
  sizeDisplay: '15 MB',
  articleCount: 150,
  errorCount: 0,
  installedAt: '2024-01-...',
  metadata: {
    source: 'ZIM Import',
    license: 'Unknown',
    attribution: 'Content from wikipedia_en_cpr.zim',
    zimVersion: '6.0',
    mimeTypes: 42
  },
  isZimImport: true
}
```

## Dependencies

### Runtime
- None! Pure JavaScript implementation

### Optional (Phase 2)
- `javascript-libzim` WASM for full-text search
- `xzdec-wasm` for LZMA decompression
- `zstddec-wasm` for Zstandard decompression

## License Notes

ZIM reading implementation adapted from Kiwix-JS (GPL v3). This component is compatible with GPL requirements for derivative works.

## Troubleshooting

### "Invalid ZIM file: wrong magic number"
- File is not a valid ZIM file
- File may be corrupted or truncated

### "LZMA/XZ compression not yet implemented"
- ZIM uses LZMA compression
- Wait for Phase 2 WASM implementation
- Try downloading uncompressed ZIM from Kiwix

### "Zstandard compression not yet implemented"
- ZIM uses Zstandard compression
- Wait for Phase 2 WASM implementation

### Import is slow
- Large ZIM files take time to process
- Each article is cleaned, chunked, and indexed
- Progress is shown every 100 articles

### Memory errors
- Very large ZIMs (>500MB) may cause issues
- Try smaller ZIM files
- Future: streaming implementation planned

## Development

### Add ZIM to RAG

ZIM articles are automatically available in RAG queries through the existing SearchService integration.

### Customize Article Processing

Edit `ContentPackManager._cleanHtml()` and `_extractPlainText()`:

```javascript
_cleanHtml(html) {
  // Add custom cleaning rules
  return html
    .replace(/custom-pattern/g, '')
    // ... existing rules
}
```

### Debug ZIM Reading

```javascript
const reader = new ZimReader(file);
await reader.init();
console.log(reader.getStats());

// Test single article
const article = await reader.getArticleByIndex(0);
console.log(article);
console.log(await article.getContent());
```

## Roadmap

### Phase 1 ✅ (Current)
- Basic ZIM reading (pure JS)
- Drag-drop UI
- RAG integration

### Phase 2 🚧 (Next)
- WASM decompression (LZMA, Zstandard)
- Full-text search via javascript-libzim
- Web Worker processing

### Phase 3 📋 (Future)
- Streaming for large ZIMs
- Progress persistence
- Metadata extraction (license, source)
- ZIM download from Kiwix catalog
