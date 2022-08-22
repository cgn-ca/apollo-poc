import {createLogger, format, transports} from 'winston'

const {combine} = format
import {context} from './async-context'
import {GraphQLFieldResolver} from "graphql"
import { errorFormatter } from './errform'


const logConfiguration = {
    format: combine(
        errorFormatter(),
        format.timestamp(),
        format.json()
    ),
    transports: [new transports.Console()],
    level: "info"
}

const exportedLogger = createLogger(logConfiguration)

export const logger = new Proxy(exportedLogger, {
    get(target, property, receiver) {
        target = context.getStore()?.get('logger') || target
        return Reflect.get(target, property, receiver)
    },
})

export const withUserContext = <T extends string, F extends string>(resolver: GraphQLFieldResolver<T, F>): typeof resolver => (...args) => {
    const child = exportedLogger.child({"user": "some-user-pulled-off-context"})
    const store = new Map()
    store.set('logger', child)
    return context.run(store, () => resolver(args[0], args[1], args[2], args[3]))
}

export const contextMiddleware = (req, res, next) => {
    const child = exportedLogger.child({"user": "some-user-pulled-off-context"})
    const store = new Map()
    store.set('logger', child)
    return context.run(store, next)
};