import { describe, it, } from 'mocha'
import { Paginator, pageOptions } from '..'
import './readline'
import { keyboard, readline } from './readline'
import fs from 'fs'
import path from 'path'
import { Key } from 'readline'

var kb = new keyboard()
var rl = new readline()

var lorem = ''
try {
  lorem = fs.readFileSync(path.resolve(__dirname, './lorem.txt'), 'utf8')
} catch (err) {
  console.error(err)
  process.exit(0)
}

const customOptions = {
  exitMessage: 'Presiona enter para salir',
  message: 'Texto paginado',
  pageSize: 6,
  read_to_return: true,
  suffix: 'Usa las flechas direccionales para moverte',
  readable: kb,
  writable: rl,
  terminal: { columns: 120, rows: 20 }
}

describe('Paginator', () => {
  describe('options', () => {
    it('Initialize with options', (done) => {
      var pag = new Paginator(customOptions)
      var val: keyof pageOptions
      for (val in customOptions) {
        if (customOptions[val] != pag.opts[val]) {
          return done('Options are not correctly asigned when initializing')
        }
      }
      return done()
    })
    it('Set options with options method', (done) => {
      var pag = new Paginator()
      pag.options(customOptions)
      var val: keyof pageOptions
      for (val in customOptions) {
        if (customOptions[val] != pag.opts[val]) {
          return done('Options are not asigned with options method')
        }
      }
      return done()
    })
  })
  var pag = new Paginator(customOptions)
  var ender = new Paginator(customOptions)

  describe('end', () => {
    ender.options({ writable: new readline(), readable: new keyboard() })
    var opts = ender.opts
    it('opts are unalterated', (done) => {
      ender.end()
      var val: keyof pageOptions
      for (val in opts) {
        if (opts[val] != ender.opts[val]) {
          return done(`Options are not the same as they were initially!`)
        }
      }
      return done()
    })
  }).afterAll((done) => { ender.opts.readable?.emit('end'); done() })
  describe('print', () => {
    pag.print(lorem)

    it('message', (done) => {
      if (rl.data.match(customOptions.message)) {
        done()
      } else {
        done('Message was not writed')
      }
    })
    it('exitMessage', (done) => {
      if (rl.data.match(customOptions.exitMessage)) {
        done()
      } else {
        done('ExitMessage was not writed')
      }
    })
    it('suffix', (done) => {
      if (rl.data.match(customOptions.suffix)) {
        done()
      } else {
        done('Suffix was not writed')
      }
    })
    describe('read to return', () => {
      it('when false', (done) => {
        pag.options({ read_to_return: false })
        if (kb.isPaused()) {
          pag.print(lorem)
        }
        emitKey(pag, { name: 'return' })
        if (rl.isCleared()) {
          done()
        } else { done('Paginator was not ended when read_to_return is false') }
      })
      it('when true', (done) => {
        pag.options({ read_to_return: true })
        if (kb.isPaused()) {
          pag.print(lorem)
        }
        emitKey(pag, { name: 'return' })
        if (!rl.isCleared()) {
          done()
        } else {
          done('Paginator was ended when read_to_return is true')
        }
      })
    })
    describe('pageSize', () => {
      it('lines quantity is lower than pageSize (1 page)', (done) => {
        pag.end()
        pag.print('Hello everybody!')
        var actualText = pag.actualText
        var length = actualText.split('\n').filter((v) => { return v.replace('\n', '') != '' }).length

        if (pag.pages != 0) { return done(`Pages length is not zero. Length: ${length}, pageSize: ${pag.opts.pageSize}`) }

        if (length <= customOptions.pageSize) {
          return done()
        } else {
          return done(`The number of text lines is higher than pageSize. Length: ${length}, pageSize: ${pag.opts.pageSize}`)
        }
      })
      it('lines quantity is higher than pageSize (more than 1 page)', (done) => {
        pag.end()
        pag.print(lorem)
        var actualText = pag.actualText
        var length = actualText.split('\n').filter((v) => { return v.replace('\n', '') != '' }).length

        if (pag.pages == 0) { return done(`Pages number is zero. Length: ${length}, pageSize: ${pag.opts.pageSize}`) }

        if (length == customOptions.pageSize) {
          return done()
        } else {
          return done(`The number of text lines is not equal to pageSize. Length: ${length}, pageSize: ${pag.opts.pageSize}`)
        }
      })
    })
  }).afterAll((done) => {
    pag.end()
    done()
  })
  describe('interaction', () => {
    describe('showing more text', () => {
      it('up key', (done) => {
        var pagUp = new Paginator(customOptions).options({ readable: new keyboard(), writable: new readline() })
        pagUp.print(lorem)
        
        pagUp.position++
        var downText = pagUp.actualText
        emitKey(pagUp, { name: 'up' })
        var upperText = pagUp.actualText

        if (downText == upperText) {
          done('Text did not change when UP')
        }

        var downLines = downText.split('\n')
        var upperLines = upperText.split('\n')

        var equal = downLines.every((line, ind) => {
          if (ind >= (pagUp.opts.pageSize || customOptions.pageSize) - 1) {
            return true;
          }
          if (line != upperLines[ind + 1]) {
            return false
          }
          return true
        })
        if (!equal) {
          done('Mid lines are not equal')
        } else {
          done()
        }
        pagUp.opts.readable?.emit('end')
      })
      it('down key', (done) => {
        var pagDown = new Paginator(customOptions).options({ readable: new keyboard(), writable: new readline() })
        pagDown.print(lorem)

        var upperText = pagDown.actualText
        emitKey(pagDown, { name: 'down' })
        var downText = pagDown.actualText

        if (downText == upperText) {
          done('Text did not change when DOWN')
        }

        var downLines = downText.split('\n')
        var upperLines = upperText.split('\n')

        var equal = downLines.every((line, ind) => {
          if (ind >= (pagDown.opts.pageSize || customOptions.pageSize) - 1) {
            return true;
          }
          if (line != upperLines[ind + 1]) {
            return false
          }
          return true
        })
        if (!equal) {
          done('Mid lines are not equal')
        } else {
          done()
        }
        pagDown.opts.readable?.emit('end')
      })
    })
    describe('limits', () => {
      it('upper limit', (done) => {
        var pagUp = new Paginator(customOptions).options({ readable: new keyboard(), writable: new readline() })
        pagUp.print(lorem)
        var initialText = pagUp.actualText
        pagUp.position--
        var secondText = pagUp.actualText
        if (initialText == secondText) {
          done()
        } else {
          done('The text changes even if position is in the upper limit')
        }
        pagUp.opts.readable?.emit('end')
      })
      it('bottom limit', (done) => {
        var pagDown = new Paginator(customOptions).options({ readable: new keyboard(), writable: new readline() })
        pagDown.print(lorem)
        pagDown.position = pagDown.pages
        var initialText = pagDown.actualText
        pagDown.position++
        var secondText = pagDown.actualText
        if (initialText == secondText) {
          done()
        } else {
          done('The text changes even if position is in the upper limit')
        }
        pagDown.opts.readable?.emit('end')
      })
    })
  })
}).afterAll((done) => {
  kb.emit('end')
  done()
})

function getProperty(pag: Paginator, toFind: string): string {
  return Object.entries(pag).filter((v) => {
    return v[0] == toFind
  }).flat()[1]
}

function emitKey(pag: Paginator, key: Key, times: number = 1) {
  var readable = pag.opts.readable
  for (let i = 0; i < times; i++) {
    readable?.emit('keypress', null, key)
  }
}