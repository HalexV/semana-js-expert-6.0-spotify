import {logger} from './util.js'

export class Controller {
  constructor(service) {
    this.service = service
  }

  async handleCommand({ command }) {
    logger.info(`command received: ${command}`)
    
    const result = {
      result: 'ok'
    }
    
    const cmd = command.toLowerCase()

    if(cmd.includes('start')) {
      this.service.startStreamming()
      return result
    }

    if(cmd.includes('stop')) {
      this.service.stopStreamming()
      return result
    }

  }

  async getFileStream(filename) {
    return this.service.getFileStream(filename)
  }

  createClientStream() {
    const {id, clientStream} = this.service.createClientStream()

    const onClose = () => {
      logger.info(`closing connection of ${id}`)
      this.service.removeClientStream(id)
    }

    return {
      stream: clientStream,
      onClose
    }
  }
}