// server/mail.js
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
