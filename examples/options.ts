import {paginator} from '../'
const fs = require('fs')

var lorem = ''
try {
  lorem = fs.readFileSync('./lorem.txt', 'utf8')
} catch (err) {
  console.error(err)
}
paginator.print(lorem, 10, {
  exitMessage: 'Please, press return to exit :D',
  message: 'A big lorem ipsum!',
  suffix: 'Use those arrows',
  read_to_return: false
})