// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'rapidos-api',
      script: 'build/bin/server.js',
      env: {
        TZ: 'UTC',
        PORT: 3333,
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        NODE_ENV: 'production',
        APP_KEY: 'Mz7dctYp9QQp4j5QZu_sOd5S1hKiU8Xt',

        DB_HOST: 'db-rapidos-do-user-22329201-0.e.db.ondigitalocean.com',
        DB_PORT: 25060,
        DB_USER: 'doadmin',
        DB_PASSWORD: 'AVNS_RMJIxzQS_DOFSdl1K3s',
        DB_DATABASE: 'defaultdb',

        MAIL_USER: 'judahmvi@gmail.com',
        MAIL_PASS: 'wmntcxuksmvulbvs',

        WHATSAPP_TOKEN:
          'EAALOqv96b5kBOyZBK9MAZCF7Ev63btHib6DKyOTudKXvNYFkZBDdYZA6LDE6nssXrTZCEkdLP3hZBRLky3LS4SC5ZByFOtTzXNBVTQZDZD',
        APP_NAME: 'Rapidos',
      },
    },
    {
      name: 'swagger',
      script: 'start/swagger.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
