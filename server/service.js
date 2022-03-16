import fs from 'fs'
import fsPromises from 'fs/promises'
import { randomUUID } from 'crypto'
import config from './config.js'
import { PassThrough } from 'stream'
import path from 'path'

const {
  dir: {
    publicDir
  }
} = config

export class Service {
  constructor() {
    this.clientStreams = new Map()
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
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
}