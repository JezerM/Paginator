import { Writable } from 'stream'
import {WriteStream} from 'tty'
import { Paginator } from '../'
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import ansiRegex from 'ansi-regex'

/**
 * An array with some possible ANSI-Escapes that could clear the console. The last one is the only that works in this case.
 */
var clearAnsi = [ansiEscapes.clearScreen, ansiEscapes.clearTerminal, ansiEscapes.eraseDown, ansiEscapes.eraseScreen, ansiEscapes.eraseLine, ansiEscapes.eraseUp, '\x1B[0J']

// This could be extending WriteStream or Writable, it doesn't matter. Just change the super(/*option*/).

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

  private _all : string = "";
  public get all() : string {
    return this._all;
  }
  public set all(v : string) {
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
    if (match) {this.clear()}
    callback()
  }
  public clear() {
    this.data = ''
  }
}

var paginator = new Paginator();

var writable = new readline()

// When paginator writes something on 'writable', logs it.
writable.on('writed', (d: string) => {
  process.stdout.write(d)
})

var lorem = chalk`{dim Lorem ipsum dolor sit amet}, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Scelerisque felis imperdiet proin fermentum. Consectetur a erat nam at lectus urna duis convallis convallis. Posuere urna nec tincidunt praesent. Venenatis tellus in metus vulputate eu. Turpis tincidunt id aliquet risus feugiat in ante metus dictum. Vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae elementum. Sit amet purus gravida quis blandit turpis. At tempor commodo ullamcorper a lacus vestibulum sed arcu non. {greenBright.bold Rhoncus aenean vel elit scelerisque mauris pellentesque.} Pharetra vel turpis nunc eget. Aliquam sem fringilla ut morbi tincidunt augue interdum velit. Varius vel pharetra vel turpis nunc. Adipiscing diam donec adipiscing tristique risus nec. Aliquam ut porttitor leo a diam sollicitudin tempor id. Bibendum at varius vel pharetra vel. {bold Consequat nisl vel pretium lectus quam id. Pellentesque adipiscing commodo elit at imperdiet dui accumsan sit amet. Rhoncus est pellentesque elit ullamcorper dignissim cras tincidunt lobortis. Pharetra et ultrices neque ornare aenean euismod.

  Seda pulvinar proin gravida} {bold.red hendrerit lectus a. Diam volutpat commodo sed egestas egestas fringilla phasellus faucibus. Ultrices mi tempus imperdiet nulla. Maecenas sed enim ut sem viverra aliquet eget sit amet. Non nisi est sit amet facilisis magna etia}m. Feugiat pretium nibh ipsum consequat nisl. Elementum eu facilisis sed odio morbi. Dis parturient montes nascetur ridiculus mus mauris vitae ultricies leo. Facilisis sed odio morbi quis commodo. Dictum non consectetur a erat nam. Dictum sit amet justo donec enim. Dictumst quisque sagittis purus sit amet.`;

paginator.print(lorem, {
  pageSize: 10,
  read_to_return: true,
  writable: writable // Sets the WritableStream or WriteStream to write on. In this case, this is saving all the data in the 'rl' instance, which you can access on 'writed' event. This behavior is practically the same as process.stdout.write()
}).then(() => {
  console.log('Now, we print ALL the data that passed throught the writable');
  
  setTimeout(() => {
    var data = writable.all
    clearAnsi.forEach((v) => {
      data = data.replace(v, '')
    })
    console.log([data])
  }, 3000)
})