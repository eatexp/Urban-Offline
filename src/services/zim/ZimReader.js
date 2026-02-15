/**
 * ZimReader - Pure JavaScript ZIM file reader
 * 
 * Adapted from Kiwix-JS (https://github.com/kiwix/kiwix-js)
 * Licensed under GPL v3
 * 
 * Reads ZIM files using pure JavaScript with WASM decompression for XZ/Zstandard
 */

import { createLogger } from '../../utils/logger';

import { ZSTDDecoder } from 'zstddec';
import { XzReadableStream } from 'xz-decompress';

const log = createLogger('ZimReader');

// ZSTD decoder instance (lazy initialized)
let zstdDecoder = null;

/**
 * Initialize ZSTD decoder
 */
/**
 * Initialize ZSTD decoder
 */
async function getZstdDecoder() {
  if (!zstdDecoder) {
    zstdDecoder = new ZSTDDecoder();

    // Attempt to load from public/wasm first to avoid CSP issues with inlined WASM
    try {
      const response = await fetch('/wasm/zstddec.wasm');
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.compile(buffer);
        await zstdDecoder.init(module);
        log.info('Loaded zstddec.wasm from external file');
        return zstdDecoder;
      }
    } catch (e) {
      log.warn('Failed to load external zstddec.wasm, falling back to inline', e);
    }

    await zstdDecoder.init();
  }
  return zstdDecoder;
}

// Compression types
const COMPRESSION_NONE = 0;
const COMPRESSION_ZLIB = 1;
const COMPRESSION_LZMA = 3;
const COMPRESSION_ZSTD = 5;

// MIME type patterns for HTML content
const HTML_MIME_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'application/html'
];

/**
 * ZIM Archive reader class
 */
export class ZimReader {
  constructor(file) {
    this.file = file;
    this.arrayBuffer = null;
    this.view = null;
    this.metadata = null;
    this.ready = false;
    this.mimeTypeList = [];
    this.urlPtrList = null;
    this.titlePtrList = null;
    this.clusterPtrList = null;
    this.articleCount = 0;

    // XZ module instance
    this.xzModule = null;
  }

