import nodemailer from 'nodemailer';

export async function sendEmail (mailOptions){
    var transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.AUTH_EMAIL_USERNAME,
          pass: process.env.AUTH_EMAIL_PASSWORD
        }
    });

    const sentEmail = await transporter.sendMail({
        from: mailOptions?.from,
        to: mailOptions?.to,
        subject: mailOptions?.subject,
        text: mailOptions?.text,
        html: mailOptions?.html,
    });

    return sentEmail;
}


