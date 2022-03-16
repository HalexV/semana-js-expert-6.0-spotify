import {describe, test, jest, expect, beforeEach} from '@jest/globals'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'

import {Service} from '../../../server/service.js'
import config from '../../../server/config.js'

const {
  dir: {
    publicDir
  }
} = config

describe('#Service', () => {
  
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('createFileStream', () => {
    test('it should call createReadStream with filename', () => {
      const sut = new Service()
      const expectedFilename = 'any'

      const createReadStreamSpy = jest.spyOn(fs, fs.createReadStream.name).mockReturnValueOnce()

      sut.createFileStream(expectedFilename)

      expect(createReadStreamSpy).toHaveBeenCalledWith(expectedFilename)
    })

    test('it should throw when createReadStream throws', () => {
      const sut = new Service()
      const expectedFilename = 'any'

      jest.spyOn(fs, fs.createReadStream.name).mockImplementationOnce(() => {throw new Error()})

      expect(() => sut.createFileStream(expectedFilename)).toThrowError()
    })
  })

  describe('getFileInfo', () => {
    test('it should call join with publicDir and file', async () => {
      const sut = new Service()
      const expectedFile = 'any'
      
      const joinSpy = jest.spyOn(path, path.join.name).mockReturnValueOnce()
      jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValueOnce()
      jest.spyOn(path, path.extname.name).mockReturnValueOnce()

      await sut.getFileInfo(expectedFile)

      expect(joinSpy).toHaveBeenCalledWith(publicDir, expectedFile)
    })

    test('it should call access with fullFilePath', async () => {
      const sut = new Service()
      const expectedFullFilePath = 'any'
      
      jest.spyOn(path, path.join.name).mockReturnValueOnce(expectedFullFilePath)
      const accessSpy = jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValueOnce()
      jest.spyOn(path, path.extname.name).mockReturnValueOnce()

      await sut.getFileInfo('any')

      expect(accessSpy).toHaveBeenCalledWith(expectedFullFilePath)
    })

    test('it should call extname with fullFilePath', async () => {
      const sut = new Service()
      const expectedFullFilePath = 'any'
      
      jest.spyOn(path, path.join.name).mockReturnValueOnce(expectedFullFilePath)
      jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValueOnce()
      const extnameSpy = jest.spyOn(path, path.extname.name).mockReturnValueOnce()

      await sut.getFileInfo('any')

      expect(extnameSpy).toHaveBeenCalledWith(expectedFullFilePath)
    })

    test('it should return an object with type and name on success', async () => {
      const sut = new Service()
      const mockFullFilePath = 'any'
      const mockFileType = 'any'

      const expected = {
        type: mockFileType,
        name: mockFullFilePath
      }
      
      jest.spyOn(path, path.join.name).mockReturnValueOnce(mockFullFilePath)
      jest.spyOn(fsPromises, fsPromises.access.name).mockResolvedValueOnce()
      jest.spyOn(path, path.extname.name).mockReturnValueOnce(mockFileType)

      const result = await sut.getFileInfo('any')

      expect(result).toStrictEqual(expected)
    })

    test('it should throw when access throws', async () => {
      const sut = new Service()

      jest.spyOn(path, path.join.name).mockReturnValueOnce()
      jest.spyOn(fsPromises, fsPromises.access.name).mockRejectedValueOnce(new Error())
      jest.spyOn(path, path.extname.name).mockReturnValueOnce()

      const result = sut.getFileInfo('any')

      expect(result).rejects.toThrowError()
    })
  })
})