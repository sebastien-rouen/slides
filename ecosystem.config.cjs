// ecosystem.config.cjs
// Ce fichier est utilisé pour l'environnement de dev avec modification en live (hot-reload) en modifiant les pages/*/*.md
// NPM : Proxy Host (https://MON_SITE.COM > 127.0.0.1:3032)
require('dotenv').config({ path: '.env' });

module.exports = {
  apps: [
    {
      name: "slides-drafts",
      script: "npm",
      args: "run dev bastaverse",
      cwd: "/sites/drafts/slides",
      env: {
        VITE_PORT: process.env.VITE_PORT,
        VITE_HOST: process.env.VITE_HOST,
        VITE_ALLOWED_HOSTS: process.env.VITE_ALLOWED_HOSTS
      }
    }
  ]
}
