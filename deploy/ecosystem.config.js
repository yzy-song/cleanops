// CleanOps API — PM2 Ecosystem 配置
// 使用方法: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: "cleanops",
      // current 符号链接指向当前版本的 apps/api/dist
      script: "./current/main.js",
      // 确保 PM2 从部署根目录执行，以便正确解析相对路径
      cwd: "/var/www/cleanops",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // 日志配置
      error_file: "/var/www/cleanops/logs/pm2-error.log",
      out_file: "/var/www/cleanops/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // 自动重启配置
      max_memory_restart: "512M",
      max_restarts: 10,
      restart_delay: 5000,
      // 优雅退出
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 30000,
    },
  ],
};