  /**
   * Get XZ module instance
   */
  async _getXzModule() {
    if (this.xzModule) return this.xzModule;

    // Try to load external WASM
    try {
      const response = await fetch('/wasm/xz-decompress.wasm');
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.instantiate(buffer);
        this.xzModule = module.instance;
        log.info('Loaded xz-decompress.wasm from external file');
        return this.xzModule;
      }
    } catch (e) {
      log.warn('Failed to load external xz-decompress.wasm', e);
    }
    return null;
  }

  /**
   * Check if device can handle the ZIM metadata (indices)
   * @returns {{allowed: boolean, overheadEstimates: object, reason: string|null}}
   */
  _checkMemoryConstraints() {
    // Estimate index overhead:
    // - URL Ptrs: 8 bytes * articleCount
    // - Title Ptrs: 4 bytes * articleCount
    // - Cluster Ptrs: 8 bytes * clusterCount
    // - MIME List: Negligible
    // - Overhead factor: 1.5x

    // We can't know exact counts before parsing header, but we can estimate from file size if we assume average article size.
    // Or we just allow it and fail if allocation fails during init.
    // For now, we perform a much looser check than before, since we don't load the whole file.

    const fileSizeMB = this.file.size / (1024 * 1024);

    // If file is > 50GB, maybe we warn? But 2GB is definitely fine now.
    return {
      allowed: true,
      fileSize: fileSizeMB,
      reason: null
    };
  }

  /**
   * Read a chunk of the file as an ArrayBuffer
   * @param {number} offset 
   * @param {number} length 
   */
  async _readChunk(offset, length) {
    const blob = this.file.slice(offset, offset + length);
    return await blob.arrayBuffer();
  }

  /**
   * Read a chunk and return a DataView
   * @param {number} offset 
   * @param {number} length 
   */
  async _readView(offset, length) {
    const buffer = await this._readChunk(offset, length);
    return new DataView(buffer);
  }

  /**
   * Initialize the ZIM archive
   */
  async init() {
    try {
      log.info(`Loading ZIM file: ${this.file.name} (${this.formatBytes(this.file.size)})`);

      // NO full file load!
      // this.arrayBuffer = await this.file.arrayBuffer(); // REMOVED
      // this.view = new DataView(this.arrayBuffer); // REMOVED

      // Parse ZIM header
      await this._parseHeader();

      // Parse URL pointer list
      await this._parseUrlPtrList();

      // Parse title pointer list
      await this._parseTitlePtrList();

      // Parse cluster pointer list
      await this._parseClusterPtrList();

      // Parse MIME type list
      await this._parseMimeTypeList();

      this.ready = true;
      log.info(`ZIM archive loaded: ${this.articleCount} articles`);

      return true;
    } catch (error) {
      log.error('Failed to initialize ZIM archive', error);
      throw new Error(`Failed to load ZIM file: ${error.message}`);
    }
  }

  /**
   * Parse ZIM file header
   */
  async _parseHeader() {
    // Read first 100 bytes (header is usually ~80-100 bytes)
    const view = await this._readView(0, 100);

    // ZIM header format (little-endian):
    // Offset  Size  Field
    // 0       4     Magic number (0x44, 0x49, 0x4D, 0x5A = "ZIMD")
    // ...
    // 84      8     Checksum position

    const magic = view.getUint32(0, true);
    if (magic !== 0x5A494D44) {
      throw new Error('Invalid ZIM file: wrong magic number');
    }

    // Helper for 64-bit read from view
    const readU64 = (v, off) => {
      const low = v.getUint32(off, true);
      const high = v.getUint32(off + 4, true);
      return BigInt(low) | (BigInt(high) << BigInt(32));
    };

    this.metadata = {
      majorVersion: view.getUint32(4, true),
      minorVersion: view.getUint32(8, true),
      articleCount: readU64(view, 28),
      clusterCount: readU64(view, 36),
      urlPtrPos: readU64(view, 44),
      titlePtrPos: readU64(view, 52),
      clusterPtrPos: readU64(view, 60),
      mimeListPos: readU64(view, 68),
      mainPage: view.getUint32(76, true),
      layoutPage: view.getUint32(80, true),
      checksumPos: readU64(view, 84)
    };

    this.articleCount = Number(this.metadata.articleCount);

    log.debug('ZIM header parsed', {
      version: `${this.metadata.majorVersion}.${this.metadata.minorVersion}`,
      articles: this.metadata.articleCount,
      clusters: this.metadata.clusterCount
    });
  }

  /**
   * Parse MIME type list
   */
  async _parseMimeTypeList() {
    const pos = Number(this.metadata.mimeListPos);

    // Read a reasonable chunk for MIME types (e.g. 1KB)
    // MIME lists are usually very small
    const chunk = await this._readChunk(pos, 1024);
    const view = new DataView(chunk);

    let offset = 0;
    const mimeTypes = [];

    while (offset < view.byteLength) {
      // Find null terminator
      let end = offset;
      while (end < view.byteLength && view.getUint8(end) !== 0) end++;

      if (end >= view.byteLength) break; // Should not happen in valid file if chunk is big enough

      const strBytes = new Uint8Array(chunk, offset, end - offset);
      if (strBytes.length === 0) break; // Double null = end

      const str = new TextDecoder().decode(strBytes);
      mimeTypes.push(str);
      offset = end + 1;
    }

    this.mimeTypeList = mimeTypes;
    log.debug(`Parsed ${mimeTypes.length} MIME types`);
  }

  async _parseUrlPtrList() {
    const pos = Number(this.metadata.urlPtrPos);
    const count = Number(this.metadata.articleCount);
    // 8 bytes per entry
    const size = count * 8;
    const buffer = await this._readChunk(pos, size);
    this.urlPtrList = new BigUint64Array(buffer);
  }

  async _parseTitlePtrList() {
    const pos = Number(this.metadata.titlePtrPos);
    const count = Number(this.metadata.articleCount);
    // 4 bytes per entry
    const size = count * 4;
    const buffer = await this._readChunk(pos, size);
    this.titlePtrList = new Uint32Array(buffer);
  }

  async _parseClusterPtrList() {
    const pos = Number(this.metadata.clusterPtrPos);
    const count = Number(this.metadata.clusterCount);
    // 8 bytes per entry
    const size = count * 8;
    const buffer = await this._readChunk(pos, size);
    this.clusterPtrList = new BigUint64Array(buffer);
  }

  /**
   * Get article by index
   * @param {number} index - Article index
   * @returns {ZimArticle|null}
   */
  async getArticleByIndex(index) {
    if (!this.ready) throw new Error('ZIM archive not initialized');
    if (index < 0 || index >= this.articleCount) return null;

    try {
      const entryPtr = this.urlPtrList[index];
      return await this._parseDirectoryEntry(Number(entryPtr));
    } catch (error) {
      log.warn(`Failed to read article at index ${index}`, error);
      return null;
    }
  }

  /**
   * Get article by title
   * @param {string} title - Article title
   * @returns {ZimArticle|null}
   */
  async getArticleByTitle(title) {
    if (!this.ready) throw new Error('ZIM archive not initialized');

    // Binary search through title pointer list
    // This is simplified - full implementation would need proper collation
    const normalizedTitle = title.toLowerCase();

    for (let i = 0; i < this.articleCount; i++) {
      const article = await this.getArticleByIndex(this.titlePtrList[i]);
      if (article && article.title.toLowerCase() === normalizedTitle) {
        return article;
      }
    }

    return null;
  }

  /**
   * Search articles by title prefix
   * @param {string} prefix - Title prefix
   * @param {number} maxResults - Maximum results
   * @returns {ZimArticle[]}
   */
  async searchByPrefix(prefix, maxResults = 20) {
    if (!this.ready) throw new Error('ZIM archive not initialized');

    const results = [];
    const normalizedPrefix = prefix.toLowerCase();

    for (let i = 0; i < this.articleCount && results.length < maxResults; i++) {
      const article = await this.getArticleByIndex(this.titlePtrList[i]);
      if (article && article.title.toLowerCase().startsWith(normalizedPrefix)) {
        results.push(article);
      }
    }

    return results;
  }

  /**
   * Iterate through all articles
   * @yields {ZimArticle}
   */
  async *iterateArticles(options = {}) {
    if (!this.ready) throw new Error('ZIM archive not initialized');

    const {
      onlyHTML = true,
      skipRedirects = true,
      onProgress = null
    } = options;

    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < this.articleCount; i++) {
      const article = await this.getArticleByIndex(i);

      if (!article) continue;

      // Skip redirects if requested
      if (skipRedirects && article.isRedirect) continue;

      // Filter by MIME type if requested
      if (onlyHTML && !article.isHTML) continue;

      yield article;

      processed++;

      // Report progress
      if (onProgress && processed % batchSize === 0) {
        onProgress({
          processed,
          total: this.articleCount,
          percent: Math.round((i / this.articleCount) * 100)
        });
      }
    }

    if (onProgress) {
      onProgress({
        processed,
        total: this.articleCount,
        percent: 100
      });
    }
  }

  /**
   * Parse a directory entry at the given offset
   * @param {number} offset - Entry offset
   * @returns {ZimArticle}
   */
  async _parseDirectoryEntry(offset) {
    // Read a 2KB chunk - sufficient for most directory entries
    // (MIME + params + namespace + revision + URL + Title)
    const chunk = await this._readChunk(offset, 2048);
    const view = new DataView(chunk);

    // Directory entry format:
    // Offset  Size  Field
    // 0       2     MIME type number
    // 2       1     Parameter length (always 0 in modern ZIMs)
    // 3       1     Namespace
    // 4       4     Revision (0 = current)
    // 8       varies  URL (null-terminated)
    // varies  varies  Title (null-terminated, optional)
    // varies  varies  Cluster index (4 bytes, for content entries)
    // varies  varies  Blob index (4 bytes, for content entries)

    let pos = 0; // Relative to chunk

    const mimeTypeNum = view.getUint16(pos, true);
    pos += 2;

    const _parameterLen = view.getUint8(pos);
    pos += 1;

    const namespace = String.fromCharCode(view.getUint8(pos));
    pos += 1;

    const revision = view.getUint32(pos, true);
    pos += 4;

    // Helper to read string from local view
    const readString = (p) => {
      let end = p;
      while (end < view.byteLength && view.getUint8(end) !== 0) end++;
      if (end >= view.byteLength) throw new Error('Directory entry exceeds chunk size');
      const bytes = new Uint8Array(chunk, p, end - p);
      return {
        str: new TextDecoder().decode(bytes),
        len: bytes.length + 1 // +1 for null
      };
    };

    // Read URL (null-terminated)
    const urlData = readString(pos);
    const url = urlData.str;
    pos += urlData.len;

    // Read title (null-terminated, may be empty)
    const titleData = readString(pos);
    let title = titleData.str;
    pos += titleData.len;

    // If title is empty, use URL as title
    if (!title) {
      title = url.replace(/_/g, ' ');
    }

    const isRedirect = mimeTypeNum === 0xFFFF;
    const mimeType = isRedirect ? 'redirect' : (this.mimeTypeList[mimeTypeNum] || 'application/octet-stream');

    let clusterIndex = null;
    let blobIndex = null;
    let redirectIndex = null;

    if (isRedirect) {
      // Redirect entry: 4 bytes redirect index
      redirectIndex = view.getUint32(pos, true);
    } else {
      // Content entry: 4 bytes cluster index + 4 bytes blob index
      clusterIndex = view.getUint32(pos, true);
      pos += 4;
      blobIndex = view.getUint32(pos, true);
    }

    return new ZimArticle({
      index: offset,
      title,
      url,
      namespace,
      mimeType,
      isRedirect,
      redirectIndex,
      clusterIndex,
      blobIndex,
      revision,
      zimReader: this
    });
  }

  /**
   * Get blob content from a cluster
   * @param {number} clusterIndex - Cluster index
   * @param {number} blobIndex - Blob index within cluster
   * @returns {Uint8Array}
   */
  async _getBlob(clusterIndex, blobIndex) {
    if (clusterIndex >= this.metadata.clusterCount) {
      throw new Error(`Invalid cluster index: ${clusterIndex}`);
    }

    // Get cluster offset
    const clusterOffset = Number(this.clusterPtrList[clusterIndex]);

    // Read cluster header (compression byte)
    // For efficiency, let's read the first 8 bytes (enough for compression type + first offset)
    const headerChunk = await this._readView(clusterOffset, 8);
    const compressionType = headerChunk.getUint8(0);

    // Read blob offsets
    const blobOffsets = await this._readBlobOffsets(clusterOffset, compressionType);

    if (blobIndex >= blobOffsets.length - 1) {
      throw new Error(`Invalid blob index: ${blobIndex}`);
    }

    const startOffset = blobOffsets[blobIndex];
    const endOffset = blobOffsets[blobIndex + 1];
    const blobSize = endOffset - startOffset;

    // Get blob data
    const dataOffset = this._getDataOffset(clusterOffset, compressionType, blobOffsets.length);
    const blobStart = dataOffset + startOffset;

    // Read ONLY the compressed blob data we need
    const compressedData = new Uint8Array(await this._readChunk(blobStart, blobSize));

    // Decompress if necessary
    return await this._decompressBlob(compressedData, compressionType);
  }

  /**
   * Read blob offsets from cluster
   */
  async _readBlobOffsets(clusterOffset, compressionType) {
    const headerSize = compressionType === COMPRESSION_ZSTD ? 1 : 4;
    const offsetPos = clusterOffset + headerSize;

    // Read first offset to know how many blobs
    const firstOffsetView = await this._readView(offsetPos, 4);
    const firstOffset = firstOffsetView.getUint32(0, true);
    const numBlobs = (firstOffset - headerSize) / 4;

    // Read all offsets
    const offsetsSize = (numBlobs + 1) * 4;
    const offsetsView = await this._readView(offsetPos, offsetsSize);

    const offsets = [];
    for (let i = 0; i <= numBlobs; i++) {
      offsets.push(offsetsView.getUint32(i * 4, true));
    }

    return offsets;
  }

  /**
   * Get data offset within cluster
   */
  _getDataOffset(clusterOffset, compressionType, numOffsets) {
    const headerSize = compressionType === COMPRESSION_ZSTD ? 1 : 4;
    return clusterOffset + headerSize + numOffsets * 4;
  }

  /**
   * Decompress blob data
   */
  async _decompressBlob(data, compressionType) {
    switch (compressionType) {
      case COMPRESSION_NONE:
        return data;

      case COMPRESSION_ZSTD:
        // =============================================================================
        // VERIFIED: [P2][Performance] ZSTANDARD_COMPRESSION_IMPLEMENTATION
        // Implementation: Integrated zstddec library for Zstandard decompression.
        //   - Uses lazy-initialized WASM decoder
        //   - Supports modern ZIM files with zstd compression (type 5)
        //   - Enables access to more offline content sources
        // Priority: P2 | Effort: M (2-3 hours) | Impact: High (content availability)
        // =============================================================================
        try {
          const decoder = await getZstdDecoder(); // Ensure decoder is initialized
          const decompressed = decoder.decode(data);
          return new Uint8Array(decompressed);
        } catch (error) {
          log.error('Zstandard decompression failed', error);
          throw new Error(`Failed to decompress Zstandard data: ${error.message}`);
        }

      case COMPRESSION_LZMA:
        // =============================================================================
        // VERIFIED: [P2][Performance] LZMA_XZ_COMPRESSION_IMPLEMENTATION
        // Implementation: Integrated xz-decompress for LZMA/XZ decompression in browser.
        //   - Uses WASM-based XzReadableStream
        //   - Supports legacy ZIM files with LZMA compression (type 3)
        //   - Maintains compatibility with older ZIM content sources
        // Priority: P3 | Effort: M (2-3 hours) | Impact: Medium
        // =============================================================================
        try {
          // Attempt to preload custom WASM module to avoid data: URI issues
          const customXzModule = await this._getXzModule();
          if (customXzModule) {
            // Inject the custom module instance into the XzReadableStream static property
            // This relies on the internal implementation detail of xz-decompress
            if (!XzReadableStream._moduleInstance) {
              XzReadableStream._moduleInstance = customXzModule;
              log.debug('Injected custom XZ WASM module into XzReadableStream');
            }
          }

          // Create a stream from the compressed data
          const stream = new Response(data).body;
          // Pipe through XZ decompressor
          const decompressedStream = new XzReadableStream(stream);
          // Read result back into buffer
          return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
        } catch (error) {
          log.error('LZMA decompression failed', error);
          throw new Error(`Failed to decompress LZMA data: ${error.message}`);
        }

      case COMPRESSION_ZLIB:
        // Use browser's DecompressionStream
        return await this._decompressZlib(data);

      default:
        throw new Error(`Unsupported compression type: ${compressionType}`);
    }
  }

  /**
   * Decompress zlib data using DecompressionStream
   */
  async _decompressZlib(data) {
    try {
      const stream = new Response(data).body;
      const decompressed = stream.pipeThrough(new DecompressionStream('deflate'));
      return new Uint8Array(await new Response(decompressed).arrayBuffer());
    } catch (error) {
      // Fallback: try deflate-raw
      try {
        const stream = new Response(data).body;
        const decompressed = stream.pipeThrough(new DecompressionStream('deflate-raw'));
        return new Uint8Array(await new Response(decompressed).arrayBuffer());
      } catch (_fallbackError) {
        throw new Error(`Failed to decompress zlib data: ${error.message}`);
      }
    }
  }

  /**
   * Format bytes to human-readable string
   */

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get archive statistics
   */
  getStats() {
    if (!this.ready) return null;

    return {
      fileName: this.file.name,
      fileSize: this.file.size,
      fileSizeFormatted: this.formatBytes(this.file.size),
      articleCount: this.articleCount,
      clusterCount: Number(this.metadata.clusterCount),
      version: `${this.metadata.majorVersion}.${this.metadata.minorVersion}`,
      mimeTypes: this.mimeTypeList.length
    };
  }
}

