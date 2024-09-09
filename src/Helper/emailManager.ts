import nodemailer, {SentMessageInfo} from 'nodemailer';

interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail (mailOptions: MailOptions): Promise<SentMessageInfo>{
    var transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.AUTH_EMAIL_USERNAME as string,
          pass: process.env.AUTH_EMAIL_PASSWORD as string
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


