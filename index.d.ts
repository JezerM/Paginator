declare module 'clpaginator'

export interface pageOptions {
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
declare namespace paginator {
  /**
   * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
   * Use Message option for show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {number} pageSize Defines the max number of lines to show in console. Use a positive integer.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses Promises, awaiting for the Return key pressed.
   * @returns Promise, resolving in Boolean True.
   */
  async function print(text:string, pageSize: number, options?: pageOptions) {
    
  }
  /**
   * Defines the options
   */
  function options(options?: pageOptions) {
    this.message = options?.message || this.message || 'Paginated text:'
    this.suffix = options?.suffix || this.suffix || '(Use arrow keys)'
    this.exitMessage = options?.exitMessage || this.exitMessage || 'Press return button to exit'
    this.read_to_return = options?.read_to_return != undefined ? options.read_to_return : (this.read_to_return != undefined ? this.read_to_return : true)
  }
}
export {
  paginator,
  pageOptions
}