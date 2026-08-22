import process from 'node:process'

import { handleRequest } from '../server.js'

export default {
  fetch(request) {
    return handleRequest(request, process.env)
  },
}
