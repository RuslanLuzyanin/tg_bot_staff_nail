class Config {
    constructor() {
        require('dotenv').config();
    }

    get(key) {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Environment variable ${key} is not set`);
        }
        return value;
    }

    get telegramToken() {
        return this.get('TELEGRAM_TOKEN');
    }

    get userId() {
        return this.get('USER_ID');
    }
}

module.exports = new Config();
