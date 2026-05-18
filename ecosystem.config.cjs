module.exports = {
  apps: [{
    name: 'cleanops',
    script: '/var/www/cleanops/current/main.js',
    max_restarts: 5,
    min_uptime: '10s',
    restart_delay: 3000,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
