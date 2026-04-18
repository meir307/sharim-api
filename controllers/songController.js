const BaseController = require('./baseControler');
const Upload = require('../utils/upload');
const Song = require('../services/song/Song');

function pickChordMultipartFile(req) {
  if (req.file) return req.file;
  const f = req.files;
  if (!f) return null;
  return (f.cordsFile && f.cordsFile[0]) || (f.chordsFile && f.chordsFile[0]) || null;
}

class SongController extends BaseController {
  async fetchSongs(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const song = new Song();
      const songs = await song.listByUserId(u.id);
      return res.status(200).json({ success: true, songs });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async upsert(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const raw = req.body;
      if (raw === undefined || raw === null || raw === '') {
        return res.status(400).json({ success: false, message: 'נתוני שיר נדרשים' });
      }

      let songPayload;
      try {
        songPayload = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return res.status(400).json({ success: false, message: 'פורמט שיר לא תקין' });
      }

      let cordsFileName = null;
      const uploaded = pickChordMultipartFile(req);
      if (uploaded) {
        if (!uploaded.buffer || !uploaded.buffer.length) {
          return res.status(400).json({
            success: false,
            message:
              'קובץ האקורדים ריק או לא נקרא. ודאו שמוסיפים קובץ עם שם (למשל formData.append(\"cordsFile\", file, file.name))'
          });
        }
        const originalName =
          (uploaded.originalname && String(uploaded.originalname).trim()) ||
          'cords.dat';
        const uploadPath = Song.uploadPathForUser(u.id);
        const saved = await Upload.saveFile({
          fileBuffer: uploaded.buffer,
          originalName,
          uploadPath,
          keepOriginalName: true
        });
        if (!saved.success) {
          return res.status(500).json({
            success: false,
            message: saved.error || 'תקלה בשמירת קובץ האקורדים'
          });
        }
        cordsFileName = saved.filename;
      }

      const song = new Song();
      const result = await song.upsert(u.id, songPayload, cordsFileName);
      if (!result.ok) {
        return res.status(result.message === 'שיר לא נמצא' ? 404 : 500).json({
          success: false,
          message: song.message || 'תקלה בשמירת השיר'
        });
      }

      return res.status(200).json({ success: true, song: result.song });
    } catch (err) {
      this.handleError(res, err);
    }
  }
}

module.exports = new SongController();
