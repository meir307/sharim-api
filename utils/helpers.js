const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Helper function to decode Hebrew filenames that may be encoded incorrectly
 * @param {string} filename - The filename to decode
 * @returns {string} - The decoded filename
 */
function decodeHebrewFilename(filename) {
  try {
    // Try multiple decoding approaches
    let decoded = filename;
    
    // Try URL decoding
    if (filename.includes('%')) {
      decoded = decodeURIComponent(filename);
    }
    
    // Try Buffer decoding if still garbled (reverse the corruption)
    if (decoded.includes('×') || /[\uFFFD]/.test(decoded)) {
      const buffer = Buffer.from(filename, 'latin1');
      decoded = buffer.toString('utf8');
    }
    
    return decoded;
  } catch (e) {
    console.log('Could not decode filename:', e.message);
    return filename;
  }
}

/**
 * Helper function to fix corrupted Hebrew filenames
 * @param {string} filename - The corrupted filename
 * @returns {string} - The fixed filename
 */
function fixCorruptedHebrewFilename(filename) {
  try {
    // Return null/undefined as-is
    if (!filename || typeof filename !== 'string') {
      return filename;
    }
    
    // If the filename contains corruption markers, try to fix it
    if (filename.includes('×')) {
      const buffer = Buffer.from(filename, 'latin1');
      return buffer.toString('utf8');
    }
    return filename;
  } catch (e) {
    console.log('Could not fix corrupted filename:', e.message);
    return filename;
  }
}

/**
 * Helper function to encode Hebrew filenames for URLs
 * @param {string} filename - The filename to encode
 * @returns {string} - The URL-encoded filename
 */
function encodeHebrewFilename(filename) {
  try {
    // Split filename into name and extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension, encode the whole filename
      return encodeURIComponent(filename);
    }
    
    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);
    
    // Encode only the name part, keep extension as is
    return encodeURIComponent(name) + extension;
  } catch (e) {
    console.log('Could not encode filename:', e.message);
    return filename;
  }
}

/**
 * Helper function to create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Helper function to generate custom upload path
 * @param {Object} options - Options for path generation
 * @param {string} options.basePath - Base upload path
 * @param {string} options.fileType - Type of file (image, document, etc.)
 * @param {string} options.userId - User ID for user-specific folders
 * @param {boolean} options.useDateFolders - Whether to use date-based folders
 * @returns {string} - Generated upload path
 */
function generateUploadPath(options = {}) {
  const {
    basePath = 'uploads',
    fileType = null,
    userId = null,
    useDateFolders = false
  } = options;
  
  let uploadPath = basePath;
  
  // Add file type subdirectory
  if (fileType) {
    uploadPath = path.join(uploadPath, fileType);
  }
  
  // Add user-specific directory
  if (userId) {
    uploadPath = path.join(uploadPath, 'users', userId);
  }
  
  // Add date-based directory
  if (useDateFolders) {
    const today = new Date();
    const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    uploadPath = path.join(uploadPath, dateFolder);
  }
  
  // Ensure directory exists
  ensureDirectoryExists(uploadPath);
  
  return uploadPath;
}

/**
 * Helper function to generate custom filename
 * @param {Object} options - Options for filename generation
 * @param {string} options.originalName - Original filename
 * @param {string} options.prefix - Custom prefix
 * @param {string} options.suffix - Custom suffix
 * @param {boolean} options.keepOriginalName - Whether to keep original name
 * @param {string} options.customName - Custom name to use
 * @returns {string} - Generated filename
 */
function generateFilename(options = {}) {
  const {
    originalName,
    prefix = '',
    suffix = '',
    keepOriginalName = true,
    customName = null
  } = options;
  
  const decodedName = decodeHebrewFilename(originalName);
  const fileExtension = path.extname(decodedName);
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  
  let filename;
  
  if (customName) {
    // Use custom name
    filename = `${customName}-${timestamp}${fileExtension}`;
  } else if (keepOriginalName) {
    // Keep original name with timestamp
    const fileNameWithoutExt = path.basename(decodedName, fileExtension);
    filename = `${fileNameWithoutExt}-${timestamp}-${randomSuffix}${fileExtension}`;
  } else {
    // Use only timestamp
    filename = `file-${timestamp}-${randomSuffix}${fileExtension}`;
  }
  
  // Add prefix and suffix
  if (prefix) {
    filename = `${prefix}-${filename}`;
  }
  if (suffix) {
    const nameWithoutExt = path.basename(filename, fileExtension);
    filename = `${nameWithoutExt}-${suffix}${fileExtension}`;
  }
  
  return filename;
}

/**
 * Helper function to format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension (without dot)
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Helper function to validate file type
 * @param {string} mimetype - The file mimetype
 * @param {Array} allowedTypes - Array of allowed mimetypes
 * @returns {boolean} - Whether the file type is allowed
 */
function isValidFileType(mimetype, allowedTypes = []) {
  const defaultAllowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  const types = allowedTypes.length > 0 ? allowedTypes : defaultAllowedTypes;
  return types.includes(mimetype);
}

/**
 * Helper function to generate timestamp prefix for filenames in yyyyMMddhhmm format
 * @param {Date} date - Optional date object, defaults to current date
 * @returns {string} - Timestamp in yyyyMMddhhmm format
 */
function filePrefixTimeStemp(date = null) {
  const now = date || new Date();
  return now.getFullYear().toString() + 
         (now.getMonth() + 1).toString().padStart(2, '0') + 
         now.getDate().toString().padStart(2, '0') + 
         now.getHours().toString().padStart(2, '0') + 
         now.getMinutes().toString().padStart(2, '0');
}

/**
 * Random 6-digit string (000000–999999) for short codes such as emitCode.
 * @returns {string}
 */
function randomSixDigitString() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/**
 * Google Docs/Sheets/Slides "edit" URLs open the full app UI; `/preview` is better for guests (iframe/embed).
 * Non-Google URLs are returned unchanged.
 * @param {string} url
 * @returns {string}
 */
function toGuestDisplayLink(url) {
  if (url == null || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('docs.google.com')) return trimmed;

  try {
    const u = new URL(trimmed);
    if (!/^docs\.google\.com$/i.test(u.hostname)) return trimmed;
    if (!/\/(document|spreadsheets|presentation)\//i.test(u.pathname)) return trimmed;
    const nextPath = u.pathname.replace(/\/edit(?=\/|[?#]|$)/i, '/preview');
    if (nextPath === u.pathname) return trimmed;
    u.pathname = nextPath;
    return u.toString();
  } catch {
    return trimmed.replace(
      /(https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/[^/]+\/)edit(?=[?#]|$)/i,
      '$1preview'
    );
  }
}

module.exports = {
  decodeHebrewFilename,
  fixCorruptedHebrewFilename,
  encodeHebrewFilename,
  ensureDirectoryExists,
  generateUploadPath,
  generateFilename,
  formatFileSize,
  getFileExtension,
  isValidFileType,
  filePrefixTimeStemp,
  randomSixDigitString,
  toGuestDisplayLink
}; 