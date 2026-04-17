const fs = require('fs');
const path = require('path');
const BaseMail = require('../baseMail');

class RegistrationMail extends BaseMail {
  constructor(user, baseUrl = null) {
    const recipient = user.email;
    const subject = '׳‘׳¨׳•׳ ׳”׳‘׳ ׳׳׳×׳¨ ׳”׳׳׳•׳ ׳™׳';
    super(recipient, subject, '');
    this.user = user;
    this.baseUrl = baseUrl 
  }

  async send() {
    // Load the HTML template
    const templatePath = path.join(__dirname, 'RegistrationMail.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    template = template.replace('{{fullname}}', this.user.fullName);
    template = template.replace('{{activationCode}}', this.user.activationCode);
    template = template.replace('{{baseUrl}}', this.baseUrl);
    this.body = template;

    console.log('template', template);
    // Call the parent send method
    return await super.send();
  }
}

module.exports = RegistrationMail; 
