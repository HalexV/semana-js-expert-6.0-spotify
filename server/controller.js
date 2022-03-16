import {logger} from './util.js'

export class Controller {
  constructor(service) {
    this.service = service
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