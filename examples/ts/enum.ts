import chalk from "chalk";
import { Paginator } from "../../index.js";
import fs from "fs";

var paginator = new Paginator({
  style: {
    enum: chalk.yellowBright,
  },
});

var lorem = "";
try {
  lorem = fs.readFileSync("../lorem.txt", "utf8");
} catch (err) {
  console.error(err);
}
paginator.print(lorem, { page_size: 10 }); // Shows 10 lines per page
