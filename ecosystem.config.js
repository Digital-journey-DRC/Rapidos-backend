export default {
  apps: [
    {
      name: 'rapidos-backend',
      script: 'build/bin/server.js',
      cwd: '/Users/stanislasmakengo/Documents/Rapidos-backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
