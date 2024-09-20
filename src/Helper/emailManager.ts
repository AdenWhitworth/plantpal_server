import nodemailer, {SentMessageInfo} from 'nodemailer';

/**
 * Interface defining the structure of the email options object.
 * This object is passed to the sendEmail function to specify the email details.
 */
interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

/**
 * Asynchronously sends an email using the given mail options.
 *
 * This function uses the nodemailer library to send emails through an SMTP server.
 *
 * @param {MailOptions} mailOptions - An object containing the sender, recipient, subject, and content of the email.
 * @returns {Promise<SentMessageInfo>} A promise that resolves to SentMessageInfo, containing information about the sent email.
 */
export async function sendEmail (mailOptions: MailOptions): Promise<SentMessageInfo>{
    // Create a transporter object to handle the email sending process.
    // It uses the Mailtrap service (in this example) for testing purposes.
    // Authentication credentials are loaded from environment variables.
    var transporter = nodemailer.createTransport({
        host: process.env.AUTH_EMAIL_HOST as string,
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


