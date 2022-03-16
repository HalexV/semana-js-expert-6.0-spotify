import { join, dirname } from 'path'
import {fileURLToPath} from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const root = join(currentDir, '../')
const audioDir = join(root, '/audio')
const publicDir = join(root, '/public')

const songsDir = join(audioDir, 'songs')

export default {
  port: process.env.PORT || 3000,
  dir: {
    root,
    audioDir,
    publicDir,
    songsDir,
    fxDir: join(audioDir, 'fx')
  },
  pages: {
    homeHTML: 'home/index.html',
    controllerHTML: 'controller/index.html'
  },
  location: {
    home: '/home',
  },
  constants: {
    CONTENT_TYPE: {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
    },
    audioMediaType: 'mp3',
    songVolume: '0.99',
    fallbackBitRate: '128000',
    bitRateDivisor: 8,
    englishConversation: join(songsDir, 'conversation.mp3')
  }
}