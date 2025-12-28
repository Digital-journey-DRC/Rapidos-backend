import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class ExecuteMigrationSql extends BaseCommand {
  static commandName = 'execute:migration-sql'
  static description = ''

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Hello world from "ExecuteMigrationSql"')
  }
}