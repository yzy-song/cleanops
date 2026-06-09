module.exports = {
  apps: [{
    name: 'cleanops',
    script: '/var/www/cleanops/current/main.js',
    cwd: '/var/www/cleanops',
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 10000,
    kill_timeout: 30000,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '4000',
    },
  }],
};
