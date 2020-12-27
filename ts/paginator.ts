import 'ansi-escapes'
import ansiEscapes from 'ansi-escapes'

import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import readline from 'readline'
import chalk from 'chalk';
import sliceAnsi from 'slice-ansi'
import stripAnsi from 'strip-ansi'

interface pageOptions {
  /**
   * Defines the max number of lines to show in console. Use a positive integer.
   */
  pageSize?: number,
  /**
   * Shows an static message above the text.
   */
  message?: string
  /**
   * Shows an static, dim message for help, like '(Use arrow keys)'
   */
  suffix?: string
  /**
   * Shows a message for help to continue executing the code. 'Press return button to exit'
   */
  exitMessage?: string
  /**
   * If true, defines if is neccesary to go trough all the pages to continue
   */
  read_to_return?: boolean,
  /**
   * The WritableStream to write on, such as process.stdout
   */
  writable?: NodeJS.WritableStream
  /**
   * The ReadStream to read on, such as process.stdin
   */
  readable?: NodeJS.ReadStream
  /**
   * The Socket to read the keypress, such as process.openStdin
   */
  socket?: () => NodeJS.Socket
}

const defaultOptions = {
  message: 'Paginated text:',
  suffix: '(Use arrow keys)',
  exitMessage: 'Press return button to exit',
  read_to_return: true,
  pageSize: 3,
  writable: process.stdout,
  readable: process.stdin,
  socket: process.openStdin
}

/**
 * Allows to paginate or split the text in the console, moving the page with arrow keys, awaiting for user action to continue the code.
 * @async It's preffered to use Await/Async to avoid executing next code without waiting user action.
 */
class Paginator {
  private supSaved: string = ''
  private savedText: string = ''
  private actualText: string = ''
  private position: number = 0
  private once: boolean = true

  private opts: pageOptions = {}

  constructor(options?: pageOptions) { this.options(options) }

  /**
   * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
   * Use Message option for show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses Promises, awaiting for the Return key pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public async print(text: string, options?: pageOptions) {
    this.options(options)

    if (this.opts.pageSize && parseFloat(this.opts.pageSize.toFixed(0)) != this.opts.pageSize) {
      throw Error('You cant pass a floating point number as pageSize')
    } else if (this.opts.pageSize && this.opts.pageSize <= 0) {
      throw Error('You cant pass an equal or below 0 number as pageSize')
    }

    this.supSaved = this.savedText = this.actualText = text

    this.updateText()
    this.once = false

    var socket = this.opts.socket || defaultOptions.socket
    
    return await new Promise((resolve, reject) => {
      this.opts.readable?.setRawMode(true)
        readline.emitKeypressEvents(this.opts.readable || defaultOptions.readable)
        const obs = fromEvent(socket(), 'keypress')
      var piped = obs.pipe(
        map((x: any) => x[1])
      )
      var sus = piped.subscribe((key: any) => {
        // On Ctrl+C, process.exit()
        if (key && key.ctrl && key.name == 'c') {
          resolve(true)
          this.exit()
          sus.unsubscribe()
          process.exit()
        }
        // On Down arrow key, moves 
        if (key.name == 'down') {
          this.down()
        } else if (key.name == 'up') {
          this.up()
        }
        // If position is equal to last page and key pressed is Return, exits
        if (this.opts.read_to_return == true) {
          if (this.opts.pageSize && key.name == 'return' && this.position >= this.savedText.split('\n').length - this.opts.pageSize) {
            resolve(true)
            this.exit()
            sus.unsubscribe()
          }
        } else {
          if (key.name == 'return') {
            resolve(true)
            this.exit()
            sus.unsubscribe()
          }
        }
      })
    })
  }

  /**
   * Defines the options
   */
  public options(options?: pageOptions) {
    this.opts.message = options?.message || (this.opts.message || defaultOptions.message)
    this.opts.exitMessage = options?.exitMessage || (this.opts.exitMessage || defaultOptions.exitMessage)
    this.opts.pageSize = options?.pageSize || (this.opts.pageSize || defaultOptions.pageSize)
    this.opts.read_to_return = options?.read_to_return != undefined ? options?.read_to_return : (this.opts.read_to_return || defaultOptions.read_to_return)
    this.opts.suffix = options?.suffix || (this.opts.suffix || defaultOptions.suffix)
    this.opts.writable = options?.writable || (this.opts.writable || defaultOptions.writable)
    this.opts.readable = options?.readable || (this.opts.readable || defaultOptions.readable)
    this.opts.socket = options?.socket || (this.opts.socket || defaultOptions.socket)
  }

