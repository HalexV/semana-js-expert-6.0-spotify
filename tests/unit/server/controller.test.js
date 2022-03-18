import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'
import {logger} from '../../../server/util.js'

const serviceStub = {
  getFileStream: () => {},
  startStreamming: () => {},
  stopStreamming: () => {}
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
  })
})
