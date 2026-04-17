const fs = require('fs');
const path = require('path');
const BaseMail = require('../baseMail');

class PasswordResetMail extends BaseMail {
  constructor(user, baseUrl = null) {
    const recipient = user.email;
    const subject = '׳׳™׳₪׳•׳¡ ׳¡׳™׳¡׳׳” - ׳׳×׳¨ ׳”׳׳׳•׳ ׳™׳';
    super(recipient, subject, '');
    this.user = user;
    this.baseUrl = baseUrl;
  }

  async send() {
    // Load the HTML template
    const templatePath = path.join(__dirname, 'PasswordResetMail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template.replace('{{fullname}}', this.user.fullName || '׳׳©׳×׳׳©');
    template = template.replace('{{resetCode}}', this.user.resetCode || '');
    template = template.replace('{{baseUrl}}', this.baseUrl);

    this.body = template;

    // Call the parent send method
    return await super.send();
  }
}

module.exports = PasswordResetMail;


