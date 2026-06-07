export class ApiError extends Error {
    public status: number;
    public errors: unknown[] = [];

    constructor(status: number, message: string, errors: unknown[] = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static BadRequest(message: string, errors: unknown[] = []) {
        return new ApiError(400, message, errors);
    }

    static UnauthorizedError() {
        return new ApiError(401, 'User is not authorized');
    }

    static ForbiddenError() {
        return new ApiError(403, 'Forbidden access');
    }

    static NotFound(message: string) {
        return new ApiError(404, message);
    }
}
