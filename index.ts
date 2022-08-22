import {ApolloServer, gql} from 'apollo-server-express'
import {readFileSync} from 'fs'
import express from 'express'
import {makeExecutableSchema} from '@graphql-tools/schema'
import http from 'http'
import {serviceOne} from './service-one'
import {serviceTwo} from './service-two'

const schemaString = readFileSync(`${__dirname}/schema.graphqls`)
import {logger, withUserContext} from './logger'
import {defaultFieldResolver, GraphQLSchema} from "graphql";
import {getDirective, MapperKind, mapSchema} from "@graphql-tools/utils";

const resolvers = {
    Query: {
        demo: withUserContext((parent: any, args: any, context: any) => {
            logger.info("context")
            serviceOne()
            return {
                "myDemo": "demo",
                "secondProp": "asd"
            }
        }),
        demo2: withUserContext((parent: any, args: any, context: any) => {
            logger.info("DDEMO 2")
            serviceTwo()
            return {
                "myDemo": "demo22",
                "secondProp": "asasdasdd22"
            }
        })
    }
}


function authDirective(directiveName: string) {
    const typeDirectiveArgumentMaps: Record<string, any> = {}
    return {
        authDirectiveTransformer: (schema: GraphQLSchema) =>
            mapSchema(schema, {
                [MapperKind.TYPE]: type => {
                    const authDirective = getDirective(schema, type, directiveName)?.[0]
                    if (authDirective) {
                        typeDirectiveArgumentMaps[type.name] = authDirective
                    }
                    return undefined
                },
                [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
                    const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0] ?? typeDirectiveArgumentMaps[typeName]
                    if (authDirective) {
                        const {resolve = defaultFieldResolver} = fieldConfig
                        fieldConfig.resolve = function (source, args, context, info) {
                            logger.info("in auth directive")
                            return resolve(source, args, context, info)
                        }
                        return fieldConfig
                    }
                }
            })
    }
}


const gqlSchema = gql`${schemaString}`
const { authDirectiveTransformer} = authDirective('auth')

async function listen(port: number) {
    const app = express()


    const httpServer = http.createServer(app)
    let schema = makeExecutableSchema({
        typeDefs: [
            gqlSchema
        ],
        resolvers
    })

    schema = authDirectiveTransformer(schema)
    const server = new ApolloServer({schema})
    await server.start()

    server.applyMiddleware({app})

    return new Promise((resolve, reject) => {
        httpServer.listen(port).once('listening', resolve).once('error', reject)
    })
}

async function main() {
    try {
        await listen(4000)
        console.log('🚀 Server is ready at http://localhost:4000/graphql')
    } catch (err) {
        console.error('💀 Error starting the node server', err)
    }
}

void main()