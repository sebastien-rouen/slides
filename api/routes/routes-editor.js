const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * POST /save
 * Sauvegarde le contenu Markdown d'une présentation
 */
router.post('/save', async (req, res) => {
    const logger = req.siteLogger;
    const { file, fullMarkdown } = req.body;

    // Validation des paramètres
    if (!file || typeof file !== 'string') {
        return res.status(400).json({ success: false, error: 'Paramètre "file" manquant' });
    }
    if (!fullMarkdown || typeof fullMarkdown !== 'string') {
        return res.status(400).json({ success: false, error: 'Paramètre "fullMarkdown" manquant' });
    }

    // Sécurité : pas de path traversal
    if (file.includes('..') || file.includes('~')) {
        logger.warn('Tentative de path traversal', { file });
        return res.status(400).json({ success: false, error: 'Chemin invalide' });
    }

    // Vérifier que le fichier est dans pages/ et finit par .md
    if (!file.startsWith('pages/') || !file.endsWith('.md')) {
        return res.status(400).json({ success: false, error: 'Seuls les fichiers pages/*.md sont modifiables' });
    }

    try {
        const siteRoot = path.join(process.env.SITES_PATH || '/sites', process.env.NODE_ENV || 'drafts', req.siteName);
        const filePath = path.join(siteRoot, file);

        // Vérifier que le fichier existe
        await fs.access(filePath);

        // Écrire le contenu
        await fs.writeFile(filePath, fullMarkdown, 'utf-8');
        logger.info('Présentation sauvegardée', { file });

        res.json({ success: true });
    } catch (error) {
        logger.error('Erreur sauvegarde présentation', { file, error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde' });
    }
});

/**
 * GET /load
 * Charge le contenu brut d'un fichier Markdown
 */
router.get('/load', async (req, res) => {
    const logger = req.siteLogger;
    const file = req.query.file;

    if (!file || typeof file !== 'string') {
        return res.status(400).json({ success: false, error: 'Paramètre "file" manquant' });
    }

    if (file.includes('..') || file.includes('~')) {
        return res.status(400).json({ success: false, error: 'Chemin invalide' });
    }

    if (!file.startsWith('pages/') || !file.endsWith('.md')) {
        return res.status(400).json({ success: false, error: 'Seuls les fichiers pages/*.md sont lisibles' });
    }

    try {
        const siteRoot = path.join(process.env.SITES_PATH || '/sites', process.env.NODE_ENV || 'drafts', req.siteName);
        const filePath = path.join(siteRoot, file);
        const content = await fs.readFile(filePath, 'utf-8');

        res.json({ success: true, data: content });
    } catch (error) {
        logger.error('Erreur chargement présentation', { file, error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors du chargement' });
    }
});

/**
 * POST /upload-image
 * Upload une image dans le dossier images/ de la présentation
 * Body JSON : { file: 'pages/slug/main.md', imageData: 'base64...', filename: 'photo.jpg' }
 */
router.post('/upload-image', async (req, res) => {
    const logger = req.siteLogger;
    const { file, imageData, filename } = req.body;

    // Validation
    if (!file || !imageData || !filename) {
        return res.status(400).json({ success: false, error: 'Paramètres manquants' });
    }

    // Sécurité : path traversal
    if (file.includes('..') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ success: false, error: 'Chemin invalide' });
    }

    // Vérifier le format du chemin (pages/{slug}/main.md)
    const parts = file.split('/');
    if (parts.length < 3 || parts[0] !== 'pages' || !file.endsWith('.md')) {
        return res.status(400).json({ success: false, error: 'Chemin de présentation invalide' });
    }

    // Seules les images sont acceptées
    const ext = path.extname(filename).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (!allowedExts.includes(ext)) {
        return res.status(400).json({ success: false, error: 'Format non supporté (jpg, png, gif, webp, svg)' });
    }

    try {
        const slug = parts[1];
        const siteRoot = path.join(process.env.SITES_PATH || '/sites', process.env.NODE_ENV || 'drafts', req.siteName);
        const imagesDir = path.join(siteRoot, 'pages', slug, 'images');
        await fs.mkdir(imagesDir, { recursive: true });

        // Nom de fichier sécurisé : timestamp + kebab-case
        const safeName = Date.now() + '-' + filename
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');

        // Décoder le base64 et vérifier la taille (max 5 Mo)
        const buffer = Buffer.from(imageData, 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, error: 'Image trop volumineuse (max 5 Mo)' });
        }

        await fs.writeFile(path.join(imagesDir, safeName), buffer);

        const imagePath = `pages/${slug}/images/${safeName}`;
        logger.info('Image uploadée', { path: imagePath, size: buffer.length });
        res.json({ success: true, data: { path: imagePath, filename: safeName } });
    } catch (error) {
        logger.error('Erreur upload image', { error: error.message });
        res.status(500).json({ success: false, error: "Erreur lors de l'upload" });
    }
});

module.exports = router;
