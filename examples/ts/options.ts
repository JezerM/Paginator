import { Paginator } from "../../index.js";
import fs from "fs";

var paginator = new Paginator(); // You can set options initially
var pagCustom = new Paginator({
  exit_message: "Please, press return to exit :D",
  message: "A big lorem ipsum!",
  suffix: "Use those arrows",
  read_to_return: true,
});

var lorem = "";
try {
  lorem = fs.readFileSync("../lorem.txt", "utf8");
} catch (err) {
  console.error(err);
}

(async () => {
  await paginator.print(lorem);
  await pagCustom.print(lorem, {
    page_size: 10,
    message: "Really, a big lorem ipsum!",
  });
})();
