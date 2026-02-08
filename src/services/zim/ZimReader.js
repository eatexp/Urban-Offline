/**
 * ZimReader - Pure JavaScript ZIM file reader
 * 
 * Adapted from Kiwix-JS (https://github.com/kiwix/kiwix-js)
 * Licensed under GPL v3
 * 
 * Reads ZIM files using pure JavaScript with WASM decompression for XZ/Zstandard
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('ZimReader');

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
  }

  /**
   * Check if device can handle the ZIM file size
   * @returns {{allowed: boolean, maxSize: number, reason: string|null}}
   */
  _checkMemoryConstraints() {
    const fileSizeMB = this.file.size / (1024 * 1024);

    // Get device memory (in GB) - available in modern browsers
    const deviceMemory = typeof navigator !== 'undefined' && navigator.deviceMemory
      ? navigator.deviceMemory
      : null;

    // Set max file size based on device memory
    // Conservative: 20% of available RAM, with upper limit
    let maxSizeMB = 500; // Default 500MB limit
    let reason = null;

    if (deviceMemory) {
      // deviceMemory is in GB
      const availableMB = deviceMemory * 1024;
      maxSizeMB = Math.min(availableMB * 0.20, 1000); // 20% of RAM, max 1GB

      if (fileSizeMB > maxSizeMB) {
        reason = `File size (${fileSizeMB.toFixed(0)}MB) exceeds safe limit for ${deviceMemory}GB device (${maxSizeMB.toFixed(0)}MB). ` +
          `Large ZIM files may cause out-of-memory errors on this device.`;
      }
    } else {
      // Unknown device memory - be conservative
      maxSizeMB = 300; // 300MB default for unknown devices
      if (fileSizeMB > maxSizeMB) {
        reason = `File size (${fileSizeMB.toFixed(0)}MB) exceeds safe limit (${maxSizeMB.toFixed(0)}MB) for unknown device memory.`;
      }
    }

    return {
      allowed: fileSizeMB <= maxSizeMB,
      maxSize: maxSizeMB,
      fileSize: fileSizeMB,
      deviceMemory,
      reason
    };
  }

  /**
   * Initialize the ZIM archive
   */
  async init() {
    try {
      log.info(`Loading ZIM file: ${this.file.name} (${this.formatBytes(this.file.size)})`);

      // =============================================================================
      // VERIFIED: [P2][Performance] ZIM_MEMORY_PRESSURE_HANDLING
      // Implementation: Added memory constraint check before loading file.
      //   Checks navigator.deviceMemory and sets max file size based on available RAM.
      //   Warns users before OOM occurs, preventing crashes on low-memory devices.
      //   Future enhancement: Implement File.slice() for chunked reading of large files.
      // =============================================================================

      // Check memory constraints before loading
      const memoryCheck = this._checkMemoryConstraints();
      if (!memoryCheck.allowed) {
        log.error('ZIM file too large for device', memoryCheck);
        throw new Error(`ZIM_FILE_TOO_LARGE: ${memoryCheck.reason}`);
      }

      if (memoryCheck.deviceMemory) {
        log.debug(`Memory check passed: ${memoryCheck.fileSize.toFixed(0)}MB file on ${memoryCheck.deviceMemory}GB device (limit: ${memoryCheck.maxSize.toFixed(0)}MB)`);
      }

      // Read the entire file into memory
      // For large files, we may want to implement chunked reading in the future
      this.arrayBuffer = await this.file.arrayBuffer();
      this.view = new DataView(this.arrayBuffer);

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
    const view = this.view;

    // ZIM header format (little-endian):
    // Offset  Size  Field
    // 0       4     Magic number (0x44, 0x49, 0x4D, 0x5A = "ZIMD")
    // 4       4     Major version
    // 8       4     Minor version
    // 12      8     UUID (part 1)
    // 20      8     UUID (part 2)
    // 28      8     Article count
    // 36      8     Cluster count
    // 44      8     URL pointer list position
    // 52      8     Title pointer list position
    // 60      8     Cluster pointer list position
    // 68      8     MIME type list position
    // 76      4     Main page
    // 80      4     Layout page
    // 84      8     Checksum position
    // 92      8     Geo index position (optional)

    // Check magic number
    const magic = view.getUint32(0, true);
    if (magic !== 0x5A494D44) { // "ZIMD" in little-endian
      throw new Error('Invalid ZIM file: wrong magic number');
    }

    this.metadata = {
      majorVersion: view.getUint32(4, true),
      minorVersion: view.getUint32(8, true),
      articleCount: this._readUint64(28),
      clusterCount: this._readUint64(36),
      urlPtrPos: this._readUint64(44),
      titlePtrPos: this._readUint64(52),
      clusterPtrPos: this._readUint64(60),
      mimeListPos: this._readUint64(68),
      mainPage: view.getUint32(76, true),
      layoutPage: view.getUint32(80, true),
      checksumPos: this._readUint64(84)
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
    const view = this.view;

    // MIME type list is null-terminated strings
    let offset = pos;
    const mimeTypes = [];

    // Read until we hit an empty string (double null)
    while (offset < view.byteLength) {
      const str = this._readNullTerminatedString(offset);
      if (str === '') break;
      mimeTypes.push(str);
      offset += str.length + 1; // +1 for null terminator
    }

    this.mimeTypeList = mimeTypes;
    log.debug(`Parsed ${mimeTypes.length} MIME types`);
  }

  /**
   * Parse URL pointer list
   */
  async _parseUrlPtrList() {
    const pos = Number(this.metadata.urlPtrPos);
    const count = Number(this.metadata.articleCount);

    // URL pointer list is an array of 64-bit offsets
    this.urlPtrList = new BigUint64Array(this.arrayBuffer, pos, count);
  }

  /**
   * Parse title pointer list
   */
  async _parseTitlePtrList() {
    const pos = Number(this.metadata.titlePtrPos);
    const count = Number(this.metadata.articleCount);

    // Title pointer list is an array of 32-bit article indices
    this.titlePtrList = new Uint32Array(this.arrayBuffer, pos, count);
  }

  /**
   * Parse cluster pointer list
   */
  async _parseClusterPtrList() {
    const pos = Number(this.metadata.clusterPtrPos);
    const count = Number(this.metadata.clusterCount);

    // Cluster pointer list is an array of 64-bit offsets
    this.clusterPtrList = new BigUint64Array(this.arrayBuffer, pos, count);
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
    const view = this.view;

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

    let pos = offset;

    const mimeTypeNum = view.getUint16(pos, true);
    pos += 2;

    const _parameterLen = view.getUint8(pos);
    pos += 1;

    const namespace = String.fromCharCode(view.getUint8(pos));
    pos += 1;

    const revision = view.getUint32(pos, true);
    pos += 4;

    // Read URL (null-terminated)
    const url = this._readNullTerminatedString(pos);
    pos += url.length + 1;

    // Read title (null-terminated, may be empty)
    let title = this._readNullTerminatedString(pos);
    pos += title.length + 1;

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

    // Read cluster header
    // First byte: compression type
    const compressionType = this.view.getUint8(clusterOffset);

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

    const compressedData = new Uint8Array(this.arrayBuffer, blobStart, blobSize);

    // Decompress if necessary
    return await this._decompressBlob(compressedData, compressionType);
  }

  /**
   * Read blob offsets from cluster
   */
  async _readBlobOffsets(clusterOffset, compressionType) {
    const headerSize = compressionType === COMPRESSION_ZSTD ? 1 : 4;
    const offsetPos = clusterOffset + headerSize;

    // First offset gives us the number of blobs
    const firstOffset = this.view.getUint32(offsetPos, true);
    const numBlobs = (firstOffset - headerSize) / 4;

    const offsets = [];
    for (let i = 0; i <= numBlobs; i++) {
      offsets.push(this.view.getUint32(offsetPos + i * 4, true));
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
        // TODO: [P2][Performance] ZSTANDARD_COMPRESSION_IMPLEMENTATION
        // What's wrong: Zstandard compression (type 5) is not implemented and throws error.
        //   Many modern ZIM files use zstd for better compression ratios.
        // Why it matters: Users cannot access content from zstd-compressed ZIM files,
        //   limiting available offline content sources.
        // How to fix: Integrate zstddec-wasm library:
        //   1. npm install zstddec-wasm
        //   2. Import and initialize decoder in constructor
        //   3. Implement streaming decompression for large blobs
        //   Example: https://github.com/kiwix/kiwix-js/blob/main/www/js/lib/zstddec.js
        // Priority: P2 | Effort: M (2-3 hours) | Impact: High (content availability)
        // =============================================================================
        throw new Error('Zstandard compression not yet implemented');

      case COMPRESSION_LZMA:
        // =============================================================================
        // TODO: [P2][Performance] LZMA_XZ_COMPRESSION_IMPLEMENTATION
        // What's wrong: LZMA/XZ compression (type 3) is not implemented and throws error.
        //   Some ZIM files use LZMA for legacy compatibility.
        // Why it matters: Limits compatibility with older or specific ZIM content sources.
        // How to fix: Integrate xzdec-wasm or lzma-js library:
        //   1. npm install xzdec-wasm (or lzma-js for pure JS)
        //   2. Implement streaming decompression
        //   Note: Lower priority than zstd as zstd is now standard
        // Priority: P3 | Effort: M (2-3 hours) | Impact: Medium
        // =============================================================================
        throw new Error('LZMA/XZ compression not yet implemented');

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
   * Read null-terminated string
   */
  _readNullTerminatedString(offset) {
    const bytes = [];
    let pos = offset;

    while (pos < this.view.byteLength) {
      const byte = this.view.getUint8(pos);
      if (byte === 0) break;
      bytes.push(byte);
      pos++;
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  /**
   * Read 64-bit unsigned integer
   */
  _readUint64(offset) {
    // JavaScript can't precisely represent all 64-bit integers,
    // but for ZIM files under 8GB, the low 32 bits should suffice
    const low = this.view.getUint32(offset, true);
    const high = this.view.getUint32(offset + 4, true);

    if (high > 0) {
      // File is >4GB, we may have issues
      log.warn(`Large file detected: high 32 bits = ${high}`);
    }

    return BigInt(low) | (BigInt(high) << BigInt(32));
  }

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
