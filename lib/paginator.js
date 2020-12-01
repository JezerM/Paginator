"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("ansi-escapes");
const ansi_escapes_1 = __importDefault(require("ansi-escapes"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const readline_1 = __importDefault(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const slice_ansi_1 = __importDefault(require("slice-ansi"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
/**
 * Allows to paginate or split the text in the console, moving the page with arrow keys, awaiting for user action to continue the code.
 * @async It's preffered to use Await/Async to avoid executing next code without waiting user action.
 */
class Paginator {
    constructor() {
        this.supSaved = '';
        this.savedText = '';
        this.actualText = '';
        this.position = 0;
        this.pageSize = 0;
        this.once = true;
    }
    /**
     * Capture key arrows for moving the text UP and DOWN with a determinate PageSize.
     * Use Message option for show an static text above the text.
     * @param {string} text Defines the text to split up and fit in the console.
     * @param {number} pageSize Defines the max number of lines to show in console. Use a positive integer.
     * @param {pageOptions | undefined} options Defines the options.
     * @async Uses Promises, awaiting for the Return key pressed.
     * @returns Promise, resolving in Boolean True.
     */
    print(text, pageSize, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (parseFloat(pageSize.toFixed(0)) != pageSize) {
                throw Error('You cant pass a floating point number as pageSize');
            }
            else if (pageSize <= 0) {
                throw Error('You cant pass an equal or below 0 number as pageSize');
            }
            this.options(options);
            this.pageSize = pageSize;
            this.supSaved = this.savedText = this.actualText = text;
            this.updateText();
            this.once = false;
            return yield new Promise((resolve, reject) => {
                process.stdin.setRawMode(true);
                readline_1.default.emitKeypressEvents(process.stdin);
                const obs = rxjs_1.fromEvent(process.openStdin(), 'keypress');
                var piped = obs.pipe(operators_1.map((x) => x[1]));
                var sus = piped.subscribe((key) => {
                    // On Ctrl+C, process.exit()
                    if (key && key.ctrl && key.name == 'c') {
                        resolve();
                        this.exit();
                        sus.unsubscribe();
                        process.exit();
                    }
                    // On Down arrow key, moves 
                    if (key.name == 'down') {
                        this.down();
                    }
                    else if (key.name == 'up') {
                        this.up();
                    }
                    // If position is equal to last page and key pressed is Return, exits
                    if (this.read_to_return == true) {
                        if (key.name == 'return' && this.position >= this.savedText.split('\n').length - this.pageSize) {
                            resolve();
                            this.exit();
                            sus.unsubscribe();
                        }
                    }
                    else {
                        if (key.name == 'return') {
                            resolve();
                            this.exit();
                            sus.unsubscribe();
                        }
                    }
                });
            });
        });
    }
    /**
     * Defines the options
     */
    options(options) {
        this.message = (options === null || options === void 0 ? void 0 : options.message) || this.message || 'Paginated text:';
        this.suffix = (options === null || options === void 0 ? void 0 : options.suffix) || this.suffix || '(Use arrow keys)';
        this.exitMessage = (options === null || options === void 0 ? void 0 : options.exitMessage) || this.exitMessage || 'Press return button to exit';
        this.read_to_return = (options === null || options === void 0 ? void 0 : options.read_to_return) != undefined ? options.read_to_return : (this.read_to_return != undefined ? this.read_to_return : true);
    }
    /**
     * Prepares the console to exit
     */
    exit() {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        this.savedText = this.actualText = '';
        this.position = 0;
        this.once = true;
        clear();
        process.stdout.write(ansi_escapes_1.default.cursorShow);
    }
    /**
     * Moves the page an step down
     */
    down() {
        var length = this.savedText.split('\n').length - this.pageSize;
        if (this.position <= length - 1) {
            this.position++;
        }
        else {
            this.position = length;
        }
        this.updateText();
    }
    /**
     * Moves the page an step up
     */
    up() {
        if (this.position <= 0) {
            this.position = 0;
        }
        else {
            this.position--;
        }
        this.updateText();
    }
    /**
     * Updates the @var actualText, getting the actual position on page and printing it in the console
     */
    updateText() {
        this.format();
        var splitted = this.savedText.split('\n');
        this.actualText = '';
        splitted.forEach((value, index) => {
            if (index >= this.position && index <= this.pageSize - 1 + this.position) {
                this.actualText += value + '\n';
            }
        });
        clear();
        readline_1.default.cursorTo(process.stdout, 0, 0);
        console.log(`${chalk_1.default.bold(this.message)} ${this.once ? chalk_1.default.dim(this.suffix) : ''}\n`);
        process.stdout.write(this.actualText);
        var exitMessageLength = this.exitMessage ? this.exitMessage.split('\n').length : 0;
        readline_1.default.cursorTo(process.stdout, 0, process.stdout.rows - exitMessageLength - 1);
        if (this.read_to_return == true) {
            process.stdout.write(this.position >= this.savedText.split('\n').length - this.pageSize ? chalk_1.default `{blueBright.bold [${this.exitMessage}]}` : chalk_1.default `{dim.bold [${this.exitMessage}]}`);
        }
        else {
            process.stdout.write(chalk_1.default `{blueBright.bold [${this.exitMessage}]}`);
        }
        readline_1.default.moveCursor(process.stdout, 0, 1);
        readline_1.default.cursorTo(process.stdout, 0);
        process.stdout.write(chalk_1.default `{yellowBright.bold ${this.position + 1}/${this.savedText.split('\n').length - this.pageSize + 1}}`);
    }
    /**
     * Formats the @var savedText, splitting it to fit well in the console.
     */
    format() {
        var maxColumns = process.stdout.columns;
        var linesArr = this.supSaved.split('\n');
        var finalText = '';
        linesArr.forEach((value, indexLines, arrLines) => {
            var wordArr = value.split(' ');
            var line = '';
            if (indexLines != 0) {
                finalText += '\n';
            }
            var last = 0;
            wordArr.forEach((valueW, indexW, arr) => {
                var actual = strip_ansi_1.default(valueW); // Erases ansi codes in every word
                var finalWord = slice_ansi_1.default(value, last + indexW, last + indexW + actual.length); // Slices the real text, keeping ansi codes
                last += actual.length;
                arr[indexW] = finalWord;
            });
            wordArr.forEach((word, indexWord, arrWords) => {
                var lolLine = strip_ansi_1.default(line);
                var lolWord = strip_ansi_1.default(word);
                if ((lolLine + lolWord).length > maxColumns) {
                    if (lolLine[lolLine.length - 1] === ' ') { // If last character of line is an empty space, delete it
                        line = slice_ansi_1.default(line, 0, lolLine.length - 1);
                    }
                    finalText += line + '\n';
                    line = '';
                }
                line += word + ' ';
            });
            if (line.length > 0) {
                finalText += line;
            }
        });
        var lines = finalText.split('\n');
        if (this.pageSize >= lines.length) {
            this.pageSize = finalText.split('\n').length;
        }
        this.savedText = finalText;
    }
}
exports.Paginator = Paginator;
/**
 * Just clears the console, hiding the cursor
 */
function clear() {
    process.stdout.write(ansi_escapes_1.default.cursorTo(0, 0) + ansi_escapes_1.default.clearTerminal + ansi_escapes_1.default.cursorHide);
}
