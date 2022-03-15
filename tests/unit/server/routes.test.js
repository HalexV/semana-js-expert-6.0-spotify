import {jest, expect, describe, test, beforeEach} from '@jest/globals'

import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'

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