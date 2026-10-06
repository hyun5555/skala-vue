import http from 'node:http'
import { handleRequest } from './server.js'

const port = process.env.PORT || 3001

http
  .createServer(async (request, response) => {
    try {
      const apiResponse = await handleRequest(
        new Request(new URL(request.url, 'http://localhost'), {
          method: request.method,
          headers: request.headers,
        }),
        process.env,
      )
      response.writeHead(apiResponse.status, Object.fromEntries(apiResponse.headers))
      response.end(Buffer.from(await apiResponse.arrayBuffer()))
    } catch {
      console.error('API request failed.')
      response.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      response.end(JSON.stringify({ message: 'API 서버 오류가 발생했습니다.' }))
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Weather API server: http://localhost:${port}`))
