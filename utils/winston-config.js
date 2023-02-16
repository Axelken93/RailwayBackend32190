import winston from 'winston'


function buildLogger() {
    return winston.createLogger({
        transports: [
            new winston.transports.Console( { level: 'info' }),
            new winston.transports.File( { filename: 'warn.log', level: 'warn' }),
            new winston.transports.File( { filename: 'error.log', level: 'error' })
        ]
    })
}

let logger = buildLogger()

export default logger