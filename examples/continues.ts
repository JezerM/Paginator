import chalk from 'chalk'
import {Paginator} from '../'
const fs = require('fs')

var paginator = new Paginator()

var lorem = ''
try {
  lorem = fs.readFileSync('./lorem.txt', 'utf8')
} catch (err) {
  console.error(err)
}
(async () => {
  await paginator.print(lorem, 10)
  await paginator.print(chalk.bold.green(lorem), 10, {
    read_to_return: false
  })
})()