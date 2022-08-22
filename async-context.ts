import { AsyncLocalStorage } from 'node:async_hooks'
import { Logger } from 'winston'
export const context = new AsyncLocalStorage<Map<String, Logger>>()
