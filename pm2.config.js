module.exports = {
  apps: [
    {
      name: 'pb-slides-drafts',
      script: '/sites/drafts/slides/bdd/pocketbase',
      args: 'serve --http=127.0.0.1:8126',
      cwd: '/sites/drafts/slides/bdd',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '200M',
      error_file: '/sites/drafts/slides/bdd/logs/pb-slides-drafts-error.log',
      out_file: '/sites/drafts/slides/bdd/logs/pb-slides-drafts-out.log',
      log_file: '/sites/drafts/slides/bdd/logs/pb-slides-drafts-combined.log',
      time: true
    }
  ]
};