import { Response } from 'express';

export interface SuccessResponseParams<T> {
    res: Response;
    statusCode?: number;
    message?: string;
    data?: T;
}

export class ResponseHandler {
    /**
     * Standardized Success Response
     */
    static success<T>({
        res,
        statusCode = 200,
        message = 'Success',
        data,
    }: SuccessResponseParams<T>): void {
        res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            ...(data !== undefined && { data }),
        });
    }

    /**
     * Helper for 201 Created
     */
    static created<T>(res: Response, message: string, data?: T): void {
        this.success({ res, statusCode: 201, message, data });
    }
}