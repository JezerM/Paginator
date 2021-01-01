[Inquirer]: https://www.npmjs.com/package/inquirer
[Repl.it]: https://repl.it/@JezerM/Paginator-test
[rxjs]: https://www.npmjs.com/package/rxjs
[Ansi-Escapes]: https://www.npmjs.com/package/ansi-escapes
[Ansi-Regex]: https://www.npmjs.com/package/ansi-regex

[Lorem]: https://user-images.githubusercontent.com/59768785/103432523-ca42e200-4ba5-11eb-9987-e0013fcec7c3.gif
[Chalkie]: https://user-images.githubusercontent.com/59768785/103432543-142bc800-4ba6-11eb-99c4-e47f128a4462.gif
[Streams]: https://user-images.githubusercontent.com/59768785/103432575-e430f480-4ba6-11eb-8922-30dc62ee4a26.gif
[Continues]: https://user-images.githubusercontent.com/59768785/103432549-39b8d180-4ba6-11eb-97a9-22527646963f.gif
[Options]: https://user-images.githubusercontent.com/59768785/103432558-61a83500-4ba6-11eb-80b1-3658d736d3df.gif

# **Cl-Paginator**
## **Split and show your text in console with user interaction**
This Node.js module allows you to split and fit the text in console, dividing it in pages which user can go through.\
I decided to create this based on [Inquirer] paginator util used on some prompts, 'cause it's quite useful when creating a CLI.
![Lorem]

## **Getting started**
### **Installation**
```console
$ npm install cl-paginator
```
### **Usage**
```ts
import { Paginator } from 'cl-paginator'
// const { Paginator } = require('cl-paginator')

var paginator = new Paginator(/* PageOptions */)

paginator.options({/* PageOptions */})
paginator.print(/* just text*/, /* PageOptions */)
```
Also, you can try it on [Repl.it]
## **How this works**
```ts
paginator.print(text: string, options?: pageOptions)
```
Firstly, splits the given text to fit well in the console or the terminal option `terminal: {columns, rows}`, without intercalated words. Then, with [rxjs](rxjs), observes a *ReadStream* (like the keyboard for user input) to check if the **UP** or **DOWN** key is pressed, for moving the actual page.

## **Methods**
### **Print**
```ts
/**
 * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
 * Use Message option for show an static text above the text.
 * @param {string} text Defines the text to split up and fit in the console.
 * @param {pageOptions | undefined} options Defines the options.
 * @async Uses Promises, awaiting for the Return key pressed.
 * @returns Promise, resolving in Boolean True.
 */
async paginator.print(text: string, options?: pageOptions)
```
### **Options**
```ts
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
  terminal?: {columns: number, rows: number}
}
```
Also, you can define the default options to be used in every print.
```typescript
paginator.options(options?: pageOptions): this
// or
var pagCustom = new Paginator(options?: pageOptions)
```
### **End**
Stops the Paginator instance, without closing the program.
```ts
paginator.print('a') // a
paginator.end() // Stops the paginator inmediately, without closing the program with 'process.exit()'
```

## Properties
### **Opts**
Returns the Paginator instance *options*.
```ts
paginator.opts: pageOptions
```

### **Pages**
Returns the Paginator instance total *pages*.
```ts
paginator.pages: number
```

### **Position**
Returns or sets the actual *position* in Paginator instance.
```ts
paginator.position: number // Returns the position
paginator.position = 2 // Sets the position
```

### **Actual Text**
Returns the *actualText*, the text that is writed on *writable* ReadStream.
```ts
paginator.actualText: string
```
## **Chaining**
```ts
paginator.options(/* pageOptions */).print('Hello')

// Due to 'print' method is a promise, you would need to use 'then' to chaining, as the promise returns the Paginator instance.
paginator.print('A').then(pag => pag.print('E')).then(pag => pag.print('I'))
```
## **Examples**
### **Simple Lorem Ipsum**
```ts
var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...' // Just a big lorem ipsum
paginator.print(text, {pageSize: 10}) // Shows 10 lines per page
```
![lorem]
### **Options**
```ts
var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...' // The same big lorem ipsum
paginator.print(lorem, {
  pageSize: 10,
  exitMessage: 'Please, press return to exit :D',
  message: 'A big lorem ipsum!',
  suffix: 'Use those arrows',
  read_to_return: false
})
```
![options]
### **Chalk integration**
```ts
import chalk from 'chalk'
var text = chalk`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod {bold.green tempor incididunt ut labore et dolore magna aliqua...}`
paginator.print(text, {
  pageSize: 10,
  suffix: 'Use the arrows!',
  read_to_return: false
})
```
![chalkie]
### **Stream integration**
```ts
var writable = new Writable() // new NodeJS.WriteStream
var readable = new Readable() // new NodeJS.ReadStream

readable.setRawMode(true)  // Allows Ansi Escaping
// You could use the 'readline' package to 'emitKeypressEvents', or create your own one with its scheme
readable.resume()

var text = var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...' // The same big lorem ipsum
paginator.print(text, {
  pageSize: 10,
  writable: writable, // This allows to write on 'writable' WriteStream.
  readable: readable, // This allows to read the input on 'readable' ReadStream.
})
// Check the examples folder for more info.
```
![Streams]
#### `Writable`
This needs just a bit of configuration, unless you want to make it really useful, such as storing every *chunk* that is writed in the instance.\
**Recommendation**: As this package is oriented to be used in a console, it uses Ansi Escapes to do a lot of things, like erasing the console or hiding/showing the cursor, I recommend you to use a filter that erases all your data when this kind of Ansi Escapes are writed.\
[Ansi-Escapes],
[Ansi-Regex]
```ts
const clearAnsi = ['\x1B[0J', ansiEscapes.clearScreen, ansiEscapes.clearTerminal, /* and so on... */]

// This method is extended from 'WriteStream'. You need to put your code here to make it work, don't overwrite the 'write' method, use '_write' instead
public _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) {
    this.all += chunk // Saves the chunk in a permanent data
    this.data += chunk // Saves the chunk in a temporal data
    this.emit('writed', this.data) // Emits a 'writed' event with the temporal data, to make it versatille

    var reg = this.data.match(ansiRegex()) // Matchs every Ansi Escape
    var match = clearAnsi.some((val) => { return reg?.includes(val) })
    if (match) { this.clear() } // If matchs any Ansi Escape oriented to cleaning~ erase the temporal data
    callback()
  }
```
#### `Readable`
If you want to create an automated *ReadStream* with *`Cl-Paginator`*, you need to use the *readline* key scheme: `{ ctrl: boolean, shift: boolean, meta: boolean, sequence: string, name: string }`.\
Such as:
```ts
import { Key } from 'readline'
class Readable extends ReadStream {
  constructor() {
    super(0)
  }
  public emitKey(key: Key) { // You could make an external function, instead
    this.emit('keypress', null, key)
  }
}
// Then~
var readable = new Readable()
var paginator = new Paginator({ readable })
paginator.print(/* What you want~ */)
readable.emitKey({ name: 'down' }) // "Presses" the down key
readable.emitKey({ name: 'return' }) // "Presses" the return key
readable.emitKey({ name: 'c', ctrl: true }) // Exits the program
```

## **Know issues**
- It's possible that Streams don't work properly, please let me know if there's any problem.
