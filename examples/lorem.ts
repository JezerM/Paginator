import {paginator} from '../'
const fs = require('fs')

var lorem = ''
try {
  lorem = fs.readFileSync('./lorem.txt', 'utf8')
} catch (err) {
  console.error(err)
}
paginator.print(lorem, 10) // Shows 10 lines per page