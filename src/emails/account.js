const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendWelcomeEmail(email, name) {
  sgMail
    .send({
      to: email,
      from: 'ncnt257@gmail.com',
      subject: 'Thanks for joining with us',
      text: `Welcome to the app ${name}, we hope you enjoy our service.`,
    })
    .then(() => {
      console.log('Email sent');
    })
    .catch(error => {
      console.error(error.message);
    });
}
function sendCancelEmail(email, name) {
  sgMail
    .send({
      to: email,
      from: 'ncnt257@gmail.com',
      subject: 'We will miss you!',
      text: `Thank you for used our service ${name}, We would be happy if you leave us the reason you leave.`,
    })
    .then(() => {
      console.log('Email sent');
    })
    .catch(error => {
      console.error(error.message);
    });
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail,
};
