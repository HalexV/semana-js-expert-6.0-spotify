import {describe, test, jest, expect, beforeEach} from '@jest/globals'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import stream, { PassThrough, Writable } from 'stream'
import childProcess from 'child_process'
import Throttle from 'throttle'
import streamsPromises from 'stream/promises'

import {Service} from '../../../server/service.js'
import config from '../../../server/config.js'
import TestUtil from '../_util/testUtil.js'
import {logger} from '../../../server/util.js'

const {
  dir: {
    publicDir,
    fxDir
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

      const stderrMock = TestUtil.generateReadableStream([])
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

    test('it should return the string 128000 on error', async () => {
      const sut = new Service()

      const mockSong = 'any'
      const mockArgs = [
        '--i',
        '-B',
        mockSong
      ]

      const expectedString = 'deu ruim no bitrate error'

      const stderrMock = TestUtil.generateReadableStream(['error'])
      const stdoutMock = TestUtil.generateReadableStream(['128k'])

      const _executeSoxCommandMock = jest.fn().mockReturnValueOnce({
        stderr: stderrMock,
        stdout: stdoutMock
      })

      const errorSpy = jest.spyOn(logger, 'error').mockImplementationOnce(() => {})

      sut._executeSoxCommand = _executeSoxCommandMock

      const result = await sut.getBitRate(mockSong)

      expect(result).toStrictEqual('128000')
      expect(_executeSoxCommandMock).toHaveBeenCalledWith(mockArgs)
      expect(errorSpy).toHaveBeenCalledWith(expectedString)

    })
  })

  describe('broadCast', () => {
    test('it should return a writable', () => {
      const sut = new Service()

      const result = sut.broadCast()

      expect(result).toBeInstanceOf(Writable)
    })

    test('it should call this.clientStreams.delete when stream.writableEnded is true', done => {
      const sut = new Service()

      const mockId = 'any'
      const mockStream = TestUtil.generateWritableStream()
      const callbackSpy = jest.fn().mockImplementationOnce(() => {
        try {
          expect(callbackSpy).toHaveBeenCalled()
          done()
        } catch (error) {
          done(error)
        }
      })

      mockStream.end()

      sut.clientStreams.set(mockId, mockStream)

      const deleteSpy = jest.spyOn(sut.clientStreams, sut.clientStreams.delete.name)

      const writableStream = sut.broadCast()

      writableStream.write('any','utf-8',callbackSpy)

      expect(deleteSpy).toHaveBeenCalledTimes(1)
      expect(deleteSpy).toHaveBeenCalledWith(mockId)
      
    })

    test('it should call stream.write with chunk when stream.writableEnded is false', done => {
      const sut = new Service()

      const mockId = 'any'
      let expectedChunk;
      const mockStream = TestUtil.generateWritableStream((chunk) => {
        expectedChunk = chunk.toString()
      })
      const callbackSpy = jest.fn().mockImplementationOnce(() => {
        try {
          expect(callbackSpy).toHaveBeenCalled()
          done()
        } catch (error) {
          done(error)
        }
      })

      const writeSpy = jest.spyOn(mockStream, 'write')

      sut.clientStreams.set(mockId, mockStream)

      const writableStream = sut.broadCast()

      writableStream.write('any','utf-8',callbackSpy)

      expect(writeSpy).toHaveBeenCalled()
      expect(expectedChunk).toStrictEqual('any')
    })
  })

  describe('startStreamming', () => {
    test('it should call logger.info with the string', async () => {
      const sut = new Service()

      const mockCurrentSong = 'any'
      const expectedString = `starting with ${mockCurrentSong}`

      sut.currentSong = mockCurrentSong

      const infoSpy = jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      sut.getBitRate = jest.fn().mockResolvedValueOnce(100000)

      sut.createFileStream = () => {}
      sut.broadCast = () => {}

      jest.spyOn(streamsPromises, streamsPromises.pipeline.name).mockImplementationOnce(() => {})

      await sut.startStreamming()

      expect(infoSpy).toBeCalledWith(expectedString)
    })

    test('it should call this.getBitRate with this.currentSong', async () => {
      const sut = new Service()

      const mockCurrentSong = 'any'

      sut.currentSong = mockCurrentSong

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      const getBitRateSpy = sut.getBitRate = jest.fn().mockResolvedValueOnce(100000)

      sut.createFileStream = () => {}
      sut.broadCast = () => {}

      jest.spyOn(streamsPromises, streamsPromises.pipeline.name).mockImplementationOnce(() => {})

      await sut.startStreamming()

      expect(getBitRateSpy).toBeCalledWith(mockCurrentSong)
    })

    test('this.throttleTransform should be a Throttle', async () => {
      const sut = new Service()

      const mockCurrentSong = 'any'

      sut.currentSong = mockCurrentSong

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      sut.getBitRate = jest.fn().mockResolvedValueOnce(100000)

      sut.createFileStream = () => {}
      sut.broadCast = () => {}

      jest.spyOn(streamsPromises, streamsPromises.pipeline.name).mockImplementationOnce(() => {})

      await sut.startStreamming()

      expect(sut.throttleTransform).toBeInstanceOf(Throttle)
    })

    test('it should call this.createFileStream with this.currentSong', async () => {
      const sut = new Service()

      const mockCurrentSong = 'any'

      sut.currentSong = mockCurrentSong

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      sut.getBitRate = jest.fn().mockResolvedValueOnce(100000)

      sut.createFileStream = jest.fn()
      sut.broadCast = () => {}

      jest.spyOn(streamsPromises, streamsPromises.pipeline.name).mockImplementationOnce(() => {})

      await sut.startStreamming()

      expect(sut.createFileStream).toHaveBeenCalledWith(mockCurrentSong)
    })

    test('it should call pipeline with the correct parameters', async () => {
      const sut = new Service()

      const mockCurrentSong = 'any'
      const mockSongReadable = TestUtil.generateReadableStream(['any'])
      const mockBroadCast = TestUtil.generateWritableStream()
      let pipelineArguments;

      sut.currentSong = mockCurrentSong

      jest.spyOn(logger, 'info').mockImplementationOnce(() => {})

      sut.getBitRate = jest.fn().mockResolvedValueOnce(100000)

      sut.createFileStream = () => mockSongReadable
      sut.broadCast = () => mockBroadCast

      jest.spyOn(streamsPromises, streamsPromises.pipeline.name).mockImplementationOnce(function () {
        pipelineArguments = {
          mockSongReadable: arguments['0'],
          mockBroadCast: arguments['2']
        }
      })

      await sut.startStreamming()

      expect(pipelineArguments).toMatchObject({
        mockSongReadable,
        mockBroadCast
      })
    })
  })

  describe('stopStreamming', () => {
    test('it should call this.throttleTransform.end', () => {
      const sut = new Service()

      sut.throttleTransform = {
        end: jest.fn()
      }

      sut.stopStreamming()

      expect(sut.throttleTransform.end).toHaveBeenCalled()
    })

    test('it should return undefined when this.throttleTransform is undefined', () => {
      const sut = new Service()

      const result = sut.stopStreamming()

      expect(result).toBe(undefined)
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

  describe('readFxByName', () => {
    test('it should call fsPromises.readdir with fxDir', async () => {
      const sut = new Service()
      const fxName = 'any'
      const mockSongs = ['Any', 'Whatever']
      const readdirSpy = jest.spyOn(fsPromises, fsPromises.readdir.name).mockResolvedValueOnce(mockSongs)
      jest.spyOn(path, path.join.name).mockReturnValueOnce()

      await sut.readFxByName(fxName)

      expect(readdirSpy).toHaveBeenCalledWith(fxDir)
    })

    test('it should call path.join with fxDir and chosenSong', async () => {
      const sut = new Service()
      const fxName = 'any'
      const mockSongs = ['Any', 'Whatever']
      const mockChosenSong = 'Any'
      jest.spyOn(fsPromises, fsPromises.readdir.name).mockResolvedValueOnce(mockSongs)
      const joinSpy = jest.spyOn(path, path.join.name).mockReturnValueOnce()

      await sut.readFxByName(fxName)

      expect(joinSpy).toHaveBeenCalledWith(fxDir, mockChosenSong)
    })

    test('it should throw when chosenSong is undefined', async () => {
      const sut = new Service()
      const fxName = 'invalid'
      const mockSongs = ['Any', 'Whatever']
      jest.spyOn(fsPromises, fsPromises.readdir.name).mockResolvedValueOnce(mockSongs)
      jest.spyOn(path, path.join.name).mockReturnValueOnce()

      const result = sut.readFxByName(fxName)

      await expect(result).rejects.toThrowError(`the song ${fxName} wasn't found!`)
    })
  })
})