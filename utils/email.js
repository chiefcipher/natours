const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');
// new Email(user, ulr).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    console.log(user.name);
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Samuel Yakubu <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    const env = process.env;
    if (env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service : 'Mailgun',
        // TODO THIS ISN'T WORKING U NEED TO USE SENDGRID c
       auth : { 
        user: env.MAILGUN_USERNAME,
        pass: env.MAILGUN_PASSWORD   
       }
      });
    }
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }
  async send(template, subject) {
    // sends mail
    // 1. render html based on bug template
    // send parameter in .renderFile passes data into pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2. define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: convert(html, {
        wordWrap: 130,
      }),
    };
    // 3 create a transport  and send email
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'your password reset token (valid for only 10 min)')
  }
};
