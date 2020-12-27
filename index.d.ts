declare module 'clpaginator'

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

/**
 * Allows to paginate or split the text in the console, moving the page with arrow keys, awaiting for user action to continue the code.
 * @class Initialize a new instance of Paginator
 */
declare class Paginator {
  /**
   * Initialize a new instance of Paginator
   * @param options You could set options initially
   */
  constructor(options?: pageOptions)

  /**
   * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
   * Use Message option for show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses Promises, awaiting for the Return key pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public print(text:string, options?: pageOptions): Promise<void>

  /**
   * Defines the options
   */
  public options(options?: pageOptions)
}

export {
  pageOptions,
  Paginator
}