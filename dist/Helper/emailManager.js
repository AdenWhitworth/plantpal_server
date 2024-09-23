"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Asynchronously sends an email using the given mail options.
 *
 * This function uses the nodemailer library to send emails through an SMTP server.
 *
 * @param {MailOptions} mailOptions - An object containing the sender, recipient, subject, and content of the email.
 * @returns {Promise<SentMessageInfo>} A promise that resolves to SentMessageInfo, containing information about the sent email.
 */
function sendEmail(mailOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a transporter object to handle the email sending process.
        // It uses the Mailtrap service (in this example) for testing purposes.
        // Authentication credentials are loaded from environment variables.
        var transporter = nodemailer_1.default.createTransport({
            host: process.env.AUTH_EMAIL_HOST,
            port: 2525,
            auth: {
                user: process.env.AUTH_EMAIL_USERNAME,
                pass: process.env.AUTH_EMAIL_PASSWORD
            }
        });
        const sentEmail = yield transporter.sendMail({
            from: mailOptions === null || mailOptions === void 0 ? void 0 : mailOptions.from,
            to: mailOptions === null || mailOptions === void 0 ? void 0 : mailOptions.to,
            subject: mailOptions === null || mailOptions === void 0 ? void 0 : mailOptions.subject,
            text: mailOptions === null || mailOptions === void 0 ? void 0 : mailOptions.text,
            html: mailOptions === null || mailOptions === void 0 ? void 0 : mailOptions.html,
        });
        return sentEmail;
    });
}
