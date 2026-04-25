const BaseController = require('./baseControler');
const User = require('../services/user/User');
const sharingTable = require('../services/common/sharingTable');
const { toGuestDisplayLink } = require('../utils/helpers');

class SharingController extends BaseController {
  async requestSharing(req, res) {
    try {
      const raw = req.body && req.body.emitCode;
      const emitCode = raw != null ? String(raw).trim() : '';
      if (!emitCode) {
        const msg = 'קוד שידור נדרש';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const row = sharingTable.findByEmitCode(emitCode);
      if (!row) {
        const msg = 'קוד שיתוף לא נמצא או לא פעיל';
        return res.status(404).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      return res.status(200).json({
        success: true,
        link: toGuestDisplayLink(row.link),
        emitCode: row.emitCode
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /** Poll guest lyrics link by emitCode — same lookup as RequestSharing. */
  refreshLyrics(req, res) {
    return this.requestSharing(req, res);
  }

  async updateActiveLink(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const emitCode = (u.emitCode && String(u.emitCode).trim()) || '';
      if (!emitCode) {
        const msg = 'קוד שידור (emitCode) חסר למשתמש';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const raw = req.body && req.body.link;
      const link = raw != null ? String(raw).trim() : '';
      if (!link) {
        const msg = 'קישור נדרש';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const ok = sharingTable.updateLink(emitCode, link);
      if (!ok) {
        const msg = 'אין שידור פעיל לעדכן';
        return res.status(404).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      return res.status(200).json({ success: true, link: toGuestDisplayLink(link) });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async sharingAction(req, res) {
    try {
      const u = await this.validateSession(req, res);
      if (!u) return;

      const emitCode = (u.emitCode && String(u.emitCode).trim()) || '';
      if (!emitCode) {
        const msg = 'קוד שידור (emitCode) חסר למשתמש';
        return res.status(400).json({
          success: false,
          message: msg,
          errorMessage: msg
        });
      }

      const raw = req.body && req.body.startSharing;
      const startSharing =
        raw === true || raw === 'true' || raw === 1 || raw === '1';

      sharingTable.removeByEmitCode(emitCode);

      if (startSharing) {
        sharingTable.upsertRow(emitCode, 'xxxxxx');
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      this.handleError(res, err);
    }
  }
}

module.exports = new SharingController();
