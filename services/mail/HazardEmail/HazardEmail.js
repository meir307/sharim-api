const fs = require('fs');
const path = require('path');
const BaseMail = require('../baseMail');
const { encodeHebrewFilename } = require('../../../utils/helpers');

class HazardEmail extends BaseMail {
  constructor(hazard, baseUrl, recipient) {
    const subject = '׳“׳™׳•׳•׳— ׳¢׳ ׳׳₪׳’׳¢ ׳‘׳˜׳™׳—׳•׳×׳™';
    super(recipient, subject, '');
    this.hazard = hazard;
    this.baseUrl = baseUrl;
  }

  async send() {
    // Load the HTML template
    const templatePath = path.join(__dirname, 'HazardEmail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Format severity
    const severityMap = {
      1: '׳ ׳׳•׳›׳”',
      2: '׳‘׳™׳ ׳•׳ ׳™׳×',
      3: '׳’׳‘׳•׳”׳”',
      4: '׳§׳¨׳™׳˜׳™׳×'
    };
    const severityText = severityMap[this.hazard.severity] || `׳¨׳׳” ${this.hazard.severity || '׳׳ ׳¦׳•׳™׳'}`;

    // Format date
    const createdAt = this.hazard.createdAt ? new Date(this.hazard.createdAt).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '׳׳ ׳¦׳•׳™׳';

  
    // Replace placeholders
    template = template.replace(/{{title}}/g, this.hazard.title || '׳׳׳ ׳›׳•׳×׳¨׳×');
    template = template.replace(/{{severity}}/g, severityText);
    template = template.replace(/{{description}}/g, this.hazard.description || '׳׳׳ ׳×׳™׳׳•׳¨');
    template = template.replace(/{{areaName}}/g, this.hazard.areaName || '׳׳ ׳¦׳•׳™׳');
    template = template.replace(/{{createdBy}}/g, this.hazard.createdBy || '׳׳ ׳¦׳•׳™׳');
    template = template.replace(/{{createdAt}}/g, createdAt);
    template = template.replace(/{{imageLink}}/g, this.hazard.fileName );

    this.body = template;

    // Call the parent send method
    return await super.send();
  }
}

module.exports = HazardEmail;


