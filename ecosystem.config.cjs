module.exports = {
  apps: [{
    name: 'cleanops',
    script: '/var/www/cleanops/current/main.js',
    cwd: '/var/www/cleanops',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 3000,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: '4000',
    },
  }],
};
