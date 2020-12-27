import {Paginator} from '../'
const fs = require('fs')

var paginator = new Paginator()

var lorem = ''
try {
  lorem = fs.readFileSync('./lorem.txt', 'utf8')
} catch (err) {
  console.error(err)
}
paginator.print(lorem, {pageSize: 10}) // Shows 10 lines per page