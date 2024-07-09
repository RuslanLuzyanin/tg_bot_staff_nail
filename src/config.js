class Config {
    constructor() {
        require('dotenv').config();
    }

    get telegramToken() {
        return process.env.TELEGRAM_TOKEN;
    }

    get userId() {
        return process.env.USER_ID;
    }
}

module.exports = new Config();
