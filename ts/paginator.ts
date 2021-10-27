import ansiRegex from "ansi-regex";
import chalk, { Chalk } from "chalk";
import stripAnsi from "strip-ansi";
import readline from "readline";

interface pageOptions {
  page_size?: number;
  message?: string;
  suffix?: string;
  exit_message?: string;
  read_to_return?: boolean;
  writable?: NodeJS.WriteStream;
  readable?: NodeJS.ReadStream;
  terminal?: { rows?: number; cols?: number };
  style?: { enum?: Chalk };
}

const defaultOptions: Required<pageOptions> = {
  page_size: 5,
  message: "Paginated text:",
  suffix: "(Use arrow keys)",
  exit_message: "Press return key to exit",
  read_to_return: true,
  readable: process.stdin,
  writable: process.stdout,
  terminal: { rows: 0, cols: 0 },
  style: {},
};

function limit(val: number, min: number, max: number) {
  if (val > max - 1) {
    return (val = max);
  } else if (val <= min) {
    return (val = min);
  }
  return val;
}

/**
 * Allows to paginate or trunk the text in the console, moving it with arrow keys and awaiting for user interaction to continue the code.
 * @async It's preffered to use await/async to avoid executing next code without user action
 * @class Initialize a new instance of Paginator
 */
class Paginator {
  private _saved_text: string = "";
  private _stripped_text: string[] = [];
  private _actual_text: string = "";
  private _position: number = 0;
  private _opts: Required<pageOptions> = defaultOptions;

  private get rows(): number {
    return this.opts.terminal.rows || this.opts.writable.rows;
  }
  private get columns(): number {
    return this.opts.terminal.cols || this.opts.writable.columns;
  }

  public get saved_text() {
    return this._saved_text;
  }
  public get actual_text() {
    return this._actual_text;
  }

  public get pages() {
    return Math.max(this._stripped_text.length - this.opts.page_size, 0);
  }

  public get position(): number {
    return this._position;
  }
  public set position(v: number) {
    this._position = limit(v, 0, this.pages);
  }

  public get opts(): Required<pageOptions> {
    return this._opts;
  }

  constructor(options?: pageOptions) {
    this.options(options);
  }

  public options(opts?: pageOptions): this {
    this.opts.page_size = opts?.page_size ?? this.opts.page_size;
    this.opts.message = opts?.message ?? this.opts.message;
    this.opts.suffix = opts?.suffix ?? this.opts.suffix;
    this.opts.exit_message = opts?.exit_message ?? this.opts.exit_message;
    this.opts.read_to_return = opts?.read_to_return ?? this.opts.read_to_return;
    this.opts.readable = opts?.readable ?? this.opts.readable;
    this.opts.writable = opts?.writable ?? this.opts.writable;
    this.opts.terminal = opts?.terminal ?? this.opts.terminal;
    this.opts.style = opts?.style ?? this.opts.style;
    return this;
  }

  private exit(): void {
    if (this.opts.readable.isTTY) this.opts.readable.setRawMode(false);
    this.opts.readable.pause();
    this._saved_text = this._actual_text = "";
    this._position = 0;
    this.opts.writable.write("\x1b[H\x1b[J");
    this.opts.writable.write("\x1b[?25h");
  }
  public end() {
    this.exit();
    return this;
  }

  private strip_text(text: string): string[] {
    let orig_lines: string[] = text.split("\n");
    let lines: string[] = [];
    let ansi_codes: string[] = [];

    for (let p = 0; p < orig_lines.length; p++) {
      orig_lines[p] = orig_lines[p].replace(/\r/g, "");
      let ansi_line = orig_lines[p];

      let wordArr: string[] = ansi_line.split(" ");

      let line_number: string = this.opts.style.enum
        ? this.opts.style.enum(lines.length + 1)
        : "";
      let push_line: string = "" + line_number + " ";
      for (let i = 0; i < wordArr.length; i++) {
        let word: string = wordArr[i];
        let next_word: string = i + 1 < wordArr.length ? wordArr[i + 1] : "";

        let matched = word.match(ansiRegex());
        matched?.forEach((v) => {
          ansi_codes.push(v);
        });

        let line_number: string = this.opts.style.enum
          ? this.opts.style.enum(lines.length + 2)
          : "";

        let line_length: number =
          stripAnsi(push_line).length +
          stripAnsi(word).length +
          stripAnsi(line_number).length;

        if (line_length >= this.columns) {
          lines.push(push_line);
          push_line = "" + line_number + " " + ansi_codes.join("");
        }
        push_line += word + " ";
        if (i + 1 >= wordArr.length) {
          push_line += next_word;
          lines.push(push_line);
          push_line = "" + line_number + " " + ansi_codes.join("");
        }
      }
    }

    return lines;
  }

