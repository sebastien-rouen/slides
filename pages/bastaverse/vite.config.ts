import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      host: env.VITE_HOST,
      port: parseInt(env.VITE_PORT),
      strictPort: true,
      allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',') : []
    },
    resolve: {
      alias: {
        '@images': path.resolve(__dirname, '../../public/assets/bastaverse/images')
      }
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || []
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              // Garder les noms originaux pour les images (sans hash)
              return `assets/[name][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        }
      }
    },
    plugins: [
      {
        name: 'copy-all-assets-recursively',
        generateBundle() {
          const assetsDir = path.resolve(__dirname, './assets')
          
          // Fonction récursive pour copier tous les fichiers
          const copyDirectory = (sourceDir, targetPrefix = 'assets') => {
            if (!fs.existsSync(sourceDir)) return
            
            const items = fs.readdirSync(sourceDir, { withFileTypes: true })
            
            items.forEach(item => {
              const sourcePath = path.join(sourceDir, item.name)
              
              if (item.isDirectory()) {
                // Récursion pour les sous-dossiers
                copyDirectory(sourcePath, `${targetPrefix}/${item.name}`)
              } else if (item.isFile() && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(item.name)) {
                // Copier le fichier image
                this.emitFile({
                  type: 'asset',
                  fileName: `${targetPrefix}/${item.name}`,
                  source: fs.readFileSync(sourcePath)
                })
              }
            })
          }
          
          // Copier récursivement tout le dossier assets
          copyDirectory(assetsDir)
        }
      }
    ]
  }
})
