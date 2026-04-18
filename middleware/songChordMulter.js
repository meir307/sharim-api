const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true)
});

module.exports = upload.fields([
  { name: 'cordsFile', maxCount: 1 },
  { name: 'chordsFile', maxCount: 1 }
]);
