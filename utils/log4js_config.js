import log4js from 'log4js'

log4js.configure({
    appenders: {
        miLoggerConsole: { type: 'console' },
        miLoggerWarnFile: { type: 'file', filename: 'warn.log' },
        miLoggerErrorFile: { type: 'file', filename: 'error.log' },
        //FILTROS
        loggerConsole: {type: 'logLevelFilter', appender: 'miLoggerConsole', level: 'info'},
        loggerWarn: {type: 'logLevelFilter', appender: 'miLoggerWarnFile', level: 'warn'},
        loggerError: {type: 'logLevelFilter', appender: 'miLoggerErrorFile', level: 'error'}
    },
    categories: {
        default: {appenders: ['loggerConsole'], level: 'all'},
        console: {appenders: ['loggerConsole'], level: 'all'},
        warnFile: {appenders: ['loggerWarn'], level: 'all'},
        errorFile: {appenders: ['loggerError'],level: 'all'},
        allLogger: {appenders: ['loggerConsole','loggerWarn'], level: 'all'}
    }
})

let logger = log4js.getLogger()

export default logger