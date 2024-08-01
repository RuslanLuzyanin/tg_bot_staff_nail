const winston = require('winston');

class AppLogger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
                }),
                new winston.transports.File({ filename: 'logs/app.log' }),
            ],
        });
    }

    info(...args) {
        this.logger.info(...args);
    }

    error(...args) {
        this.logger.error(...args);
    }
}

module.exports = AppLogger;
