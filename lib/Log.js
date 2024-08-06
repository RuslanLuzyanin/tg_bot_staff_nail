const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

class Log {
    constructor() {
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
            ),
            transports: [
                new transports.Console({
                    format: format.combine(format.colorize(), format.simple()),
                }),
                new DailyRotateFile({
                    dirname: 'logs',
                    filename: 'app-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
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

module.exports = Log;
