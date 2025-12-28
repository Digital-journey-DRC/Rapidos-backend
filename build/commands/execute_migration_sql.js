import { BaseCommand } from '@adonisjs/core/ace';
export default class ExecuteMigrationSql extends BaseCommand {
    static commandName = 'execute:migration-sql';
    static description = '';
    static options = {};
    async run() {
        this.logger.info('Hello world from "ExecuteMigrationSql"');
    }
}
//# sourceMappingURL=execute_migration_sql.js.map