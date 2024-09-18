/*
import sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../Routes/authRouter';
import { validationResult } from 'express-validator';

describe('validateRequest Middleware', () => {
    let validationResultStub: sinon.SinonStub;

    beforeEach(() => {
        // Stub the validationResult function
        validationResultStub = sinon.stub(validationResult as any);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 400 if validation fails', async () => {
        const req = { body: {} } as Request;

        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        } as unknown as Response;

        const next = sinon.spy() as NextFunction;

        // Configure the stub to return a mock object
        validationResultStub.returns({
            isEmpty: () => false,
            array: () => [{ param: 'email', msg: 'Invalid email' }],
        });

        const validationMiddleware = validateRequest([]);
        await validationMiddleware(req, res, next);

        sinon.assert.calledWith(res.status as sinon.SinonStub, 400);
        sinon.assert.calledWith(res.json as sinon.SinonStub, { errors: { email: 'Invalid email' } });
    });

    it('should call next() if validation passes', async () => {
        const req = { body: {} } as Request;
        const res = {} as Response;
        const next = sinon.spy() as NextFunction;

        // Configure the stub to return a mock object
        validationResultStub.returns({
            isEmpty: () => true,
            array: () => [],
        });

        const validationMiddleware = validateRequest([]);
        await validationMiddleware(req, res, next);

        sinon.assert.calledOnce(next as sinon.SinonSpy);
    });
});
*/






