class CustomError extends Error {
    constructor(code, message, ...params) {
        super(message, ...params);
        this.code = code;
    }
}

module.exports = CustomError;
