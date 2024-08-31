const StartError = require('../errors/startError');

class Config {
    constructor() {
        require('dotenv').config();
    }

    get(key) {
        const value = process.env[key];
        if (!value) {
            throw new StartError('unknownEnvKey');
        }
        return value;
    }

    get telegramToken() {
        return this.get('USER_BOT_TOKEN');
    }

    get userId() {
        return this.get('USER_ADMIN_ID');
    }

    get uri() {
        return this.get('MONGO_URI');
    }

    get receptionAddress() {
        return this.get('RECEPTION_ADDRESS');
    }
}

module.exports = new Config();
