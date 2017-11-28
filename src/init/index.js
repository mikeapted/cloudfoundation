const inq = require('inquirer')
const chk = require('chalk')
const fse = require('fs-extra')
const pkgTpl = require('../tpls/user/package.json')

module.exports = async function init (env, options) {
  const cwd = process.cwd()
  let answers, extras, files

  try {
    files = await fse.readdir(cwd)
  } catch (err) {
    return console.log(err)
  }

  if (files.length === 1 && files[0] !== '.git' || files.length > 1) {
    return console.log(new Error('cfdn init should be used in an empty project directory'))
  }

  console.log()

  try {
    answers = await inq.prompt([
      {
        type: 'input',
        name: 'project',
        message: 'What is the name of your project?',
        default: 'CloudFoundation Project'
      },
      {
        type: 'confirm',
        name: 'vpc',
        message: 'Would you like a production VPC?',
        default: true,
      }
    ])
  } catch (err) {
    return console.log(err)
  }

  if (answers && answers.vpc) {
    try {
      extras = await inq.prompt([
        {
          type: 'confirm',
          name: 'rds',
          message: 'Would you like an encrypted, multi-AZ RDS Aurora Database?',
          default: true,
        }
      ])
    } catch (err) {
      return console.log(err)
    }
  }

  const pkgjson = Object.assign({ name: answers.project }, pkgTpl)
  try {
    await fse.copy(`${__dirname}/../tpls/base`, cwd, { errorOnExist: true })
    await fse.writeFile('package.json', JSON.stringify(pkgjson, null, '  '), 'utf8')

    if (answers.vpc) await fse.copy(`${__dirname}/../tpls/vpc`, `${cwd}/src/vpc`, { errorOnExist: true })
    if (extras.rds) await fse.copy(`${__dirname}/../tpls/db`, `${cwd}/src/db`, { errorOnExist: true })

  } catch (err) {
    return console.log(err)
  }
  

  console.log(answers, extras)
  console.log()
  console.log(chk.bold.green('CloudFoundation Project Successfully Scaffolded!\n'))
  if (answers.vpc) {
    console.log(chk.whiteBright(`The stack ${chk.cyan('vpc')} is available in ${chk.cyan('src/')}`))
    if (extras.rds) console.log(chk.whiteBright(`The stack ${chk.cyan('db')} is available in ${chk.cyan('src/')}\n`))
  }
  console.log(chk.whiteBright(`Initialize your own stack by running ${chk.cyan('cfdn create <stackname>')}\n`))
  console.log(chk.whiteBright(`To build the stacks run ${chk.cyan('cfdn build')}\n`))
  // TODO insert github and post URLs
  console.log(chk.whiteBright(`For more information run ${chk.cyan('cfdn --help')} or visit url\n`))
}