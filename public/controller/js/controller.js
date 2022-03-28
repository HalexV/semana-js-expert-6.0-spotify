export default class Controller {
  constructor({view, service}) {
    this.view = view
    this.service = service
  }

  static initialize(dependencies) {
    const controller = new Controller(dependencies)
    controller.onLoad()
    return controller
  }

  onLoad() {
    this.view.onLoad()
  }
}