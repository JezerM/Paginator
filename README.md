# **Cl-Paginator** 
## Split and show your text in console with user interaction
This module allows you to split and fit the text in console, dividing it in pages which user can go through.\
I decided to create this based on [Inquirer](https://www.npmjs.com/package/inquirer) paginator util used on its List prompt, 'cause it's quite useful when creating CLI.
## **Installation**
```console
$ npm install cl-paginator
```
## **Usage**
```ts
import { Paginator } from 'cl-paginator'
// const { Paginator } = require('cl-paginator')

var paginator = new Paginator(/* PageOptions */)

paginator.options({/* PageOptions */})
paginator.print(/* just text*/, /* PageOptions*/)
```
Also, you can try it on [Repl.it](https://repl.it/@JezerM/Paginator-test)
## **How this works**
```ts
paginator.print(text:string, options?: pageOptions)
```
Firstly, splits the given text to fit well in the console, without intercalated words. Then, with [rxjs](https://www.npmjs.com/package/rxjs), observes the keybord input to check if UP or DOWN key is pressed, for moving the page up and down.
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
async paginator.print(text:string, options?: pageOptions)
```
#### **Options**
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
```
Also, you can define the default options to be used in every print.
```typescript
paginator.options(options?: pageOptions)
```

## **Examples**
### **Simple Lorem Ipsum**
```ts
var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...' // Just a big lorem ipsum
paginator.print(text, {pageSize: 10}) // Shows 10 lines per page
```
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
### **Stream integration**
```ts
var readline = new readline() // new NodeJS.WriteStream or new NodeJS.WritableStream

var text = var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...' // The same big lorem ipsum
paginator.print(text, {
  pageSize: 10,
  writable: readline // This should allow to write on 'readline' Writable/WriteStream.
})
// Check the examples folder for more info.
```

## **Know issues**
- ~~This doesn't work very well when text uses `\n` as breaklines.~~
- ~~With [chalk](https://www.npmjs.com/package/chalk), when the formatted text is splitted in multiple lines, the text is not showed correctly.~~
- It's possible that Sockets don't work properly, please let me know.

Actually, these problems have been solved.