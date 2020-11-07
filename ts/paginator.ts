import 'ansi-escapes'
import ansiEscapes from 'ansi-escapes'

import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import readline from 'readline'
import chalk from 'chalk';

interface pageOptions {
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
   * If true, defines if is neccesary to go trough all the pages to continue.
   */
  read_to_return?: boolean
}

/**
 * Allows to paginate or split the text in the console, moving the page with arrow keys, awaiting for user action to continue the code.
 * @async It's preffered to use Await/Async to avoid executing next code without waiting user action.
 */
class Paginator {
  private supSaved:string = ''
  private savedText:string = ''
  private actualText:string = ''
  private position:number = 0
  private pageSize:number = 0
  private once:boolean = true

  private message: string | undefined
  private suffix: string | undefined
  private exitMessage: string | undefined
  private read_to_return: boolean | undefined

  constructor () {}

  /**
   * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
   * Use Message option for show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {number} pageSize Defines the max number of lines to show in console. Use a positive integer.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses Promises, awaiting for the Return key pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public async print(text:string, pageSize: number, options?: pageOptions) {
    if (parseFloat(pageSize.toFixed(0)) != pageSize) {
      throw Error('You cant pass a floating point number as pageSize')
    } else if (pageSize <= 0) {
      throw Error('You cant pass an equal or below 0 number as pageSize')
    }
    this.options(options)

    this.pageSize = pageSize
    this.supSaved = this.savedText = this.actualText = text

    this.updateText()
    this.once = false

    return await new Promise((resolve, reject) => {
      process.stdin.setRawMode(true)
      readline.emitKeypressEvents(process.stdin)
      var stdin = process.openStdin()
      const obs = fromEvent(stdin, 'keypress')
      var piped = obs.pipe(
        map((x:any) => x[1])
      )
      var sus = piped.subscribe((key:any) => {
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
        if (this.read_to_return == true) {
          if (key.name == 'return' && this.position >= this.savedText.split('\n').length - this.pageSize) {
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
    this.message = options?.message || this.message || 'Paginated text:'
    this.suffix = options?.suffix || this.suffix || '(Use arrow keys)'
    this.exitMessage = options?.exitMessage || this.exitMessage || 'Press return button to exit'
    this.read_to_return = options?.read_to_return != undefined ? options.read_to_return : (this.read_to_return != undefined ? this.read_to_return : true)
  }

  /**
   * Prepares the console to exit
   */
  private exit() {
    process.stdin.setRawMode(false)
    process.stdin.destroy()
    this.savedText = this.actualText =  ''
    this.position = 0
    this.once = true
    clear()
    process.stdout.write(ansiEscapes.cursorShow)
  }
  /**
   * Moves the page an step down
   */
  private down() {
    var length = this.savedText.split('\n').length - this.pageSize
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
      if (index >= this.position && index <= this.pageSize - 1 + this.position) {
        this.actualText += value + '\n'
      }
    })
    clear()
    readline.cursorTo(process.stdout, 0, 0)
    console.log(`${chalk.bold(this.message)} ${ this.once ? chalk.dim(this.suffix): ''}\n`)
    process.stdout.write(this.actualText)
    var exitMessageLength = this.exitMessage ? this.exitMessage.split('\n').length : 0
    readline.cursorTo(process.stdout, 0, process.stdout.rows - exitMessageLength - 1)
    if (this.read_to_return == true) {
      process.stdout.write(
        this.position >= this.savedText.split('\n').length - this.pageSize ? chalk`{blueBright.bold [${this.exitMessage}]}` : chalk`{dim.bold [${this.exitMessage}]}`
      )
    } else {
      process.stdout.write(chalk`{blueBright.bold [${this.exitMessage}]}`)
    }
    readline.moveCursor(process.stdout, 0, 1)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(chalk`{yellowBright.bold ${this.position+1}/${this.savedText.split('\n').length - this.pageSize + 1}}`)
  }
  /**
   * Formats the @var savedText, splitting it to fit well in the console.
   */
  private format() {
    var maxColumns = process.stdout.columns
    var wordArr = this.supSaved.split(' ')
    var finalText = ''
    var line = ''
    wordArr.forEach((word, index, arr) => {
      if ((line + word).length > maxColumns) {
        if ((line).split('')[line.length-1] == ' ') { // If last character of line is an empty space, delete it
          line = line.slice(0, line.length-1)
        }
        finalText += line + '\n'
        line = ''
      }
      line += word + ' '
    })
    if (line.length > 0) {
      finalText += line
    }
    var lines = finalText.split('\n')
    this.savedText = finalText
    if (this.pageSize >= lines.length) {
      this.pageSize = finalText.split('\n').length
    }
  }
}
/**
 * Just clears the console, hiding the cursor
 */
function clear() {
  process.stdout.write(ansiEscapes.cursorTo(0,0) + ansiEscapes.clearTerminal + ansiEscapes.cursorHide)
}

const paginator = new Paginator()

export {
  paginator
}
