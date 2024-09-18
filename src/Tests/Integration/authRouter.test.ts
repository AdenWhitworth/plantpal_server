import request from 'supertest';
import { app, server  } from '../../app';
import { generateAccessToken, generateRefreshToken, generateResetToken } from '../../Helper/tokenManager';
import { getUserByEmail, createUser, updateUserInfo, clearResetToken, getUserById, updateLastLoginTime, updateUserPassword } from '../../MySQL/database';
import { sendEmail } from "../../Helper/emailManager";
import { compare, hash } from 'bcryptjs';
import { verifyToken } from '../../Helper/jwtManager';

type SendEmailFunction = (emailOptions: { to: string; subject: string; text?: string; html?: string }) => Promise<void>;

jest.mock('../../Helper/emailManager', () => ({
    sendEmail: jest.fn() as jest.MockedFunction<SendEmailFunction>,
}));

jest.mock('../../Helper/jwtManager', () => ({
    verifyToken: jest.fn(),
}));

jest.mock('../../MySQL/database', () => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUserInfo: jest.fn(),
    clearResetToken: jest.fn(),
    getUserById: jest.fn(),
    updateLastLoginTime: jest.fn(),
    updateUserPassword: jest.fn()
}));

jest.mock('../../Helper/tokenManager', () => ({
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    generateResetToken: jest.fn(),
}));

type HashFunction = (password: string, salt: string | number) => Promise<string>;
type CompareFunction = (password: string, hash: string) => Promise<boolean>;

jest.mock('bcryptjs', () => ({
    hash: jest.fn() as jest.MockedFunction<HashFunction>,
    compare: jest.fn() as jest.MockedFunction<CompareFunction>,
}));

jest.mock('aws-sdk', () => {
    const mockAWS = {
      config: {
        update: jest.fn(),
      },
    };
    return {
      ...mockAWS,
      IotData: jest.fn().mockImplementation(() => ({
        publish: jest.fn((params, callback) => callback(null, {})),
      })),
    };
});

