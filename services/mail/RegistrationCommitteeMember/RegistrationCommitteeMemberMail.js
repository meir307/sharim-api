const fs = require('fs');
const path = require('path');
const BaseMail = require('../baseMail');

class RegistrationCommitteeMemberMail extends BaseMail {
  constructor(member, baseUrl = null) {
    const recipient = member.email;
    const subject = '׳‘׳¨׳•׳ ׳”׳‘׳ ׳׳•׳•׳¢׳“׳× ׳”׳‘׳˜׳™׳—׳•׳× - ׳׳×׳¨ ׳”׳׳׳•׳ ׳™׳';
    super(recipient, subject, '');
    this.member = member;
    this.baseUrl = baseUrl;
  }

  async send() {
    // Load the HTML template
    const templatePath = path.join(__dirname, 'RegistrationCommitteeMemberMail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template.replace('{{fullname}}', this.member.fullName || '׳׳©׳×׳׳©');
    template = template.replace('{{factoryName}}', this.member.factoryName || '׳׳₪׳¢׳');    // ׳©׳ ׳”׳׳₪׳¢׳ ׳׳•׳₪׳™׳¢ ׳₪׳¢׳׳™׳™׳  
    template = template.replace('{{factoryName}}', this.member.factoryName || '׳׳₪׳¢׳'); 
    template = template.replace('{{activationCode}}', this.member.activationCode || '');
    template = template.replace('{{baseUrl}}', this.baseUrl);

    this.body = template;

    // Call the parent send method
    return await super.send();
  }
}

module.exports = RegistrationCommitteeMemberMail;


