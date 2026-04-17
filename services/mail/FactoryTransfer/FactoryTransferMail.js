const fs = require('fs');
const path = require('path');
const BaseMail = require('../baseMail');

class FactoryTransferMail extends BaseMail {
  constructor(factoryData, targetUser, previousOwnerName, baseUrl = null) {
    const subject = '׳”׳¢׳‘׳¨׳× ׳׳₪׳¢׳ - ׳”׳•׳“׳¢׳” ׳—׳©׳•׳‘׳”';
    super(targetUser.email, subject, '');
    this.factoryData = factoryData;
    this.targetUser = targetUser;
    this.previousOwnerName = previousOwnerName;
    this.baseUrl = baseUrl;
  }

  async send() {
    // Load the HTML template
    const templatePath = path.join(__dirname, 'FactoryTransferMail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Format transfer date
    const transferDate = new Date().toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Replace placeholders
    template = template.replace(/{{targetUserName}}/g, this.targetUser.fullName || '׳׳׳•׳ ׳” ׳™׳§׳¨/׳”');
    template = template.replace(/{{factoryName}}/g, this.factoryData.name || '׳”׳׳₪׳¢׳');
    template = template.replace(/{{factoryHetpei}}/g, this.factoryData.hetpei || '׳׳ ׳¦׳•׳™׳');
    template = template.replace(/{{factoryAddress}}/g, this.factoryData.address || '׳׳ ׳¦׳•׳™׳');
    template = template.replace(/{{previousOwnerName}}/g, this.previousOwnerName || '׳”׳׳׳•׳ ׳” ׳”׳§׳•׳“׳');
    template = template.replace(/{{transferDate}}/g, transferDate);
    template = template.replace(/{{baseUrl}}/g, this.baseUrl || '');

    this.body = template;

    // Call the parent send method
    return await super.send();
  }
}

module.exports = FactoryTransferMail;


