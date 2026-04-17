const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { decodeHebrewFilename, filePrefixTimeStemp } = require('./helpers');

// Create multer instance for temporary storage
const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

// Upload utility class
class Upload {
  /**
   * Handle single file upload to temporary storage
   */
  static single(fieldName) {
    return tempUpload.single(fieldName);
  }

  /**
   * Handle multiple files upload to temporary storage
   */
  static array(fieldName, maxCount = 10) {
    return tempUpload.array(fieldName, maxCount);
  }

  /**
   * Save file with all parameters as object
   * @param {Object} options - All upload options
   * @param {Buffer} options.fileBuffer - File buffer from multer
   * @param {string} options.originalName - Original filename
   * @param {string} options.uploadPath - Path where to save the file
   * @param {string} options.customName - Custom filename (optional)
   * @param {string} options.prefix - Prefix for filename (optional)
   * @param {string} options.suffix - Suffix for filename (optional)
   * @param {boolean} options.keepOriginalName - Whether to keep original name with timestamp (default: true)
   * @param {boolean} options.keepExactName - Whether to keep exact original name without timestamp (default: false)
   * @returns {Object} File info
   */
  static async saveFile(options) {
    const {
      fileBuffer,
      originalName,
      uploadPath,
      customName = null,
      prefix = '',
      suffix = '',
      keepOriginalName = true,
      keepExactName = false
    } = options;

    try {
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Decode Hebrew filename for use in return value
      const decodedOriginalName = decodeHebrewFilename(originalName);
      
      let filename;
      if (keepExactName) {
        // Keep the exact original filename without any modifications
        filename = originalName;
      } else {
        // Check if this is a hazard file (uploadPath contains 'hazards')
        const isHazardFile = uploadPath && uploadPath.includes('hazards');
        
        if (isHazardFile) {
          // For hazard files: timestamp (with seconds) + 'hz' + original extension
          const now = new Date();
          const timestamp = filePrefixTimeStemp(now) + now.getSeconds().toString().padStart(2, '0');
          const fileExtension = path.extname(decodedOriginalName);
          filename = `${timestamp}hz${fileExtension}`;
        } else {
          // Generate filename with timestamp prefix
          const timestamp = filePrefixTimeStemp();
          filename = `${timestamp} - ${originalName}`;
        }
      }

      // Full file path
      const filePath = path.join(uploadPath, filename);
      
      // Write file
      fs.writeFileSync(filePath, fileBuffer);

      return {
        filename: filename,
        originalname: decodedOriginalName,
        path: filePath,
        size: fileBuffer.length,
        success: true
      };

    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if file exists
   * @param {string} filename - The filename to check
   * @param {string} uploadPath - The upload path where the file should be
   * @returns {boolean} Whether the file exists
   */
  static fileExists(filename, uploadPath) {
    try {
      const filePath = path.join(uploadPath, filename);
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
  }

  /**
   * Delete file
   * @param {Object} options - Delete options
   * @param {string} options.filePath - Full path to the file
   * @returns {boolean} Success status
   */
  static deleteFile(options) {
    const { filePath } = options;
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

module.exports = Upload; 