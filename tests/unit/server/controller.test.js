import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'

const serviceStub = {
  getFileStream: () => {}
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
})
