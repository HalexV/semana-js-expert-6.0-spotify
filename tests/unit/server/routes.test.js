import {jest, expect, describe, test, beforeEach} from '@jest/globals'

import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'
import events from 'events'

const {
  pages,
  location,
  constants: {
    CONTENT_TYPE
  }
} = config

describe('#Routes - test suite for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks(),
    jest.clearAllMocks()
  })
  
  test('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      {
        'Location': location.home
      }
    )
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home - should response with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStreamSpy = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream
    })

    const pipeSpy = jest.spyOn(mockFileStream, 'pipe').mockReturnValueOnce()

    await handler(...params.values())

    expect(getFileStreamSpy).toBeCalledWith(pages.homeHTML)
    expect(pipeSpy).toHaveBeenCalledWith(params.response)
  })

  test(`GET /controller - should response with ${pages.controllerHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'

    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStreamSpy = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream
    })

    const pipeSpy = jest.spyOn(mockFileStream, 'pipe').mockReturnValueOnce()

    await handler(...params.values())

    expect(getFileStreamSpy).toBeCalledWith(pages.controllerHTML)
    expect(pipeSpy).toHaveBeenCalledWith(params.response)
  })

  test('GET /stream should return a file stream', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/stream'

    const mockOnClose = () => {}
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const createClientStreamSpy = jest.spyOn(
      Controller.prototype,
      Controller.prototype.createClientStream.name
    ).mockReturnValueOnce({
      stream: mockFileStream,
      onClose: mockOnClose
    })

    const pipeSpy = jest.spyOn(mockFileStream, 'pipe').mockReturnValueOnce()

    await handler(...params.values())

    expect(createClientStreamSpy).toHaveBeenCalled()
    expect(params.request.once).toHaveBeenCalledWith('close', mockOnClose)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes'
    })
    expect(pipeSpy).toHaveBeenCalledWith(params.response)
  })

  test('POST /controller should respond with ok on valid command', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/controller'

    const mockData = JSON.stringify({
      command: 'valid'
    })
    const mockItem = {
      command: 'valid'
    }
    const mockResult = {
      result: 'ok'
    }

    const mockResultString = JSON.stringify(mockResult)

    const eventsOnceSpy = jest.spyOn(events, events.once.name).mockResolvedValueOnce(mockData)
    const jsonParseSpy = jest.spyOn(JSON, JSON.parse.name).mockReturnValueOnce(mockItem)
    const handleCommandSpy = jest.spyOn(Controller.prototype, Controller.prototype.handleCommand.name).mockResolvedValueOnce(mockResult)
    const jsonStringifySpy = jest.spyOn(JSON, JSON.stringify.name).mockReturnValueOnce(mockResultString)

    await handler(...params.values())

    expect(eventsOnceSpy).toHaveBeenCalledWith(params.request, 'data')
    expect(jsonParseSpy).toHaveBeenCalledWith(mockData)
    expect(handleCommandSpy).toHaveBeenCalledWith(mockItem)
    expect(jsonStringifySpy).toHaveBeenCalledWith(mockResult)
    expect(params.response.end).toHaveBeenCalledWith(mockResultString)
  })

  test('POST /controller should respond with 500 on invalid command', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/controller'

    jest.spyOn(events, events.once.name).mockResolvedValueOnce()
    jest.spyOn(JSON, JSON.parse.name).mockReturnValueOnce()
    jest.spyOn(Controller.prototype, Controller.prototype.handleCommand.name).mockResolvedValueOnce(undefined)

    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(500)
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /index.html - should respond with file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/index.html'
    params.request.method = 'GET'
    params.request.url = filename

    const expectedType = '.html'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStreamSpy = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream,
      type: expectedType
    })

    const pipeSpy = jest.spyOn(mockFileStream, 'pipe').mockReturnValueOnce()

    await handler(...params.values())

    expect(getFileStreamSpy).toBeCalledWith(filename)
    expect(pipeSpy).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).toHaveBeenCalledWith(
      200,
      {
        'Content-Type': CONTENT_TYPE[expectedType]
      }
    )
  })

  test(`GET /file.ext - should respond with file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    const filename = '/file.ext'
    params.request.method = 'GET'
    params.request.url = filename

    const expectedType = '.ext'
    const mockFileStream = TestUtil.generateReadableStream(['data'])

    const getFileStreamSpy = jest.spyOn(
      Controller.prototype,
      Controller.prototype.getFileStream.name
    ).mockResolvedValueOnce({
      stream: mockFileStream,
      type: expectedType
    })

    const pipeSpy = jest.spyOn(mockFileStream, 'pipe').mockReturnValueOnce()

    await handler(...params.values())

    expect(getFileStreamSpy).toBeCalledWith(filename)
    expect(pipeSpy).toHaveBeenCalledWith(params.response)
    expect(params.response.writeHead).not.toHaveBeenCalled()
  })

  test(`POST /unknown - given a nonexistent route it should respond with 404`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/unknown'

    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('exceptions', () => {
    test('given a nonexistent file it should respond with 404', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValueOnce(new Error('Error: ENOENT: no such file or directory'))

      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test('given an error file it should respond with 500', async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/index.png'

      jest.spyOn(
        Controller.prototype,
        Controller.prototype.getFileStream.name
      ).mockRejectedValueOnce(new Error('Error:'))

      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})