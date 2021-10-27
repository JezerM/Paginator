import chalk, { Chalk } from "chalk";

declare module "clpaginator";

interface pageOptions {
  /**
   * Defines the max number of lines to show in console. Use a positive integer
   * @default 5
   */
  page_size?: number;
  /**
   * Shows an static message above the text
   * @default "Paginated text:"
   */
  message?: string;
  /**
   * Shows a short suffix to help the user
   * @default "(Use arrow keys)"
   */
  suffix?: string;
  /**
   * Shows a message for help to continue executing the code
   * @default "Press return key to exit"
   */
  exit_message?: string;
  /**
   * Whether it's necessary to read all (going to bottom) or not to quit
   * @default true
   */
  read_to_return?: boolean;
  /**
   * The `NodeJS.WriteStream` to write on
   * @default process.stdout
   */
  writable?: NodeJS.WriteStream;
  /**
   * The `NodeJS.ReadStream` to read from
   * @default process.stdin
   */
  readable?: NodeJS.ReadStream;
  /**
   * Sets the maximum number of columns and rows.
   * @default { cols: 0, rows: 0 } // Automatic
   */
  terminal?: { cols?: number; rows?: number };
  /**
   * Sets the paginator style
   * @default { }
   */
  style?: { enum?: Chalk };
}

/**
 * Allows to paginate or trunk the text in the console, moving it with arrow keys and awaiting for user interaction to continue the code.
 * @async It's preffered to use await/async to avoid executing next code without user action
 * @class Initialize a new instance of Paginator
 */
declare class Paginator {
  /**
   * Initialize a new instance of Paginator
   * @param options You could set options initially
   */
  constructor(options?: pageOptions);

  /**
   * Captures key arrows to move the text UP and DOWN with a determinate `page_size`.
   * Use `message` option to show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses promises, awaiting for the Return key to be pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public print(text: string, options?: pageOptions): Promise<this>;

  /**
   * Updates the text
   */
  public update_text(): void;

  /**
   * Defines the options
   */
  public options(options?: pageOptions): this;
  /**
   * Ends the paginator
   */
  public end(): this;

  /**
   * Gets the number of pages the paginator have
   */
  public pages: number;

  /**
   * Gets or sets the actual position in paginator
   */
  public get position(): number;

  public set position(v: number);

  /**
   * Gets the actual text, the one is writed on WriteStream
   */
  public get actual_text(): string;
  /**
   * Gets the saved text, the one passed as argument to `Paginator.print`
   */
  public get saved_text(): string;

  /**
   * Gets the options
   */
  public opts: Required<pageOptions>;
}

declare const defaultOptions: Required<pageOptions>;

export { pageOptions, Paginator, defaultOptions };
