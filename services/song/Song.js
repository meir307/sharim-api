const path = require('path');
const CRUD = require('../../dal/CRUD');
const SqlParams = require('../../dal/SqlParams');
const dbConfig = require('../../config/db');

class Song {
  /** Relative disk root for chord files: uploads/songs-cords/<userId>/<fileName> */
  static UPLOAD_BASE = path.join('uploads', 'songs-cords');

  static uploadPathForUser(userId) {
    return path.join(Song.UPLOAD_BASE, String(userId));
  }

  constructor() {
    this.crud = new CRUD(dbConfig.connectionString);
    this.message = '';
  }

  _parseJsonMaybe(value) {
    if (value == null) return null;
    if (typeof value === 'object' && !Buffer.isBuffer(value)) return { ...value };
    if (typeof value === 'string') {
      try {
        const o = JSON.parse(value);
        return typeof o === 'object' && o !== null && !Array.isArray(o) ? { ...o } : { data: o };
      } catch {
        return {};
      }
    }
    return {};
  }

  _mergeCords(existingRowCords, payloadCords, cordsFileName) {
    let out = this._parseJsonMaybe(existingRowCords) || {};
    if (payloadCords !== undefined) {
      const p = this._parseJsonMaybe(payloadCords);
      if (p && Object.keys(p).length) out = { ...out, ...p };
    }
    if (cordsFileName) out.cordsFile = cordsFileName;
    return Object.keys(out).length ? out : null;
  }

  _coalesceInt(val, fallback) {
    if (val === undefined) return fallback;
    if (val === null || val === '') return null;
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
  }

  _rowName(payload, existingName) {
    const raw = payload.name ?? payload.title ?? existingName ?? '';
    return String(raw).trim().slice(0, 45);
  }

  _rowLink(payload, existingLink) {
    const raw = payload.link ?? payload.url ?? existingLink ?? '';
    return String(raw).trim().slice(0, 145);
  }

  async upsert(userId, songPayload, cordsFileName) {
    const rawId = songPayload.id;
    const existingId =
      rawId != null && rawId !== '' ? Number(rawId) : NaN;
    const isValidId =
      !Number.isNaN(existingId) && existingId > 0;

    try {
      if (isValidId) {
        const rows = await this.crud.executeQueryWithParams(
          'SELECT id, userId, name, link, artist, category, cords FROM songs WHERE id = ? AND userId = ?',
          [
            new SqlParams('id', existingId),
            new SqlParams('userId', userId)
          ]
        );
        if (!rows.length) {
          this.message = 'שיר לא נמצא';
          return { ok: false };
        }
        const row = rows[0];
        const name = this._rowName(songPayload, row.name);
        if (!name) {
          this.message = 'שם שיר נדרש';
          return { ok: false };
        }
        const link = this._rowLink(songPayload, row.link);
        const artist = this._coalesceInt(
          songPayload.artist ?? songPayload.artistId,
          row.artist
        );
        const category = this._coalesceInt(
          songPayload.category ?? songPayload.categoryId,
          row.category
        );
        const cords = this._mergeCords(row.cords, songPayload.cords, cordsFileName);

        await this.crud.executeNonQueryWithParams(
          'UPDATE songs SET name = ?, link = ?, artist = ?, category = ?, cords = ? WHERE id = ? AND userId = ?',
          [
            new SqlParams('name', name),
            new SqlParams('link', link),
            new SqlParams('artist', artist),
            new SqlParams('category', category),
            new SqlParams('cords', cords == null ? null : JSON.stringify(cords)),
            new SqlParams('id', existingId),
            new SqlParams('userId', userId)
          ]
        );

        const song = {
          id: existingId,
          userId,
          name,
          link,
          artist,
          category,
          cords
        };
        return { ok: true, song };
      }

      const name = this._rowName(songPayload, null);
      if (!name) {
        this.message = 'שם שיר נדרש';
        return { ok: false };
      }
      const link = this._rowLink(songPayload, '');
      const artist = this._coalesceInt(
        songPayload.artist ?? songPayload.artistId,
        null
      );
      const category = this._coalesceInt(
        songPayload.category ?? songPayload.categoryId,
        null
      );
      const cords = this._mergeCords(null, songPayload.cords, cordsFileName);

      await this.crud.executeNonQueryWithParams(
        'INSERT INTO songs (userId, name, link, artist, category, cords) VALUES (?, ?, ?, ?, ?, ?)',
        [
          new SqlParams('userId', userId),
          new SqlParams('name', name),
          new SqlParams('link', link),
          new SqlParams('artist', artist),
          new SqlParams('category', category),
          new SqlParams('cords', cords == null ? null : JSON.stringify(cords))
        ]
      );

      const newId = this.crud.lastInsertedId;
      const song = {
        id: newId,
        userId,
        name,
        link,
        artist,
        category,
        cords
      };
      return { ok: true, song };
    } catch (error) {
      console.error('Song.upsert:', error);
      this.message = 'שגיאה בשמירת השיר';
      return { ok: false };
    }
  }

  _mapSongRow(row) {
    let cords = null;
    if (row.cords != null) {
      if (typeof row.cords === 'object' && !Buffer.isBuffer(row.cords)) {
        cords = { ...row.cords };
      } else {
        cords = this._parseJsonMaybe(row.cords);
      }
    }
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      link: row.link,
      artist: row.artist,
      category: row.category,
      cords
    };
  }

  async listByUserId(userId) {
    const rows = await this.crud.executeQueryWithParams(
      `SELECT id, userId, name, link, artist, category, cords
       FROM songs WHERE userId = ? ORDER BY name`,
      [new SqlParams('userId', userId)]
    );
    return rows.map((r) => this._mapSongRow(r));
  }
}

module.exports = Song;
