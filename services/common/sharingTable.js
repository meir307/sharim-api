/**
 * In-memory table created empty when the server process starts.
 * Each row: { emitCode: string, link: string }
 */
const sharingTable = {
  rows: [],

  upsertRow(emitCode, link) {
    const code = String(emitCode || '').trim();
    if (!code) return;
    this.rows = this.rows.filter((r) => r.emitCode !== code);
    this.rows.push({ emitCode: code, link: String(link || '') });
  },

  removeByEmitCode(emitCode) {
    const code = String(emitCode || '').trim();
    if (!code) return;
    this.rows = this.rows.filter((r) => r.emitCode !== code);
  },

  /** @returns {{ emitCode: string, link: string } | null} */
  findByEmitCode(emitCode) {
    const code = String(emitCode || '').trim();
    if (!code) return null;
    const row = this.rows.find((r) => String(r.emitCode).trim() === code);
    return row || null;
  },

  /** @returns {boolean} true if a row for emitCode existed and link was updated */
  updateLink(emitCode, link) {
    const code = String(emitCode || '').trim();
    if (!code) return false;
    const row = this.rows.find((r) => String(r.emitCode).trim() === code);
    if (!row) return false;
    row.link = String(link != null ? link : '').trim();
    return true;
  }
};

module.exports = sharingTable;