/**
 * ZIM Article class
 */
export class ZimArticle {
  constructor({
    index,
    title,
    url,
    namespace,
    mimeType,
    isRedirect,
    redirectIndex,
    clusterIndex,
    blobIndex,
    revision,
    zimReader
  }) {
    this.index = index;
    this.title = title;
    this.url = url;
    this.namespace = namespace;
    this.mimeType = mimeType;
    this.isRedirect = isRedirect;
    this.redirectIndex = redirectIndex;
    this.clusterIndex = clusterIndex;
    this.blobIndex = blobIndex;
    this.revision = revision;
    this._zimReader = zimReader;
    this._content = null;
  }

  /**
   * Check if article is HTML content
   */
  get isHTML() {
    return HTML_MIME_TYPES.some(type => this.mimeType.includes(type));
  }

  /**
   * Get article content as text
   */
  async getContent() {
    if (this._content !== null) return this._content;

    if (this.isRedirect) {
      // Follow redirect
      const redirectArticle = await this._zimReader.getArticleByIndex(this.redirectIndex);
      if (redirectArticle) {
        this._content = await redirectArticle.getContent();
        return this._content;
      }
      return null;
    }

    if (this.clusterIndex === null || this.blobIndex === null) {
      return null;
    }

    try {
      const blob = await this._zimReader._getBlob(this.clusterIndex, this.blobIndex);
      this._content = new TextDecoder().decode(blob);
      return this._content;
    } catch (error) {
      log.warn(`Failed to read content for "${this.title}": ${error.message}`);
      return null;
    }
  }

  /**
   * Get article content as Semantic Markdown via The Refinery.
   * Preserves structure (headers, lists, emphasis, tables) while
   * stripping boilerplate — optimized for LLM context windows.
   *
   * @param {Object} [options] — Options passed to refine()
   * @param {number} [options.tokenBudget=800] — Max tokens in output
   * @returns {Promise<{ markdown: string, meta: Object }>}
   */
  async getMarkdown(options = {}) {
    const html = await this.getContent();
    if (!html) return { markdown: '', meta: {} };
    const { refine } = await import('../refinery/Refinery.js');
    return refine(html, options);
  }

  /**
   * Get article content as plain text (stripped HTML)
   */
  async getPlainText() {
    const html = await this.getContent();
    if (!html) return '';

    // Simple HTML to text conversion
    // In production, use a proper HTML parser
    return html
      .replace(/<[^>]+>/g, ' ')  // Remove tags
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .trim();
  }

  /**
   * Get unique ID for this article
   */
  get id() {
    return `zim-${this.namespace}-${this.url}`;
  }
}

export default ZimReader;
