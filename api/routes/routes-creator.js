const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * Genere un slug URL-safe a partir d'un titre
 */
function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}

/**
 * POST /create
 * Cree une nouvelle presentation a partir d'un template
 */
router.post('/create', async (req, res) => {
    const logger = req.siteLogger;
    const { title, author, description, tags, templateId, cloneContent } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Le titre doit contenir au moins 3 caracteres' });
    }

    const slug = slugify(title.trim());
    if (!slug) {
        return res.status(400).json({ success: false, error: 'Le titre ne produit pas un identifiant valide' });
    }

    const siteRoot = path.join(process.env.SITES_PATH || '/sites', process.env.NODE_ENV || 'drafts', req.siteName);
    const pagesDir = path.join(siteRoot, 'pages', slug);
    const filePath = path.join(pagesDir, 'main.md');
    const registryPath = path.join(siteRoot, 'config', 'presentations.json');
    const templatesPath = path.join(siteRoot, 'config', 'templates.json');

    try {
        // Verifier que le dossier n'existe pas deja
        try {
            await fs.access(pagesDir);
            return res.status(409).json({ success: false, error: 'Une presentation avec cet identifiant existe deja' });
        } catch { /* n'existe pas, on continue */ }

        // Charger le contenu : clone, template, ou defaut
        let content;
        if (templateId === '__clone__' && cloneContent && typeof cloneContent === 'string') {
            // Mode clone : utiliser le contenu source tel quel
            content = cloneContent;
        } else {
            content = `# ${title.trim()}\n\n---\n\n## Slide 2\n\nContenu ici...`;
            const tid = templateId || 'blank';
            try {
                const templatesRaw = await fs.readFile(templatesPath, 'utf-8');
                const templatesData = JSON.parse(templatesRaw);
                const tpl = (templatesData.templates || []).find(t => t.id === tid);
                if (tpl && tpl.content) content = tpl.content;
            } catch (err) {
                logger.warn('Impossible de charger le template', { templateId: tid, error: err.message });
            }
        }

        // Remplacer les placeholders
        const now = new Date().toISOString().split('T')[0];
        content = content
            .replace(/\{\{title\}\}/g, title.trim())
            .replace(/\{\{author\}\}/g, (author || '').trim() || 'Auteur')
            .replace(/\{\{date\}\}/g, now);

        // Creer le dossier et le fichier
        await fs.mkdir(pagesDir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');

        // Mettre a jour le registre
        const registryRaw = await fs.readFile(registryPath, 'utf-8');
        const registry = JSON.parse(registryRaw);
        const newEntry = {
            id: slug,
            title: title.trim(),
            description: (description || '').trim() || '',
            author: (author || '').trim() || '',
            date: now,
            tags: tags || [],
            file: `pages/${slug}/main.md`,
            thumbnail: ''
        };
        registry.presentations.push(newEntry);
        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

        logger.info('Presentation creee', { id: slug, template: templateId || 'blank' });
        res.json({ success: true, data: { id: slug, file: newEntry.file } });

    } catch (error) {
        // Cleanup en cas d'erreur
        try { await fs.rm(pagesDir, { recursive: true, force: true }); } catch { /* ignore */ }
        logger.error('Erreur creation presentation', { slug, error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la creation' });
    }
});

/**
 * PUT /update
 * Met a jour les metadonnees d'une presentation dans le registre
 */
router.put('/update', async (req, res) => {
    const logger = req.siteLogger;
    const { id, title, author, description, tags, date, thumbnail } = req.body;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: 'Paramètre "id" manquant' });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Le titre doit contenir au moins 3 caractères' });
    }

    const siteRoot = path.join(process.env.SITES_PATH || '/sites', process.env.NODE_ENV || 'drafts', req.siteName);
    const registryPath = path.join(siteRoot, 'config', 'presentations.json');

    try {
        const registryRaw = await fs.readFile(registryPath, 'utf-8');
        const registry = JSON.parse(registryRaw);
        const entry = (registry.presentations || []).find(p => p.id === id);

        if (!entry) {
            return res.status(404).json({ success: false, error: 'Présentation introuvable' });
        }

        entry.title = title.trim();
        entry.author = (author || '').trim();
        entry.description = (description || '').trim();
        entry.tags = Array.isArray(tags) ? tags : [];
        if (date) entry.date = date;
        if (thumbnail) entry.thumbnail = thumbnail;

        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

        logger.info('Présentation mise à jour', { id });
        res.json({ success: true, data: entry });
    } catch (error) {
        logger.error('Erreur mise à jour présentation', { id, error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
});

/**
 * DELETE /delete
 * Supprime une presentation (fichiers + entree registre)
 */
router.delete('/delete', async (req, res) => {
    const logger = req.siteLogger;
    const { id } = req.body;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false, error: 'Paramètre "id" manquant'
        });
    }

    const siteRoot = path.join(
        process.env.SITES_PATH || '/sites',
        process.env.NODE_ENV || 'drafts',
        req.siteName
    );
    const pagesDir = path.join(siteRoot, 'pages', id);
    const registryPath = path.join(siteRoot, 'config', 'presentations.json');

    try {
        const registryRaw = await fs.readFile(registryPath, 'utf-8');
        const registry = JSON.parse(registryRaw);
        const idx = (registry.presentations || []).findIndex(p => p.id === id);

        if (idx === -1) {
            return res.status(404).json({
                success: false, error: 'Présentation introuvable'
            });
        }

        registry.presentations.splice(idx, 1);
        await fs.writeFile(
            registryPath,
            JSON.stringify(registry, null, 2) + '\n',
            'utf-8'
        );

        try {
            await fs.rm(pagesDir, { recursive: true, force: true });
        } catch (err) {
            logger.warn('Dossier introuvable', { id, error: err.message });
        }

        logger.info('Présentation supprimée', { id });
        res.json({ success: true });
    } catch (error) {
        logger.error('Erreur suppression', { id, error: error.message });
        res.status(500).json({
            success: false, error: 'Erreur lors de la suppression'
        });
    }
});

module.exports = router;
