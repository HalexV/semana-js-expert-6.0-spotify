import {jest, expect, describe, test, beforeEach} from '@jest/globals'

import config from '../../../server/config.js'

const {
  pages
} = config

describe('#Routes - test suite for api response', () => {
  beforeEach(() => {
    jest.restoreAllMocks(),
    jest.clearAllMocks()
  })
  
  test.todo('GET / - should redirect to home page')
  test.todo(`GET /home - should response with ${pages.homeHTML} file stream`)
  test.todo(`GET /controller - should response with ${pages.controllerHTML} file stream`)
  test.todo(`GET /unknown - given a nonexistent route it should respond with 404`)

  describe('exceptions', () => {
    test.todo('given a nonexistent file it should respond with 404')
    test.todo('given an error file it should respond with 500')
  })
})