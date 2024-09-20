const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

class Log {
    /**
     * Создает экземпляр класса Log и настраивает логгер.
     */
    constructor() {
        this.logger = createLogger({
            level: 'debug',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.printf((info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
            ),
            transports: [
                new transports.Console({
                    level: 'debug',
                    format: format.combine(format.colorize(), format.simple()),
                }),
                new DailyRotateFile({
                    dirname: 'logs',
                    filename: 'app-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    level: 'info',
                }),
            ],
        });
    }

    /**
     * Записывает информационное сообщение в лог.
     * @param {...any} args - Аргументы для записи в лог.
     */
    info(...args) {
        this.logger.info(...args);
    }

    /**
     * Записывает отладочное сообщение в лог.
     * @param {...any} args - Аргументы для записи в лог.
     */
    debug(...args) {
        this.logger.debug(...args);
    }

    /**
     * Записывает сообщение об ошибке в лог.
     * @param {...any} args - Аргументы для записи в лог.
     */
    error(...args) {
        this.logger.error(...args);
    }
}

module.exports = Log;
