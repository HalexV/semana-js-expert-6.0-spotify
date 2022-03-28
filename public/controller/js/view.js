export default class View {
  onLoad() {
    this.changeCommandBtnsVisibility()
  }

  changeCommandBtnsVisibility(hide = true) {
    Array.from(document.querySelectorAll('[name=command]'))
    .forEach(btn => {
      const fn = hide ? 'add' : 'remove'
      function onClickReset() {}
      btn.classList[fn]('unassigned')
      btn.onclick = onClickReset
    })
  }
}