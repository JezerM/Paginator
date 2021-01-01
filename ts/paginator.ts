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
   * The WriteStream to write on, such as process.stdout
   */
  writable?: NodeJS.WriteStream
  /**
   * The ReadStream to read on, such as process.stdin
   */
  readable?: NodeJS.ReadStream
  /**
   * Sets the maximum number of columns and rows.
   */
  terminal?: { columns: number, rows: number }
}

const defaultOptions = {
  message: 'Paginated text:',
  suffix: '(Use arrow keys)',
  exitMessage: 'Press return button to exit',
  read_to_return: true,
  pageSize: 3,
  writable: process.stdout,
  readable: process.stdin,
}

/**
 * Allows to paginate or split the text in the console, moving the page with arrow keys, awaiting for user action to continue the code.
 * @async It's preffered to use Await/Async to avoid executing next code without waiting user action.
 */
class Paginator {
  private supSaved: string = ''
  private savedText: string = ''
  private _actualText: string = ''
  private _position: number = 0
  private once: boolean = true

  private _opts: pageOptions = {};
  private savedSize: number | undefined
  public get opts(): pageOptions {
    return this._opts;
  }
  public set opts(v: pageOptions) {
    this._opts = v;
  }

  public get pages() {
    return this.savedText.split('\n').length - (this.opts.pageSize || defaultOptions.pageSize)
  }

  public get position() {
    return this._position
  }
  public set position(v: number) {
    this._position = v
    if (this._position > this.pages - 1) {
      this._position = this.pages
    }
    if (this._position <= 0) {
      this._position = 0
    }
    this.updateText()
  }

  public get actualText() {
    return this._actualText
  }

  constructor(options?: pageOptions) { this.options(options) }

  /**
   * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
   * Use Message option for show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses Promises, awaiting for the Return key pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public async print(text: string, options?: pageOptions): Promise<this> {
    this.options(options)

    if (this.opts.pageSize && parseFloat(this.opts.pageSize.toFixed(0)) != this.opts.pageSize) {
      throw Error('You cant pass a floating point number as pageSize')
    } else if (this.opts.pageSize && this.opts.pageSize <= 0) {
      throw Error('You cant pass an equal or below 0 number as pageSize')
    }

    this.supSaved = this.savedText = this._actualText = text

    this.updateText()
    this.once = false

    await new Promise((resolve, reject) => {
      this.opts.readable?.setRawMode(true)
      readline.emitKeypressEvents(this.opts.readable || defaultOptions.readable)
      const obs = fromEvent(this.opts.readable?.resume() || defaultOptions.readable.resume(), 'keypress')
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
    return this
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
    this.opts.terminal = options?.terminal || this.opts.terminal || undefined
    return this
  }

  /**
   * Prepares the console to exit
   */
  private exit() {
    this.opts.readable?.setRawMode(false)
    this.opts.readable?.pause()
    this.opts.pageSize = this.savedSize || (this.opts.pageSize || defaultOptions.pageSize)
    this.savedSize = undefined
    this.savedText = this._actualText = ''
    this._position = 0
    this.once = true
    clear(this.opts.writable || defaultOptions.writable)
    this.opts.writable?.write(ansiEscapes.cursorShow)
  }

  public end() {
    this.exit()
    return this
  }
  /**
   * Moves the page an step down
   */
  private down() {
    this.position++
    this.updateText()
  }
  /**
   * Moves the page an step up
   */
  private up() {
    this.position--
    this.updateText()
  }

  private columns(): number {
    return this.opts.terminal?.columns || this.opts.writable?.columns || defaultOptions.writable.columns
  }
  private rows(): number {
    return this.opts.terminal?.rows || this.opts.writable?.rows || defaultOptions.writable.rows
  }
  /**
   * Updates the @var actualText, getting the actual position on page and printing it in the console
   */
  private updateText() {
    this.format()
    var splitted = this.savedText.split('\n')
    this._actualText = ''
    var final = ''
    splitted.forEach((value, index) => {
      if (index >= this.position && index <= (this.opts.pageSize || defaultOptions.pageSize) - 1 + this.position) {
        this._actualText += value + '\n'
      }
    })
    clear(this.opts.writable || defaultOptions.writable)

    readline.cursorTo(this.opts.writable || defaultOptions.writable, 0, 0)

    var message = `${chalk.bold(this.opts.message)} ${this.once ? chalk.dim(this.opts.suffix) : ''}`

    var exitMessageLength = this.opts.exitMessage ? this.opts.exitMessage.split('\n').length : 0

    var exitMessage = ''

    var moveToExitMessage = ansiEscapes.cursorTo(0, this.rows() - exitMessageLength - 1)
    if (this.opts.read_to_return == true) {
      exitMessage = this.position >= this.pages ? chalk`{blueBright.bold [${this.opts.exitMessage}]}` : chalk`{dim.bold [${this.opts.exitMessage}]}`
    } else {
      exitMessage = chalk`{blueBright.bold [${this.opts.exitMessage}]}`
    }

    var moveDown = ansiEscapes.cursorNextLine
    var pages = chalk`{yellowBright.bold ${this.position + 1}/${this.pages + 1}}`

    final = `${message}\n\n${this._actualText}${moveToExitMessage}${exitMessage}${moveDown}${pages}`
    this.opts.writable?.write(final)
  }
  /**
   * Formats the @var savedText, splitting it to fit well in the console.
   */
  private format() {
    var maxColumns = this.columns()
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
    this.savedSize = this.savedSize || (this.opts.pageSize || defaultOptions.pageSize)
    if ((this.opts.pageSize || defaultOptions.pageSize) >= lines.length) {
      this.opts.pageSize = finalText.split('\n').length
    }
    this.savedText = finalText
  }
}
/**
 * Just clears the console, hiding the cursor
 */
function clear(writable: NodeJS.WriteStream) {
  writable.write(ansiEscapes.cursorTo(0, 0))
  writable.write(ansiEscapes.clearTerminal)
  writable.write(ansiEscapes.cursorHide)
}

export {
  Paginator,
  pageOptions,
  defaultOptions
}