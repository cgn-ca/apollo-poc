import { format } from 'winston'

export const errorFormatter = format((info, opts) => {
    if (info['level'] == 'error') {
        info['error'] = {"message": info['message'], "stack": info['stack'], "kind": info['kind']}
        const { ['stack']: stack, ...messageWithoutStack } = info
        return messageWithoutStack
    }
    return info
})
