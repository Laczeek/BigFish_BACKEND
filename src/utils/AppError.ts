class AppError extends Error {
    isOperational = true;
    code: number;
    field?: string;
    constructor(message: string, code: number, field?: string) {
        super(message);
        this.code = code;
        if(field) {
            this.field = field;
        }
    }
}

export default AppError;