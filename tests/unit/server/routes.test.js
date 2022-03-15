import {jest, expect, describe, test, beforeEach} from '@jest/globals'

import config from '../../../server/config.js'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import TestUtil from '../_util/testUtil.js'

const {
  pages,
  location
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

  test.todo(`GET /unknown - given a nonexistent route it should respond with 404`)

  describe('exceptions', () => {
    test.todo('given a nonexistent file it should respond with 404')
    test.todo('given an error file it should respond with 500')
  })
})