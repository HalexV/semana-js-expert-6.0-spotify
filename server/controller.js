export class Controller {
  constructor(service) {
    this.service = service
  }

  async getFileStream(filename) {
    return this.service.getFileStream(filename)
  }
}