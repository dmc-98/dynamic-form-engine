import { Command } from 'commander'
import chalk from 'chalk'
import { addCommand } from './commands/add'
import { initCommand } from './commands/init'
import { validateCommand } from './commands/validate'
import { migrateCommand } from './commands/migrate'

const program = new Command()

program
  .name('dfe')
  .description('Dynamic Form Engine CLI — scaffold backend/frontend modules')
  .version('0.1.0')

program.addCommand(initCommand)
program.addCommand(addCommand)
program.addCommand(validateCommand)
program.addCommand(migrateCommand)

program.parse()
