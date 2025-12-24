// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'rapidos-api',
      script: 'build/bin/server.js',
      interpreter: '/usr/local/bin/node',
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
        CLOUDINARY_CLOUD_NAME: 'dnn2ght5x',
        CLOUDINARY_API_KEY: '556929167677951',
        CLOUDINARY_API_SECRET: 'iAuiRngjOIQJZhNFuavIIZO_J2E',
      },
    },
  ],
}
