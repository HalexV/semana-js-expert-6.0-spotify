import fs from 'fs'
import fsPromises from 'fs/promises'
import crypto from 'crypto'
import config from './config.js'
import stream, { PassThrough, Writable } from 'stream'
import path from 'path'
import Throttle from 'throttle'
import childProcess from 'child_process'
import {logger} from './util.js'
import streamsPromises from 'stream/promises'
import events from 'events'

const {
  dir: {
    publicDir,
    fxDir
  },
  constants: {
    fallbackBitRate,
    englishConversation,
    bitRateDivisor,
    audioMediaType,
    songVolume,
    fxVolume
  }
} = config

export class Service {
  constructor() {
    this.clientStreams = new Map()
    this.currentSong = englishConversation
    this.currentBitRate = 0
    this.throttleTransform = {}
    this.currentReadable = {}
  }

  createClientStream() {
    const id = crypto.randomUUID()
    const clientStream = new stream.PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
  }

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(song) {
    try {
      const args = [
        '--i',
        '-B',
        song
      ]

      const {
        stderr, // tudo que é erro
        stdout, // tudo que é log
        // stdin // enviar dados como stream
      } = this._executeSoxCommand(args)

      
      await Promise.all([
        events.once(stdout, 'readable'),
        events.once(stderr, 'readable')
      ])

      const [success, error] = [stdout, stderr].map(stream => stream.read())

      if(error) return await Promise.reject(error)

      return success
      .toString()
      .trim()
      .replace(/k/, '000')
    } catch (error) {
      logger.error(`deu ruim no bitrate ${error}`)
      return fallbackBitRate
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk,enc,cb) => {
        for(const [id, stream] of this.clientStreams) {
          // se o cliente desconectou não devemos mais mandar dados pra ele
          if(stream.writableEnded) {
            this.clientStreams.delete(id)
            continue
          }

          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreamming() {
    logger.info(`starting with ${this.currentSong}`)
    const bitRate = this.currentBitRate = (await this.getBitRate(this.currentSong)) / bitRateDivisor
    const throttleTransform = this.throttleTransform = new Throttle(bitRate)
    const songReadable = this.currentReadable = this.createFileStream(this.currentSong)
    return streamsPromises.pipeline(
      songReadable,
      throttleTransform,
      this.broadCast()
    )
  }

  stopStreamming() {
    this.throttleTransform?.end?.()
  }
  
  createFileStream(filename) {
    return fs.createReadStream(filename)
  }

  async getFileInfo(file) {
    // file = home/index.html
    const fullFilePath = path.join(publicDir, file)
    // valida se existe, se não estoura erro
    await fsPromises.access(fullFilePath)
    const fileType = path.extname(fullFilePath)

    return {
      type: fileType,
      name: fullFilePath
    }
  }

  async getFileStream(file) {
    const {
      name,
      type
    } = await this.getFileInfo(file)
    
    return {
      stream: this.createFileStream(name),
      type
    }
  }

  async readFxByName(fxName) {
    const songs = await fsPromises.readdir(fxDir)
    const chosenSong = songs.find(filename => filename.toLowerCase().includes(fxName))
    if(!chosenSong) return Promise.reject(new Error(`the song ${fxName} wasn't found!`))

    return path.join(fxDir, chosenSong)
  }

  appendFxStream(fx) {
    const throttleTransformable = new Throttle(this.currentBitRate)
    streamsPromises.pipeline(
      throttleTransformable,
      this.broadCast()
    )

    const unpipe = () => {
      const transformStream = this.mergeAudioStreams(fx, this.currentReadable)
      this.throttleTransform = throttleTransformable
      this.currentReadable = transformStream
      this.currentReadable.removeListener('unpipe', unpipe)

      streamsPromises.pipeline(
        transformStream,
        throttleTransformable
      )
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause()
    this.currentReadable.unpipe(this.throttleTransform)

    
  }

  mergeAudioStreams(song, readable) {
    const transformStream = PassThrough()
    const args = [
      '-t', audioMediaType,
      '-v', songVolume,
      // -m => merge -> o - é para receber como stream
      '-m', '-',
      '-t', audioMediaType,
      '-v', fxVolume,
      song,
      '-t', audioMediaType,
      '-'
    ]

    const {
      stdout,
      stdin
    } = this._executeSoxCommand(args)

    // plugamos a stream de conversacao
    // na entrada de dados do terminal
    streamsPromises.pipeline(
      readable,
      stdin,
    )
    // .catch(error => logger.error(`error on sending stream to sox: ${error}`))

    streamsPromises.pipeline(
      stdout,
      transformStream
    )
    // .catch(error => logger.error(`error on receiving stream from sox: ${error}`))

    return transformStream
  }
}