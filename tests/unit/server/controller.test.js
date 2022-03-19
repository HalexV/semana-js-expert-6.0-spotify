import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'
import {logger} from '../../../server/util.js'
import TestUtil from '../_util/testUtil.js'
import { Readable } from 'stream'

const serviceStub = {
  getFileStream: () => {},
  startStreamming: () => {},
  stopStreamming: () => {},
  createClientStream: () => {},
  removeClientStream: () => {}
}

describe('#Controller', () => {
  
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('getFileStream', () => {
    test('it should call getFileStream with filename', async () => {
      const sut = new Controller(serviceStub)
      const expectedFileName = 'any'
  
      const getFileStreamSpy = jest.spyOn(serviceStub, serviceStub.getFileStream.name).mockResolvedValueOnce()
  
      await sut.getFileStream(expectedFileName)
  
      expect(getFileStreamSpy).toHaveBeenCalledWith(expectedFileName)
    })

    test('it should throw when getFileStream throws', async () => {
      const sut = new Controller(serviceStub)
      const expectedFileName = 'any'
  
      jest.spyOn(serviceStub, serviceStub.getFileStream.name).mockRejectedValueOnce(new Error())
  
      const result = sut.getFileStream(expectedFileName)
  
      await expect(result).rejects.toThrowError()
    })
  })

  describe('handleCommand', () => {
    test('it should call logger.info', async () => {
      const sut = new Controller(serviceStub)

      const mockCommand = 'any'
      const expectedString = `command received: ${mockCommand}`

      const loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      await sut.handleCommand({ command: mockCommand })

      expect(loggerInfoSpy).toHaveBeenCalledWith(expectedString)

    })

    test('it should call startStreamming on start command', async () => {
      const sut = new Controller(serviceStub)

      const mockCommand = 'start'
      const expectedResult = {
        result: 'ok'
      }

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})
      const startStreammingSpy = jest.spyOn(serviceStub, serviceStub.startStreamming.name)

      const result = await sut.handleCommand({ command: mockCommand })

      expect(startStreammingSpy).toHaveBeenCalled()
      expect(result).toStrictEqual(expectedResult)
    })

    test('it should call stopStreamming on stop command', async () => {
      const sut = new Controller(serviceStub)

      const mockCommand = 'stop'
      const expectedResult = {
        result: 'ok'
      }

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})
      const stopStreammingSpy = jest.spyOn(serviceStub, serviceStub.stopStreamming.name)

      const result = await sut.handleCommand({ command: mockCommand })

      expect(stopStreammingSpy).toHaveBeenCalled()
      expect(result).toStrictEqual(expectedResult)
    })

    test('it should return undefined on invalid command', async () => {
      const sut = new Controller(serviceStub)

      const mockCommand = 'invalid'
      const expectedResult = undefined

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      const result = await sut.handleCommand({ command: mockCommand })

      expect(result).toStrictEqual(expectedResult)
    })
  })

  describe('createClientStream', () => {
    test('it should call createClientStream', () => {
      const sut = new Controller(serviceStub)

      const mockId = 'any'
      const mockClientStream = TestUtil.generateReadableStream(['data'])

      const createClientStreamSpy = jest.spyOn(serviceStub, serviceStub.createClientStream.name).mockReturnValueOnce({
        id: mockId,
        clientStream: mockClientStream
      })
      
      sut.createClientStream()

      expect(createClientStreamSpy).toHaveBeenCalled()

    })

    test('it should return a readable stream and a callback', () => {
      const sut = new Controller(serviceStub)

      const mockId = 'any'
      const mockClientStream = TestUtil.generateReadableStream(['data'])

      jest.spyOn(serviceStub, serviceStub.createClientStream.name).mockReturnValueOnce({
        id: mockId,
        clientStream: mockClientStream
      })
      
      const result = sut.createClientStream()

      expect(result.stream).toBeInstanceOf(Readable)
      expect(result.onClose).toBeInstanceOf(Function)

    })

    test('onClose should call logger.info and removeClientStream', () => {
      const sut = new Controller(serviceStub)

      const mockId = 'any'
      
      const expectedString = `closing connection of ${mockId}`

      jest.spyOn(serviceStub, serviceStub.createClientStream.name).mockReturnValueOnce({
        id: mockId,
        clientStream: 'whatever'
      })

      const infoSpy = jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      const removeClientStreamSpy = jest.spyOn(serviceStub, serviceStub.removeClientStream.name)
      
      
      const result = sut.createClientStream()

      result.onClose()

      expect(infoSpy).toHaveBeenCalledWith(expectedString)
      expect(removeClientStreamSpy).toHaveBeenCalledWith(mockId)

    })
  })
})
