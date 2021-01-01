import ansiEscapes from "ansi-escapes";
import ansiRegex from "ansi-regex";
import { ReadStream, WriteStream } from "tty";
import readl, { Key } from 'readline'


var clearAnsi = [ansiEscapes.clearScreen, ansiEscapes.clearTerminal, ansiEscapes.eraseDown, ansiEscapes.eraseScreen, ansiEscapes.eraseLine, ansiEscapes.eraseUp, '\x1B[0J']

class readline extends WriteStream {
  constructor() {
    super(0)
  }

  private _data: string = "";
  public get data(): string {
    return this._data;
  }
  public set data(v: string) {
    this._data = v;
  }

  private _all: string = "";
  public get all(): string {
    return this._all;
  }
  public set all(v: string) {
    this._all = v;
  }

  public _raw() {
    return [this.data]
  }

  public _rawAll() {
    return [this.all]
  }

  public _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void) {
    this.all += chunk
    this.data += chunk
    this.emit('writed', this.data)

    var reg = this.data.match(ansiRegex())
    var match = clearAnsi.some((val) => { return reg?.includes(val) })
    if (match) { this.clear() }
    callback()
  }
  public clear() {
    this.data = ''
  }
  public isCleared() {
    var reg = this.data.replace(ansiRegex(), '')    
    if (reg == '') {
      return true
    }
    return false
  }
}

class keyboard extends ReadStream {
  constructor() {
    super(0)
    this.setRawMode(true)
  }
}

export {
  readline,
  keyboard
}