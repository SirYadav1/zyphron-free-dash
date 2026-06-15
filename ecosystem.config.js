module.exports = {
  apps: [{
    name: 'zyphron',
    script: 'dist/src/main.js',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/tmp/zyphron-error.log',
    out_file: '/tmp/zyphron-out.log',
    merge_logs: true,
    kill_timeout: 10000,
    wait_ready: false,
    listen_timeout: 80000,
  }]
};
