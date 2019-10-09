import Winston = require('winston');

export class LoggerBuilder {
    /**
     *
     * Creates a logging instance. The name will be used as a path seperator.
     *
     * @param {string} name  the 'name' of this logger for dedicated paths.
     * @returns {Winston.Logger} a logging instance
     */
    public static create(name: string): Winston.Logger {
        const log = Winston.createLogger({
            level: 'info',
            format: Winston.format.combine(Winston.format.splat(), Winston.format.simple()),
            defaultMeta: {src: 'IP3X-Assistant'},
            transports: [
                new Winston.transports.File({filename: `./logs/${name}/error.log`, level: 'error'}),
                new Winston.transports.File({filename: `./logs/${name}/debug.log`, level: 'debug'}),
                new Winston.transports.File({filename: `./logs/${name}/combined.log`})
            ]
        });
        return log;
    }
}

export default LoggerBuilder;
