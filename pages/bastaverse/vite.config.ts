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
              // Garder les noms originaux pour les images
              return `assets/[name][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
        }
      }
    },
    plugins: [
      {
        name: 'copy-presentation-assets',
        generateBundle() {
          const assetsDir = path.resolve(__dirname, './assets')
          const screenshotsDir = path.resolve(__dirname, './assets/screenshots')
          
          // Liste des images nécessaires
          const requiredImages = [
            'sebastien.jpg',
            '1991-02-01-sebastien-lunette.jpg',
            '1989-08-10-sebastien-deguisement.jpg',
            'lego-gandalf.jpg',
            'network-bastou-v1.jpg',
            'bilan.jpg',
            'tiger.jpg',
            'tiger-002.jpg'
          ]
          
          // Copier toutes les images du dossier assets
          if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir)
            files.forEach(fileName => {
              const filePath = path.join(assetsDir, fileName)
              const stat = fs.statSync(filePath)
              
              if (stat.isFile() && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileName)) {
                this.emitFile({
                  type: 'asset',
                  fileName: `assets/${fileName}`,
                  source: fs.readFileSync(filePath)
                })
              }
            })
          }
          
          // Copier les screenshots
          if (fs.existsSync(screenshotsDir)) {
            const screenshots = fs.readdirSync(screenshotsDir)
            screenshots.forEach(fileName => {
              const filePath = path.join(screenshotsDir, fileName)
              const stat = fs.statSync(filePath)
              
              if (stat.isFile() && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileName)) {
                this.emitFile({
                  type: 'asset',
                  fileName: `assets/${fileName}`,
                  source: fs.readFileSync(filePath)
                })
              }
            })
          }
        }
      }
    ]
  }
})
