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
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailManager_1 = require("../../Helper/emailManager");
/**
 * Mocking the nodemailer.
 */
jest.mock('nodemailer');
/**
 * Test suite for the `sendEmail` function.
 */
describe('sendEmail', () => {
    const mockSendMail = jest.fn();
    const mockCreateTransport = nodemailer_1.default.createTransport;
    beforeEach(() => {
        mockCreateTransport.mockReturnValue({
            sendMail: mockSendMail
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    /**
     * Test case for sending an email with the correct mail options.
     * It verifies that the `sendMail` function is called with the expected arguments
     * and checks the result of the email sending.
     */
    it('should send an email with the correct mail options', () => __awaiter(void 0, void 0, void 0, function* () {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test message'
        };
        const mockSentMessageInfo = { messageId: 'testMessageId' };
        mockSendMail.mockResolvedValue(mockSentMessageInfo);
        const result = yield (0, emailManager_1.sendEmail)(mailOptions);
        expect(mockSendMail).toHaveBeenCalledWith({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: undefined,
        });
        expect(result).toEqual(mockSentMessageInfo);
    }));
    /**
     * Test case for sending an email with HTML content when provided.
     * It verifies that the `sendMail` function is called with the HTML option
     * and checks the result of the email sending.
     */
    it('should send an email with HTML content when provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<h1>Hello</h1>'
        };
        const mockSentMessageInfo = { messageId: 'testMessageId' };
        mockSendMail.mockResolvedValue(mockSentMessageInfo);
        const result = yield (0, emailManager_1.sendEmail)(mailOptions);
        expect(mockSendMail).toHaveBeenCalledWith({
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: undefined,
            html: mailOptions.html,
        });
        expect(result).toEqual(mockSentMessageInfo);
    }));
    /**
     * Test case for handling errors from the `sendMail` function.
     * It verifies that an error is thrown when `sendMail` fails.
     */
    it('should handle errors from sendMail', () => __awaiter(void 0, void 0, void 0, function* () {
        const mailOptions = {
            from: 'test@example.com',
            to: 'recipient@example.com',
            subject: 'Test Subject',
            text: 'Test message'
        };
        const mockError = new Error('Failed to send email');
        mockSendMail.mockRejectedValue(mockError);
        yield expect((0, emailManager_1.sendEmail)(mailOptions)).rejects.toThrow('Failed to send email');
    }));
});
