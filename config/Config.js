class Config {
    constructor() {
        require('dotenv').config();
    }

    get(key) {
        const value = process.env[key];
        if (!value) {
            throw { code: 'unknownEnvKey' };
        }
        return value;
    }

    get telegramToken() {
        return this.get('TELEGRAM_TOKEN');
    }

    get userId() {
        return this.get('USER_ID');
    }

    get uri() {
        return this.get('MONGO_URI');
    }

    get receptionAddress() {
        return this.get('RECEPTION_ADDRESS');
    }
}

module.exports = new Config();
