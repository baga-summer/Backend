

const nodemailer = require("nodemailer");
const emailConfig = require('../config/emailConfig.js');


/**
* Checks that the script can connect to the SMTP server. If it can't it'll shutdown
* and return error code 1.
*/
const testSmtpConnection = () => {
    let transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: false, // upgrade later with STARTTLS
        requireTLS: true,
        tls: {
            ciphers: 'SSLv3'
        },
        auth: {
            user: emailConfig.smtp.user,
            pass: emailConfig.smtp.pass
        }
    });
    // verify connection configuration

    transporter.verify(function(error) {
        if (error) {
            console.log(error);
            console.log("SMTP ERROR, UNABLE TO SEND EMAILS");
            process.exit(1);
        } else {
            console.log("SMTP Server response OK; Email sender ready");
        }
    });
};

/**
* Creates an email object about creating a new account
* @param {string} tokenToSend the user account token
* @return {object} Returns the email object
*/
const createNewAccountTokenEmail = (tokenToSend) => {
    let email = {};

    email.subject = "Du har blivit tilldelad ett konto";
    email.plain = `En administatör har lagt till dig i Baga Aqua System.
    För att få tillgång till systemet måste du aktivera ditt konto. Aktivera ditt konto
    genom att klicka på "Aktivera konto" på hemsidan. Ange din mailadress, din verifieringsnyckel
    (se nedan) och ett lösenord som du vill använda.\r\n\r\n
    VERIFIERINGSNYCKEL: ` + tokenToSend + `\r\n\r\n Du kan inte svara på detta mail.`;

    email.html = `<div style="text-align:center;font-family:sans-serif;">
    <h3 style="font-weight:400;">En administatör har lagt till dig i Baga Aqua System.</h3>
    <hr style="width:50%;border-color:rgba(18, 128, 196, 1);border-radius:50%">
    <br>
    <p>För att få tillgång till systemet måste du aktivera ditt konto. Aktivera ditt konto
    genom att klicka på "Aktivera konto" på hemsidan. Ange din mailadress, din verifieringsnyckel
    (se nedan) och ett lösenord som du vill använda.</p>
    <br>
    <div>
    <h4>VERIFIERINGSNYCKEL</h4>
    <span style="padding:1rem;border:2px solid rgba(18, 128, 196, 1);">` + tokenToSend +
    `</span>
    </div>
    <br><br><br>
    <i>Du kan inte svara på det här mailet</i>
    </div>`;

    return email;
};

/**
* Creates an email object about resetting a password
* @param {string} tokenToSend the user account token
* @return {object} Returns the email object
*/
const createResetTokenEmail = (tokenToSend) => {
    let email = {};

    email.subject = "Återställa lösenord";
    email.plain = `En begäran om återställning av ditt lösenord har gjorts. I detta
    mail finner du en Återställningsnyckel. Den kan användas en gång för att sätta
    ett nytt lösenord. Var det inte du som begärde den? Isåfall kan du ignorera det
    här mailet och fortsätta använda samma lösenord som tidigare.\r\n\r\n
    ÅTERSTÄLLNINGSNYCKEL: ` + tokenToSend + `\r\n\r\n Du kan inte svara på detta mail.`;

    email.html = `<div style="text-align:center;font-family:sans-serif;">
    <h3 style="font-weight:400;">Återställa lösenord i Baga Aqua System</h3>
    <hr style="width:50%;border-color:rgba(18, 128, 196, 1);border-radius:50%">
    <br>
    <p>En begäran om återställning av ditt lösenord har gjorts. I detta
    mail finner du en Återställningsnyckel. Den kan användas en gång för att sätta
    ett nytt lösenord. Var det inte du som begärde den? Isåfall kan du ignorera det
    här mailet och fortsätta använda samma lösenord som tidigare.</p>
    <br>
    <div>
    <h4>ÅTERSTÄLLNINGSNYCKEL</h4>
    <span style="padding:1rem;border:2px solid rgba(18, 128, 196, 1);">` + tokenToSend +
    `</span>
    </div>
    <br><br><br>
    <i>Du kan inte svara på det här mailet</i>
    </div>`;

    return email;
};


/**
* Sends the email to the reciever
* @param {string} reciever the email of the user that will recive the email
* @param {object} email the email to send, containing subject, plaintext and html
*/
const sendEmail = async (reciever, email) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: false, // upgrade later with STARTTLS
        requireTLS: true,
        tls: {
            ciphers: 'SSLv3'
        },
        auth: {
            user: emailConfig.smtp.user,
            pass: emailConfig.smtp.pass
        }
    });

    // Email content and settings
    let mailOptions = {
        from: '"NO-REPLY <' + emailConfig.smtp.user + '>"', // sender address
        to: reciever, // email of person recieving the email
        subject: email.subject, // Subject line
        text: email.plain, // plain text body
        html: email.html // html body
    };

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
};

module.exports = {
    testSmtpConnection,
    createNewAccountTokenEmail,
    createResetTokenEmail,
    sendEmail
};
