class Config {
    constructor() {
        require('dotenv').config();
    }

    get(key) {
        const value = process.env[key];
        if (!value) {
            throw new Error('unknownEnvKeyError');
        }
        return value;
    }

    get userBotToken() {
        return this.get('USER_BOT_TOKEN');
    }

    get adminBotToken() {
        return this.get('ADMIN_BOT_TOKEN');
    }

    get adminId() {
        return this.get('USER_ADMIN_ID');
    }

    get regId() {
        return this.get('USER_REG_ID');
    }

    get uri() {
        return this.get('MONGO_URI');
    }

    get receptionAddress() {
        return this.get('RECEPTION_ADDRESS');
    }
}

module.exports = new Config();
