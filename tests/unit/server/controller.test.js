import { describe, test, jest, expect } from '@jest/globals'
import { Controller } from '../../../server/controller'

const serviceStub = {
  getFileStream: jest.fn()
}

describe('#Controller', () => {
  
  describe('getFileStream', () => {
    test('it should call getFileStream with filename', async () => {
      const sut = new Controller(serviceStub)
      const expectedFileName = 'any'
  
      const getFileStreamSpy = jest.spyOn(serviceStub, 'getFileStream').mockResolvedValueOnce()
  
      await sut.getFileStream(expectedFileName)
  
      expect(getFileStreamSpy).toHaveBeenCalledWith(expectedFileName)
    })

    test('it should throw when getFileStream throws', async () => {
      const sut = new Controller(serviceStub)
      const expectedFileName = 'any'
  
      jest.spyOn(serviceStub, 'getFileStream').mockRejectedValueOnce(new Error())
  
      const result = sut.getFileStream(expectedFileName)
  
      await expect(result).rejects.toThrowError()
    })
  })
})
