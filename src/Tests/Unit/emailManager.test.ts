import nodemailer from 'nodemailer';
import { sendEmail } from '../../Helper/emailManager';

jest.mock('nodemailer');

describe('sendEmail', () => {
    const mockSendMail = jest.fn();
    const mockCreateTransport = nodemailer.createTransport as jest.Mock;

    beforeEach(() => {
        mockCreateTransport.mockReturnValue({
            sendMail: mockSendMail
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send an email with the correct mail options', async () => {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test message'
        };

        const mockSentMessageInfo = { messageId: 'testMessageId' };
        mockSendMail.mockResolvedValue(mockSentMessageInfo);

        const result = await sendEmail(mailOptions);

        expect(mockSendMail).toHaveBeenCalledWith({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: undefined, 
        });

        expect(result).toEqual(mockSentMessageInfo);
    });

    it('should send an email with HTML content when provided', async () => {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<h1>Hello</h1>'
        };

        const mockSentMessageInfo = { messageId: 'testMessageId' };
        mockSendMail.mockResolvedValue(mockSentMessageInfo);

        const result = await sendEmail(mailOptions);

        expect(mockSendMail).toHaveBeenCalledWith({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: undefined, 
            html: mailOptions.html,
        });

        expect(result).toEqual(mockSentMessageInfo);
    });

    it('should handle errors from sendMail', async () => {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test message'
        };

        const mockError = new Error('Failed to send email');
        mockSendMail.mockRejectedValue(mockError);

        await expect(sendEmail(mailOptions)).rejects.toThrow('Failed to send email');
    });
});
