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
      jest.spyOn(path, path.extname.name).mockResolvedValueOnce()

      await sut.getFileInfo(expectedFile)

      expect(joinSpy).toHaveBeenCalledWith(publicDir, expectedFile)
    })
  })
})