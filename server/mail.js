// server/mail.js
// This is a mock mailer. In production, replace this with Nodemailer or SendGrid.

async function send(to, subject, body) {
    console.log("-----------------------------------------");
    console.log(`📧 MOCK EMAIL SENT`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log("-----------------------------------------");
    return true;
}

module.exports = { send };
