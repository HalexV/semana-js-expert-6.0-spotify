import {describe, test, jest, expect, beforeEach} from '@jest/globals'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import stream, { PassThrough } from 'stream'
import childProcess from 'child_process'

import {Service} from '../../../server/service.js'
import config from '../../../server/config.js'
import TestUtil from '../_util/testUtil.js'

const {
  dir: {
    publicDir
  }
} = config

describe('#Service', () => {
  
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('createClientStream', () => {
    test('it should return an id and a stream', () => {
      const sut = new Service()

      const mockId = 'any'
      const mockPassThrough = new stream.PassThrough()
      
      const randomUUIDSpy = jest.spyOn(crypto, crypto.randomUUID.name).mockReturnValueOnce(mockId)
      const passThroughSpy = jest.spyOn(stream, stream.PassThrough.name).mockImplementationOnce(function () {return mockPassThrough})
      const setSpy = jest.spyOn(sut.clientStreams, sut.clientStreams.set.name)

      const result = sut.createClientStream()

      expect(randomUUIDSpy).toHaveBeenCalled()
      expect(passThroughSpy).toHaveBeenCalled()
      expect(setSpy).toHaveBeenCalledWith(mockId, mockPassThrough)
      expect(result.id).toStrictEqual(mockId)
      expect(result.clientStream).toBeInstanceOf(PassThrough)
    })
  })

  describe('removeClientStream', () => {
    test('it should call clientStreams.delete with id', () => {
      const sut = new Service()

      const mockId = 'any'

      const deleteSpy = jest.spyOn(sut.clientStreams, sut.clientStreams.delete.name).mockImplementationOnce(() => {})

      sut.removeClientStream(mockId)

      expect(deleteSpy).toHaveBeenCalledWith(mockId)
    })
  })

  describe('_executeSoxCommand', () => {
    test('it should call spawn with correct arguments', () => {
      const sut = new Service()

      const mockArgs = ['any', 'any', 'any']

      const spawSpy = jest.spyOn(childProcess, childProcess.spawn.name).mockImplementationOnce(()=>{})

      sut._executeSoxCommand(mockArgs)

      expect(spawSpy).toHaveBeenCalledWith('sox', mockArgs)
    })
  })

  describe('getBitRate', () => {
    test('it should return the string 128000', async () => {
      const sut = new Service()

      const mockSong = 'any'
      const mockArgs = [
        '--i',
        '-B',
        mockSong
      ]

      const stderrMock = TestUtil.generateReadableStream()
      const stdoutMock = TestUtil.generateReadableStream(['128k'])

      const _executeSoxCommandMock = jest.fn().mockReturnValueOnce({
        stderr: stderrMock,
        stdout: stdoutMock
      })

      sut._executeSoxCommand = _executeSoxCommandMock

      const result = await sut.getBitRate(mockSong)

      expect(result).toStrictEqual('128000')
      expect(_executeSoxCommandMock).toHaveBeenCalledWith(mockArgs)

    })
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

  describe('getFileStream', () => {
    test('it should call getFileInfo with file', async () => {
      const sut = new Service()

      const getFileInfoMock = jest.fn().mockResolvedValueOnce({
        name: 'whatever',
        type: 'any'
      })

      const createFileStreamMock = jest.fn().mockReturnValueOnce()

      sut.getFileInfo = getFileInfoMock
      sut.createFileStream = createFileStreamMock 

      const expectedFile = 'any'

      await sut.getFileStream(expectedFile)

      expect(getFileInfoMock).toHaveBeenCalledWith(expectedFile)

    })

    test('it should call createFileStream with name', async () => {
      const sut = new Service()

      const getFileInfoMock = jest.fn().mockResolvedValueOnce({
        name: 'whatever',
        type: 'any'
      })

      const createFileStreamMock = jest.fn().mockReturnValueOnce()

      sut.getFileInfo = getFileInfoMock
      sut.createFileStream = createFileStreamMock 

      const expectedName = 'whatever'

      await sut.getFileStream('any')

      expect(createFileStreamMock).toHaveBeenCalledWith(expectedName)

    })

    test('it should return an object with stream and type on success', async () => {
      const sut = new Service()

      const getFileInfoMock = jest.fn().mockResolvedValueOnce({
        name: 'whatever',
        type: 'any'
      })

      const createFileStreamMock = jest.fn().mockReturnValueOnce('any_stream')

      sut.getFileInfo = getFileInfoMock
      sut.createFileStream = createFileStreamMock 

      const expected = {
        stream: 'any_stream',
        type: 'any'
      }

      const result = await sut.getFileStream('any')

      expect(result).toStrictEqual(expected)

    })

    test('it should throw when getFileInfo throws', async () => {
      const sut = new Service()

      const getFileInfoMock = jest.fn().mockRejectedValueOnce(new Error())

      const createFileStreamMock = jest.fn().mockReturnValueOnce()

      sut.getFileInfo = getFileInfoMock
      sut.createFileStream = createFileStreamMock 

      const result = sut.getFileStream('any')

      await expect(result).rejects.toThrowError()
    })
  })
})