  /**
   * Prepares the console to exit
   */
  private exit() {
    this.opts.readable?.setRawMode(false)
    this.opts.readable?.pause()
    this.savedText = this.actualText = ''
    this.position = 0
    this.once = true
    clear(this.opts.writable || defaultOptions.writable)
    this.opts.writable?.write(ansiEscapes.cursorShow)
  }
  /**
   * Moves the page an step down
   */
  private down() {
    var length = this.savedText.split('\n').length - (this.opts.pageSize || defaultOptions.pageSize)
    if (this.position <= length - 1) {
      this.position++
    } else {
      this.position = length
    }
    this.updateText()
  }
  /**
   * Moves the page an step up
   */
  private up() {
    if (this.position <= 0) {
      this.position = 0
    } else {
      this.position--
    }
    this.updateText()
  }
  /**
   * Updates the @var actualText, getting the actual position on page and printing it in the console
   */
  private updateText() {
    this.format()
    var splitted = this.savedText.split('\n')
    this.actualText = ''
    splitted.forEach((value, index) => {
      if (index >= this.position && index <= (this.opts.pageSize || defaultOptions.pageSize) - 1 + this.position) {
        this.actualText += value + '\n'
      }
    })
    clear(this.opts.writable || defaultOptions.writable)

    readline.cursorTo(this.opts.writable || defaultOptions.writable, 0, 0)

    var final = `${chalk.bold(this.opts.message)} ${this.once ? chalk.dim(this.opts.suffix) : ''}\n\n${this.actualText}`

    var exitMessageLength = this.opts.exitMessage ? this.opts.exitMessage.split('\n').length : 0

    this.opts.writable?.write(final)
    
    readline.cursorTo(this.opts.writable || defaultOptions.writable, 0, process.stdout.rows - exitMessageLength - 1)
    if (this.opts.read_to_return == true) {
      this.opts.writable?.write(
        this.position >= this.savedText.split('\n').length - (this.opts.pageSize || defaultOptions.pageSize) ? chalk`{blueBright.bold [${this.opts.exitMessage}]}` : chalk`{dim.bold [${this.opts.exitMessage}]}`
      )
    } else {
      this.opts.writable?.write(chalk`{blueBright.bold [${this.opts.exitMessage}]}`)
    }
    readline.moveCursor(this.opts.writable || defaultOptions.writable, 0, 1)
    readline.cursorTo(this.opts.writable || defaultOptions.writable, 0)
    this.opts.writable?.write(chalk`{yellowBright.bold ${this.position + 1}/${this.savedText.split('\n').length - (this.opts.pageSize || defaultOptions.pageSize) + 1}}`)
  }
  /**
   * Formats the @var savedText, splitting it to fit well in the console.
   */
  private format() {
    var maxColumns = process.stdout.columns
    var linesArr = this.supSaved.split('\n')
    var finalText = ''
    linesArr.forEach((value, indexLines, arrLines) => {
      var wordArr = value.split(' ')
      var line = ''
      if (indexLines != 0) {
        finalText += '\n'
      }
      var last = 0
      wordArr.forEach((valueW, indexW, arr) => {
        var actual = stripAnsi(valueW) // Erases ansi codes in every word
        var finalWord = sliceAnsi(value, last + indexW, last + indexW + actual.length) // Slices the real text, keeping ansi codes
        last += actual.length
        arr[indexW] = finalWord
      })

      wordArr.forEach((word, indexWord, arrWords) => {
        var lolLine = stripAnsi(line)
        var lolWord = stripAnsi(word)

        if ((lolLine + lolWord).length > maxColumns) {
          if (lolLine[lolLine.length - 1] === ' ') { // If last character of line is an empty space, delete it
            line = sliceAnsi(line, 0, lolLine.length - 1)
          }
          finalText += line + '\n'
          line = ''
        }
        line += word + ' '
      })

      if (line.length > 0) {
        finalText += line
      }
    })
    var lines = finalText.split('\n')
    if ((this.opts.pageSize || defaultOptions.pageSize) >= lines.length) {
      this.opts.pageSize = finalText.split('\n').length
    }
    this.savedText = finalText
  }
}
/**
 * Just clears the console, hiding the cursor
 */
function clear(writable: NodeJS.WriteStream | NodeJS.WritableStream) {
  readline.cursorTo(writable, 0, 0)
  readline.clearScreenDown(writable)
  writable.write(ansiEscapes.cursorHide)
}

export {
  Paginator,
  pageOptions,
  defaultOptions
}