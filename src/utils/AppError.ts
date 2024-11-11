class AppError extends Error {
    isOperational = true;
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}

export default AppError;