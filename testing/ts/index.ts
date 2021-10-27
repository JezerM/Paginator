import { describe, it } from "mocha";
import { Paginator, pageOptions } from "../../index.js";
import { keyboard, readline } from "./readline.js";
import fs from "fs";
import path from "path";
import { URL } from "url";

const __dirname = new URL(".", import.meta.url).pathname;

var kb = new keyboard();
var rl = new readline();

var lorem = "";
try {
  lorem = fs.readFileSync(path.resolve(__dirname, "../lorem.txt"), "utf8");
} catch (err) {
  console.error(err);
  process.exit(0);
}

const customOptions: Required<pageOptions> = {
  exit_message: "Presiona enter para salir",
  message: "Texto paginado",
  page_size: 6,
  read_to_return: true,
  suffix: "Usa las flechas direccionales para moverte",
  readable: kb,
  writable: rl,
  terminal: { cols: 120, rows: 20 },
  style: {},
};

describe("Paginator", () => {
  describe("options", () => {
    it("Initialize with options", (done) => {
      var pag = new Paginator(customOptions);
      var val: keyof pageOptions;
      for (val in customOptions) {
        if (customOptions[val] != pag.opts[val]) {
          return done("Options are not correctly asigned when initializing");
        }
      }
      return done();
    });
    it("Set options with options method", (done) => {
      var pag = new Paginator();
      pag.options(customOptions);
      var val: keyof pageOptions;
      for (val in customOptions) {
        if (customOptions[val] != pag.opts[val]) {
          return done("Options are not asigned with options method");
        }
      }
      return done();
    });
  });
  var ender = new Paginator(customOptions);

  describe("end", () => {
    ender.options({ writable: new readline(), readable: new keyboard() });
    var opts = ender.opts;
    it("opts are unalterated", (done) => {
      ender.end();
      var val: keyof pageOptions;
      for (val in opts) {
        if (opts[val] != ender.opts[val]) {
          return done(`Options are not the same as they were initially!`);
        }
      }
      return done();
    });
  }).afterAll((done) => {
    ender.opts.readable.emit("end");
    done();
  });

  describe("print", () => {
    it("message", (done) => {
      let pag = new Paginator(customOptions);
      pag.print(lorem);

      if (rl.data.match(customOptions.message)) {
        done();
      } else {
        done("Message was not written");
      }
      pag.opts.readable.emit("end");
      pag.end();
    });
    it("exit_message", (done) => {
      let pag = new Paginator(customOptions);
      pag.print(lorem);

      if (rl.data.match(customOptions.exit_message)) {
        done();
      } else {
        done("ExitMessage was not written");
      }
      pag.opts.readable.emit("end");
      pag.end();
    });
    it("suffix", (done) => {
      let pag = new Paginator(customOptions);
      pag.print(lorem);
      if (rl.data.match(customOptions.suffix)) {
        done();
      } else {
        done("Suffix was not written");
      }
      pag.opts.readable.emit("end");
      pag.end();
    });
    describe("read to return", () => {
      it("when false", (done) => {
        let pag = new Paginator(customOptions);
        pag.print(lorem);

        pag.options({ read_to_return: false });
        emitKey(pag, "\x0d");
        if (rl.isCleared()) {
          done();
        } else {
          done("Paginator didn't end when read_to_return is false");
        }
        pag.opts.readable.emit("end");
        pag.end();
      });
      it("when true", (done) => {
        let pag = new Paginator(customOptions);
        pag.print(lorem);

        pag.options({ read_to_return: true });
        emitKey(pag, "\x0d");
        if (!rl.isCleared()) {
          done();
        } else {
          done("Paginator did end when read_to_return is true");
        }
        pag.opts.readable.emit("end");
        pag.end();
      });
    });
    describe("page_size", () => {
      it("lines quantity is lower than page_size (1 page)", (done) => {
        let pag = new Paginator(customOptions);
        pag.print("Hello everybody!");
        var actual_text = pag.actual_text;
        var length = actual_text.split("\n").filter((v) => {
          return v.replace("\n", "") != "";
        }).length;

        if (pag.pages != 0) {
          done(
            `There are more than zero pages. Length: ${length}, page_size: ${pag.opts.page_size}`
          );
        } else if (length <= customOptions.page_size) {
          done();
        } else {
          done(
            `The number of text lines is higher than page_size. Length: ${length}, page_size: ${pag.opts.page_size}`
          );
        }
        pag.opts.readable.emit("end");
        pag.end();
      });
      it("lines quantity is higher than page_size (more than 1 page)", (done) => {
        let pag = new Paginator(customOptions);
        pag.print(lorem);
        var actual_text = pag.actual_text;
        var length = actual_text.split("\n").filter((v) => {
          return v.replace("\n", "") != "";
        }).length;

        if (pag.pages == 0) {
          done(
            `There are zero pages. Length: ${length}, page_size: ${pag.opts.page_size}`
          );
        } else if (length == customOptions.page_size) {
          done();
        } else {
          done(
            `The number of text lines is not equal to page_size. Length: ${length}, page_size: ${pag.opts.page_size}`
          );
        }
        pag.opts.readable.emit("end");
        pag.end();
      });
    });
  });
  describe("interaction", () => {
    describe("showing more text", () => {
      it("up key", (done) => {
        let pagUp = new Paginator(customOptions).options({
          readable: new keyboard(),
          writable: new readline(),
        });
        pagUp.print(lorem);

        pagUp.position++;
        pagUp.update_text();
        var downText = pagUp.actual_text;
        emitKey(pagUp, "\x1b[A");
        pagUp.update_text();
        var upperText = pagUp.actual_text;

        if (downText == upperText) {
          done("Text did not change when UP");
        }

        var downLines = downText.split("\n");
        var upperLines = upperText.split("\n");

        var equal = downLines.every((line, ind) => {
          if (ind >= (pagUp.opts.page_size || customOptions.page_size) - 1) {
            return true;
          }
          if (line != upperLines[ind + 1]) {
            return false;
          }
          return true;
        });
        if (!equal) {
          done("Mid lines are not equal");
        } else {
          done();
        }
        pagUp.end();
        pagUp.opts.readable.emit("end");
      });
      it("down key", (done) => {
        let pagDown = new Paginator(customOptions).options({
          readable: new keyboard(),
          writable: new readline(),
        });
        pagDown.print(lorem);

        var upperText = pagDown.actual_text;
        emitKey(pagDown, "\x1b[B");
        pagDown.update_text();
        var downText = pagDown.actual_text;

        if (downText == upperText) {
          done("Text did not change when DOWN");
        }

        var downLines = downText.split("\n");
        var upperLines = upperText.split("\n");

        var equal = downLines.every((line, ind) => {
          if (ind >= (pagDown.opts.page_size || customOptions.page_size) - 1) {
            return true;
          }
          if (line != upperLines[ind + 1]) {
            return false;
          }
          return true;
        });
        if (!equal) {
          done("Mid lines are not equal");
        } else {
          done();
        }
        pagDown.end();
        pagDown.opts.readable.emit("end");
      });
    });
    describe("limits", () => {
      it("upper limit", (done) => {
        var pagUp = new Paginator(customOptions).options({
          readable: new keyboard(),
          writable: new readline(),
        });
        pagUp.print(lorem);
        var initialText = pagUp.actual_text;
        pagUp.position--;
        var secondText = pagUp.actual_text;
        if (initialText == secondText) {
          done();
        } else {
          done("The text changes even if position is in the upper limit");
        }
        pagUp.opts.readable.emit("end");
        pagUp.end();
      });
      it("bottom limit", (done) => {
        let pagDown = new Paginator(customOptions).options({
          readable: new keyboard(),
          writable: new readline(),
        });
        pagDown.print(lorem);
        pagDown.position = pagDown.pages;
        var initialText = pagDown.actual_text;
        pagDown.position++;
        var secondText = pagDown.actual_text;
        if (initialText == secondText) {
          done();
        } else {
          done("The text changes even if position is in the upper limit");
        }
        pagDown.opts.readable.emit("end");
        pagDown.end();
      });
    });
  });
}).afterAll((done) => {
  kb.emit("end");
  done();
});

function emitKey(pag: Paginator, key: string, times: number = 1) {
  var readable = pag.opts.readable;
  for (let i = 0; i < times; i++) {
    readable.emit(
      "data",
      Buffer.from(key.split("").map((v) => v.charCodeAt(0)))
    );
  }
}
