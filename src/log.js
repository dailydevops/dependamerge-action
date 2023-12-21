'use strict'

import { debug, info, warning } from '@actions/core'

const stringify = msg =>
  typeof msg === 'string' ? msg : msg.stack || msg.toString()

const log = logger => message => logger(stringify(message))

export const logDebug = log(debug)
export const logInfo = log(info)
export const logWarning = log(warning)
