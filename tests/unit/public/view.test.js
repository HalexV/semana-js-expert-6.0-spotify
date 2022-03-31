import {jest, expect, describe, test, beforeEach} from '@jest/globals'
import {JSDOM} from 'jsdom'

import View from '../../../public/controller/js/view.js'

describe('#View - test suite for presentation layer', () => {
  const dom = new JSDOM()
  global.document = dom.window.document
  global.window = dom.window

  function makeBtnElement({
    text,
    classList
  } = {
    text: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }) {
    return {
      onclick: jest.fn(),
      classList,
      innerText: text
    }
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.restoreAllMocks()
    

    jest.spyOn(
      document,
      document.getElementById.name
    ).mockReturnValue(makeBtnElement())
  })

  test('#changeCommandBtnsVisibility - given hide=true it should add unassigned class and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()

    jest.spyOn(
      document,
      document.querySelectorAll.name
    ).mockReturnValue([btn])

    view.changeCommandBtnsVisibility()

    expect(btn.classList.add).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')

    expect(() => btn.onclick()).not.toThrow()
  })

  test('#changeCommandBtnsVisibility - given hide=false it should remove unassigned class and reset onclick', () => {
    const view = new View()
    const btn = makeBtnElement()

    jest.spyOn(
      document,
      document.querySelectorAll.name
    ).mockReturnValue([btn])

    view.changeCommandBtnsVisibility(false)

    expect(btn.classList.add).not.toHaveBeenCalled()
    expect(btn.classList.remove).toHaveBeenCalledWith('unassigned')
    expect(btn.onclick.name).toStrictEqual('onClickReset')

    expect(() => btn.onclick()).not.toThrow()
  })

  test('#onLoad', () => {
    const view = new View()
    const changeCommandBtnsVisibilitySpy = jest.spyOn(view, view.changeCommandBtnsVisibility.name).mockReturnValueOnce()

    view.onLoad()

    expect(changeCommandBtnsVisibilitySpy).toHaveBeenCalled()
  })

  test('#onBtnClick - it should return undefined on default assign', async () => {
    const sut = new View()

    const result = await sut.onBtnClick()

    expect(result).toBe(undefined)
  })

  describe('configureOnBtnClick', () => {
    test('it should assign the function to this.onBtnClick', () => {
      const sut = new View()
      const mockFunction = () => {}

      sut.configureOnBtnClick(mockFunction)

      expect(sut.onBtnClick).toBe(mockFunction)
    })
  })
})