  private manage_keys(data: Buffer): boolean {
    let keys: number[] = data.toJSON().data;
    if (keys.length == 0) return false;

    if (keys[0] == 3) {
      // 'Ctrl + c' key
      this.exit();
      return true;
    } else if (keys[0] == 27 && keys[1] == 91) {
      if (keys[2] == 66) {
        // Down
        this.position++;
      } else if (keys[2] == 65) {
        // Up
        this.position--;
      }
    } else if (keys[0] == 106) {
      // 'j' key
      this.position++;
    } else if (keys[0] == 107) {
      // 'k' key
      this.position--;
    }

    if (this.opts.read_to_return == true) {
      if ((keys[0] == 13 || keys[0] == 10) && this.position >= this.pages) {
        this.exit();
        return true;
      }
    } else {
      if (keys[0] == 13) {
        this.exit();
        return true;
      }
    }
    return false;
  }

  public update_text(): void {
    let stripped_arr: string[] = this.strip_text(this._saved_text);

    this._stripped_text = stripped_arr;
    this._actual_text = "";

    stripped_arr.forEach((line, ind) => {
      if (
        ind >= this.position &&
        ind <= this.opts.page_size + this.position - 1
      ) {
        this._actual_text += line + "\n";
      }
    });

    let message = chalk`{bold ${this.opts.message}} {dim ${this.opts.suffix}}`;

    let exitMessageLength = this.opts.exit_message.split("\n").length;
    let moveToExitMessage = `\x1b[${this.rows - exitMessageLength};1H`;
    let exitMessage = "";

    if (this.opts.read_to_return == true) {
      exitMessage =
        this.position >= this.pages
          ? chalk`{blueBright.bold [${this.opts.exit_message}]}`
          : chalk`{dim [${this.opts.exit_message}]}`;
    } else {
      exitMessage = chalk`{blueBright.bold [${this.opts.exit_message}]}`;
    }
    let pages = chalk`{yellowBright.bold ${this.position + 1}/${
      this.pages + 1
    }}`;

    let final = `${message}\n\n${this._actual_text}\x1b[0m${moveToExitMessage}${exitMessage}\x1b[E${pages}`;

    this.opts.writable.write("\x1b[H\x1b[J");
    this.opts.writable.write(final);
  }

  /**
   * Captures key arrows to move the text UP and DOWN with a determinate `page_size`.
   * Use `message` option to show an static text above the text.
   * @param {string} text Defines the text to split up and fit in the console.
   * @param {pageOptions | undefined} options Defines the options.
   * @async Uses promises, awaiting for the Return key to be pressed.
   * @returns Promise, resolving in Boolean True.
   */
  public async print(text: string, options?: pageOptions): Promise<this> {
    this.options(options);

    if (
      this.opts.page_size &&
      parseFloat(this.opts.page_size.toFixed(0)) != this.opts.page_size
    ) {
      throw Error("You cant pass a floating point number as pageSize");
    } else if (this.opts.page_size && this.opts.page_size <= 0) {
      throw Error("You cant pass an equal or below 0 number as pageSize");
    }

    this._saved_text = text;

    this.update_text();

    if (this.opts.readable.isTTY) this.opts.readable.setRawMode(true);
    this.opts.readable.resume();
    this.opts.writable.write("\x1b[?25l");

    readline.emitKeypressEvents(this.opts.readable);

    await new Promise((resolve) => {
      let running = true;

      let on_data = (data: Buffer) => {
        if (this.manage_keys(data) == true) {
          running = false;
          resolve(true);
          this.opts.readable.off("data", on_data);
          return;
        }
        this.update_text();
      };
      let on_resize = () => {
        if (running) this.update_text();
        else this.opts.writable.off("resize", on_resize);
      };

      this.opts.readable.on("data", on_data);
      this.opts.writable.on("resize", on_resize);
    });
    this.opts.writable.write("\x1b[H\x1b[J");
    this.opts.writable.write("\x1b[?25h");

    return this;
  }
}

export { Paginator, pageOptions, defaultOptions };

// vim: expandtab shiftwidth=2 tabstop=2
