import {jest, expect, describe, test} from '@jest/globals'

import Server from '../../../server/server.js'
import superTest from 'supertest'
import portfinder from 'portfinder'
import {Transform} from 'stream'
import {setTimeout} from 'timers/promises'
import fs from 'fs'
import { join } from 'path'

const getAvailablePort = portfinder.getPortPromise

const RETENTION_DATA_PERIOD = 200

import config from '../../../server/config.js'

const {
  pages: {
    homeHTML
  },
  dir: {
    publicDir
  }
} = config

describe('API E2E Suite Test', () => {
  
  const commandResponse = JSON.stringify({
    result: 'ok'
  })

  const possibleCommands = {
    start: 'start',
    stop: 'stop'
  }

  function pipeAndReadStreamData(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk)
        cb(null, chunk)
      }
    })
    return stream.pipe(transform)
  }
  
  describe('client workflow', () => {
    
    async function getTestServer() {
      const getSuperTest = port => superTest(`http://localhost:${port}`)
      const port = await getAvailablePort()
      return new Promise((resolve, reject) => {
        const server = Server.listen(port)
        .once('listening', () => {
          const testServer = getSuperTest(port)
          const response = {
            testServer,
            kill() {
              server.close()
            }
          }

          return resolve(response)
        })
        .once('error', reject)
      })
    }

    function commandSender(testServer) {
      return {
        async send(command) {
          const response = await testServer.post('/controller')
          .send({
            command
          })

          expect(response.text).toStrictEqual(commandResponse)
        }
      }
    }

    describe('GET /', () => {
      test('it should return status 302', async () => {
        const server = await getTestServer()

        const response = await server.testServer.get('/')

        expect(response.status).toBe(302)
        expect(response.headers).toMatchObject({
          location: '/home'
        })

        server.kill()
      })
    })

    describe('GET /home', () => {
      test('it should return 200 and the html document', async () => {
        const server = await getTestServer()

        const response = await server.testServer.get('/home')

        const homeHTMLDocument = fs.readFileSync(join(publicDir, homeHTML))

        expect(response.status).toBe(200)
        expect(response.text).toStrictEqual(homeHTMLDocument.toString())

        server.kill()
      })
    })

    describe('GET /stream', () => {
      test('it should not receive data stream if the process is not playing', async () => {
        const server = await getTestServer()
        const onChunk = jest.fn()
  
        pipeAndReadStreamData(
          server.testServer.get('/stream'),
          onChunk
        )
  
        await setTimeout(RETENTION_DATA_PERIOD)
  
        server.kill()
        expect(onChunk).not.toHaveBeenCalled()
  
      })
  
      test('it should receive data stream if the process is playing', async () => {
        const server = await getTestServer()
        const onChunk = jest.fn()
  
        const {send} = commandSender(server.testServer)
  
        pipeAndReadStreamData(
          server.testServer.get('/stream'),
          onChunk
        )
        
        await send(possibleCommands.start)
        await setTimeout(RETENTION_DATA_PERIOD)
        await send(possibleCommands.stop)
  
        const [
          [buffer]
        ] = onChunk.mock.calls
  
        expect(buffer).toBeInstanceOf(Buffer)
        expect(buffer.length).toBeGreaterThan(1000)
  
        server.kill()
      })
    })
    
  })
})