describe('Auth Router Integration Tests', () => {
    const expiryMinutes = 15;
    const resetTokenExpiryTimestamp = Date.now() + (expiryMinutes * 60 * 1000);
    const formattedResetTokenExpiry = new Date(resetTokenExpiryTimestamp).toISOString();
    
    interface TestUser {
        user_id: number,
        first_name: string,
        last_name: string,
        email: string,
        password: string,
        hashPassword: string,
        refresh_token: string,
        reset_token_expiry: string,
        reset_token: string,
        accessToken: string,
        invalidAccessToken: string
    };

    const testUser = {
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        hashPassword: 'mockHashedPassword',
        refresh_token: 'mockRefreshToken',
        reset_token_expiry: formattedResetTokenExpiry,
        reset_token: 'mockResetToken%20resetTokenSecret',
        accessToken: 'mockAccessToken',
        invalidAccessToken: 'mockInvalidAccessToken'
    }
  
    afterAll(done => {
      server.close(done);
    });

    beforeAll(() => {
        process.env.EMAIL_FROM = 'server@gmail.com';
        process.env.AUTH_ACCESS_TOKEN_SECRET = 'accessTokenSecret';
        process.env.API_CLIENT_KEY = 'apiKey';
        process.env.AUTH_REFRESH_TOKEN_SECRET = 'refreshTokenSecret';
        process.env.BASE_URL = 'http://localhost:3000';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });
  
    it('should register a new user successfully', async () => {

        (createUser as jest.Mock).mockResolvedValue({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.hashPassword
        });

        (hash as jest.Mock).mockResolvedValue(testUser.hashPassword);
        
        const response = await request(app)
        .post('/users/register')
        .send({
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          email: testUser.email,
          password: testUser.password,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('The user has been registered with us!');
      expect(createUser).toHaveBeenCalledWith(
            testUser.first_name,
            testUser.last_name,
            testUser.email,
            testUser.hashPassword
        );
    });
    
    it('should not register a user with an existing email', async () => {

        (getUserByEmail as jest.Mock).mockResolvedValue({ user_id: testUser.user_id, password: testUser.hashPassword });

        const response = await request(app)
        .post('/users/register')
        .send({
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            password: testUser.password,
          'x-api-key': process.env.API_CLIENT_KEY
        });
        expect(response.status).toBe(409);
        expect(response.body.message).toBe('This user is already in use!');
    });
    
    it('should login successfully and return tokens', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            password: testUser.hashPassword 
        });
        (compare as jest.Mock).mockResolvedValue(true);
        (generateAccessToken as jest.Mock).mockResolvedValue(testUser.accessToken);
        (generateRefreshToken as jest.Mock).mockResolvedValue(testUser.refresh_token);
        (updateLastLoginTime as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id
        });

        const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('The user has been logged in!');
      expect(response.body.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should handle login of user who doesnt exist', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            password: testUser.hashPassword 
        });
        (compare as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Email or password is incorrect!');
    });

    it('should handle login of user with incorrect password', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Email or password is incorrect!');
    });

    it('should update user information successfully', async () => {
        (updateUserInfo as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            password: testUser.hashPassword, 
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
        });

        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });

        const response = await request(app)
        .post('/users/updateUser')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          email: testUser.email
        });
  
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User updated successfully');
        expect(updateUserInfo).toHaveBeenCalledWith(
            testUser.user_id,
            testUser.first_name,
            testUser.last_name,
            testUser.email
        );
    });

    it('should handle a failed update to the users information', async () => {
        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: null };
        });

        const response = await request(app)
        .post('/users/updateUser')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          email: testUser.email
        });
  
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('User update unsuccessful.');
    });

    it('should handle accessToken errors when updating user information', async () => {
        (updateUserInfo as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            password: testUser.hashPassword, 
            first_name: "WrongFirst",
            last_name: "WrongLast",
            email: "WrongEmail",
        });

        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });

        const response = await request(app)
        .post('/users/updateUser')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          email: testUser.email
        });
  
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User update unsuccessful.');
    });

    it('should refresh access token successfully', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            refresh_token: testUser.refresh_token 
        });

        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });

        (generateAccessToken as jest.Mock).mockResolvedValue(testUser.accessToken);
        
        (compare as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
        .post('/users/refreshAccessToken')
        .set('Cookie', `refreshToken=${testUser.refresh_token}`);
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Refreshed access token');
        expect(response.body.accessToken).toBeDefined();
    });

    it('should handle missing refresh token in cookies', async () => {
        const response = await request(app)
        .post('/users/refreshAccessToken')
        
        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual({"refreshToken": "Refresh token cannot be empty"});
    });

    it('should handle incorrect refresh token', async () => {
        (getUserById as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            refresh_token: testUser.refresh_token 
        });

        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });

        (compare as jest.Mock).mockResolvedValue(false);

        const response = await request(app)
        .post('/users/refreshAccessToken')
        .set('Cookie', `refreshToken=${testUser.refresh_token}`);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Refresh token not found, please login again');
    });

    it('should handle determine a user doesnt exist for the refresh token', async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);

        (verifyToken as jest.Mock).mockImplementation((token, secret) => {
            return { user_id: testUser.user_id };
        });

        const response = await request(app)
        .post('/users/refreshAccessToken')
        .set('Cookie', `refreshToken=${testUser.refresh_token}`);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Refresh token not found, please login again');
    });

    it('should send a reset password email successfully', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id, 
            password: testUser.hashPassword 
        });
    
        (generateResetToken as jest.Mock).mockResolvedValue(testUser.reset_token);
    
        const expectedEmail = { 
            to: testUser.email, 
            subject: 'PlantPal Password Reset Request',
            text: expect.stringContaining(`${process.env.BASE_URL}/resetPassword?resetToken=${testUser.reset_token}&user_id=${testUser.user_id}`)
        };
    
        (sendEmail as jest.Mock).mockResolvedValue(expectedEmail);
    
        const response = await request(app)
        .post('/users/forgotPassword')
        .send({
          email: testUser.email,
          'x-api-key': process.env.API_CLIENT_KEY
        });
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reset password email sent successfully');
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining(expectedEmail));
    });

    it('should not alert user of error if user does not exist for password reset link', async () => {
        (getUserByEmail as jest.Mock).mockResolvedValue(null);
    
        const response = await request(app)
        .post('/users/forgotPassword')
        .send({
          email: testUser.email,
          'x-api-key': process.env.API_CLIENT_KEY
        });
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Reset password email sent successfully');
    });

    it('should reset password successfully', async () => {
        const newHashPassword = "newMockHashedPassword";
        (clearResetToken as jest.Mock);
        (getUserById as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id,
            reset_token_expiry: testUser.reset_token_expiry, 
            reset_token: testUser.reset_token,
            email: testUser.email 
        });

        (compare as jest.Mock).mockResolvedValue(true);
        (hash as jest.Mock).mockResolvedValue(newHashPassword);

        const expectedEmail = { 
            to: testUser.email, 
            subject: 'PlantPal Password Changed',
            html: expect.stringContaining("This is a confirmation that you have changed Password for your account with PlantPal.")
        };
        
        (sendEmail as jest.Mock).mockResolvedValue(expectedEmail);
        
        const response = await request(app)
          .post('/users/resetPassword')
          .send({
            password: 'newpassword123',
            resetToken: testUser.reset_token,
            user_id: testUser.user_id,
            'x-api-key': process.env.API_CLIENT_KEY
        });
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Password reset successfully');
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining(expectedEmail));
        expect(updateUserPassword).toHaveBeenCalledWith(testUser.user_id,newHashPassword);
    });

    it('should handle invalid reset password request due to timeout', async () => {
        const expiredResetTokenDate = "2024-01-01T00:00:00Z";
        (clearResetToken as jest.Mock);
        (getUserById as jest.Mock).mockResolvedValue({ 
            user_id: testUser.user_id,
            reset_token_expiry: expiredResetTokenDate, 
            reset_token: testUser.reset_token,
            email: testUser.email 
        });

        (compare as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
        .post('/users/resetPassword')
        .send({
          password: 'newpassword123',
          resetToken: 'invalidtoken',
          user_id: testUser.user_id,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should handle invalid reset password request due to token mismatch', async () => {
        (compare as jest.Mock).mockResolvedValue(false);
        (clearResetToken as jest.Mock);

        const response = await request(app)
        .post('/users/resetPassword')
        .send({
          password: 'newpassword123',
          resetToken: 'invalidtoken',
          user_id: testUser.user_id,
          'x-api-key': process.env.API_CLIENT_KEY
        });
  
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid or expired token');
    });
});
