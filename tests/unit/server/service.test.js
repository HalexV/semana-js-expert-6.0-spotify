import {describe, test, jest, expect} from '@jest/globals'
import fs from 'fs'

import {Service} from '../../../server/service.js'

describe('#Service', () => {
  describe('createFileStream', () => {
    test('it should call createReadStream with filename', () => {
      const sut = new Service()
      const expectedFilename = 'any'

      const createReadStreamSpy = jest.spyOn(fs, fs.createReadStream.name).mockReturnValue()

      sut.createFileStream(expectedFilename)

      expect(createReadStreamSpy).toHaveBeenCalledWith(expectedFilename)
    })
  })
})