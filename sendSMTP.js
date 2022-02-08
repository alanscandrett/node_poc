import nodemailer from "nodemailer";
import CONSTANTS from "./assets/settings.js";

const sendSMTP = {
  // async..await is not allowed in global scope, must use a wrapper
  sendEmail: async function (subject, htmlBody) {
    let transporter = nodemailer.createTransport({
      host: CONSTANTS.EMAIL.SMTP_HOST,
      port: CONSTANTS.EMAIL.PORT,
      secure: true,

      auth: {
        user: CONSTANTS.EMAIL.ACCOUNT,
        pass: CONSTANTS.EMAIL.PASS,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: CONSTANTS.EMAIL.ACCOUNT, // sender address
      to: CONSTANTS.EMAIL.RECIPIENT, // list of receivers
      subject: subject, // Subject line
      html: `${htmlBody}`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  },
};

export default sendSMTP;
