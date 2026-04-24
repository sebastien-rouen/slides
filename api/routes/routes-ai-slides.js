const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

function getMammouthConfig(req) {
    const sc = (req && req.siteConfig) || {};
    return {
        apiKey: sc.MAMMOUTH_API_KEY || process.env.MAMMOUTH_API_KEY || '',
        baseUrl: sc.MAMMOUTH_BASE_URL || process.env.MAMMOUTH_BASE_URL || 'https://api.mammouth.ai',
        model: sc.MAMMOUTH_MODEL || process.env.MAMMOUTH_MODEL || 'gemini-2.5-flash'
    };
}

function getPexelsKey(req) {
    const sc = (req && req.siteConfig) || {};
    return sc.PEXELS_API_KEY || process.env.PEXELS_API_KEY || '';
}

/* ----
   Système de prompt enrichi, inspiré du format estimation-scrum/main.md
   ---- */
const SYSTEM_PROMPT = `Tu es un expert en création de présentations professionnelles et percutantes.
Génère une présentation complète en Markdown selon le format BastaVerse Slides.

═══ STRUCTURE OBLIGATOIRE ═══

1. Commence par un frontmatter YAML :
---
title: [Titre complet de la présentation]
author: [Auteur si mentionné, sinon laisser vide]
date: [Date du jour au format YYYY-MM-DD]
---

2. Chaque slide est séparée par une ligne contenant UNIQUEMENT "---"

═══ TYPES DE SLIDES — ALTERNE OBLIGATOIREMENT ═══

▸ SLIDE COVER (accroche principale ou séparateur de section) :
<!-- layout: cover -->
<!-- style: background: linear-gradient(135deg, #071a07 0%, #0d2e0d 50%, #1a4a1a 100%); -->
![bg](IMAGE_URL_BG)
# Titre accrocheur
### Accroche ou question rhétorique
**Auteur · Contexte**

▸ SLIDE IMAGE DROITE (contenu + image illustrative) :
<!-- layout: image-right -->
![Description de l'image](IMAGE_URL)
## Titre de la slide
Phrase d'amorce courte et directe.
- 🔍 **Point clé 1** : explication concise
- 🧩 **Point clé 2** : ce que ça change concrètement
- ⚠️ **Point clé 3** : piège ou nuance à connaître
- ✅ **Point clé 4** : bonne pratique
> *Citation mémorable ou règle d'or*

▸ SLIDE IMAGE GAUCHE :
<!-- layout: image-left -->
## Titre
*Sous-titre ou question posée à l'audience*
![Description pertinente](IMAGE_URL)
### Concept A
Contenu court et actionnable.
### Concept B
Contenu court et actionnable.
> Conseil terrain

▸ SLIDE TABLEAU / MÉTRIQUES :
<!-- layout: content -->
## Titre avec données
| Concept | Ce que ça mesure | Seuil d'alerte |
|---------|-----------------|----------------|
| **Terme A** | Description | Signal concret |
| **Terme B** | Description | Signal concret |
**Règle d'or :** message clé en une ligne.
> *"Citation percutante ou insight clé"*

▸ SLIDE CODE (si pertinent) :
<!-- layout: image-right -->
![Description](IMAGE_URL)
## Titre
\`\`\`
Exemple concret
Valeur 1 : résultat
Valeur 2 : résultat
→ Interprétation
\`\`\`
- Point d'explication
- Ce qu'on ne fait JAMAIS

▸ SLIDE COMPARAISON (❌ vs ✅) :
<!-- class: comparison-slide -->
## Ce que [sujet] change vraiment
<div class='comp-wrap'>
<div class='comp-col comp-before'>
<div class='comp-head'>❌ Ce qui détruit la valeur</div>
<ul>
<li>Comportement négatif 1</li>
<li>Comportement négatif 2</li>
<li>Comportement négatif 3</li>
</ul>
</div>
<div class='comp-col comp-after'>
<div class='comp-head'>✅ Ce qui fait la différence</div>
<ul>
<li>Bonne pratique 1</li>
<li>Bonne pratique 2</li>
<li>Bonne pratique 3</li>
<li>Bonne pratique 4</li>
</ul>
</div>
</div>

▸ SLIDE DIAGRAMME MERMAID (flux, archi, séquence, stats, timeline...) :
<!-- layout: content -->
## Titre du diagramme

\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#2d1b69', 'primaryTextColor': '#e2e8f0', 'primaryBorderColor': '#edd23a', 'lineColor': '#60a5fa', 'secondaryColor': '#1e3a5f', 'tertiaryColor': '#1a1d29', 'background': '#0f0f1a', 'darkMode': true}}}%%
flowchart LR
    A([🚀 Départ]) --> B{Condition ?}
    B -- Oui --> C[Étape A]
    B -- Non --> D[Étape B]
    C --> E([✅ Résultat])
    D --> E
\`\`\`
> Phrase de synthèse en une ligne

Exemples de types utilisables selon le contexte :

• ARCHITECTURE SYSTÈME :
\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1e3a5f', 'primaryTextColor': '#e2e8f0', 'primaryBorderColor': '#3b82f6', 'lineColor': '#60a5fa', 'background': '#0f0f1a'}}}%%
architecture-beta
    group api(cloud)[Backend]
    service db(database)[Base de données] in api
    service srv(server)[Serveur] in api
    service cdn(internet)[CDN]
    cdn:R --> L:srv
    srv:R --> L:db
\`\`\`

• DIAGRAMME DE SÉQUENCE :
\`\`\`mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'actorBkg': '#2d1b69', 'actorTextColor': '#e2e8f0', 'signalColor': '#60a5fa', 'signalTextColor': '#fff'}}}%%
sequenceDiagram
    actor U as 👤 Utilisateur
    participant A as API
    participant B as Base de données
    U->>A: Requête
    A->>B: Requête SQL
    B-->>A: Données
    A-->>U: Réponse JSON
\`\`\`

• CAMEMBERT / STATS :
\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': {'pie1': '#ddf128', 'pie2': '#3b82f6', 'pie3': '#f12c2c', 'pie4': '#10b981', 'background': '#0f0f1a', 'primaryTextColor': '#e2e8f0'}}}%%
pie title Répartition
    "Catégorie A" : 45
    "Catégorie B" : 30
    "Catégorie C" : 15
    "Autre" : 10
\`\`\`

• TIMELINE :
\`\`\`mermaid
%%{init: {'theme': 'dark'}}%%
timeline
    title Évolution du sujet
    2020 : Étape 1
    2022 : Étape 2 : Détail important
    2024 : Étape 3
    2026 : Aujourd'hui
\`\`\`

▸ SLIDE CTA FINALE :
<!-- layout: cover -->
<!-- style: background: linear-gradient(135deg, #071a07 0%, #0d2e0d 50%, #1a4a1a 100%); -->
![bg](IMAGE_URL_BG)
# Et maintenant ?
## Quelle est la première chose que vous allez changer ?
**Auteur · Rôle ou contexte**
📚 *Ressource recommandée si pertinente*

═══ NOTES PRÉSENTATEUR (obligatoires sur chaque slide dans ce format ci-dessous) ═══
<!-- notes
Accroche orale ou question à poser. Transition vers la slide suivante.
-->

═══ IMAGES ═══
[Des URLs d'images Pexels seront fournies dans le contexte si disponibles — utilise-les en priorité.
Si aucune URL n'est fournie, laisse IMAGE_URL_BG et IMAGE_URL comme placeholders.]

═══ RÈGLES ABSOLUES ═══
- Commence ta réponse par une ligne "DESCRIPTION: [phrase de 10-20 mots résumant la présentation]" AVANT le frontmatter
- Retourne ensuite le Markdown brut avec le frontmatter ---
- AUCUN bloc \`\`\`markdown autour du résultat
- Maximum 6 bullet points ou ~80 mots de contenu par slide (hors code/tableau)
- Intercale des slides cover entre les grandes sections thématiques
- Chaque slide doit avoir des <!-- notes ... --> avec une accroche orale
- Utilise des emojis pertinents dans titres et listes
- Alterne image-right / image-left pour éviter la monotonie visuelle
- Inclus au moins 1 tableau, 1 slide comparaison, et 1 slide code si pertinent
- Utilise des blocs \`\`\`mermaid pour tout flux, architecture, séquence d'interactions, chronologie ou statistique — JAMAIS de schéma en texte ASCII ou liste à la place d'un vrai diagramme
- Chaque diagramme Mermaid doit inclure un %%{init: ...}%% avec thème sombre et couleurs cohérentes (violets/bleus : #176c94, #292ba5, #3b82f6, #60a5fa)
- Choisis le type Mermaid adapté : flowchart (processus), sequenceDiagram (interactions), architecture-beta (systèmes), pie (stats), timeline (chronologie), mindmap (concepts)
- La première slide est toujours une cover avec image de fond
- La dernière slide est toujours une CTA avec image de fond`;

/* ---- Slugify ---- */
function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}

/* ---- Extraire des mots-clés anglais pour la recherche d'images ---- */
function extractKeywords(title) {
    const stopWords = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'en', 'et', 'ou', 'est',
        'avec', 'pour', 'par', 'sur', 'dans', 'sans', 'que', 'qui', 'au', 'aux',
        'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or'
    ]);
    return title
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w))
        .slice(0, 4);
}

/* ---- Récupérer des images via l'API Pexels ---- */
async function fetchPexelsImages(keywords, apiKey, perPage = 8) {
    const query = keywords.join(' ');
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${perPage}`,
            {
                headers: { Authorization: apiKey },
                signal: AbortSignal.timeout(8000)
            }
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data.photos)) return [];
        return data.photos.map(p => ({
            urlBg: p.src.original,
            urlContent: p.src.large2x,
            alt: p.alt || query
        }));
    } catch {
        return [];
    }
}

/* ---- Construire le contexte images pour Gemini ---- */
function buildImageContext(images) {
    if (!images.length) return '';
    const bgs = images.slice(0, 3).map((img, i) =>
        `  - Fond ${i + 1} : ${img.urlBg}  (alt: "${img.alt}")`
    ).join('\n');
    const contents = images.slice(3).map((img, i) =>
        `  - Contenu ${i + 1} : ${img.urlContent}  (alt: "${img.alt}")`
    ).join('\n');
    return `\nIMAGES PEXELS DISPONIBLES — utilise ces URLs exactes dans le Markdown :\nFonds pour slides cover (![bg](url)) :\n${bgs}\nImages pour slides image-left/right (![alt](url)) :\n${contents}\n`;
}

/* ---- Extraire la description générée par l'IA (première ligne DESCRIPTION:) ---- */
function extractAiDescription(markdown) {
    const firstLine = markdown.split('\n')[0].trim();
    const match = firstLine.match(/^DESCRIPTION:\s*(.+)$/i);
    if (!match) return { description: '', cleanMarkdown: markdown };
    const description = match[1].trim();
    const cleanMarkdown = markdown.substring(firstLine.length).replace(/^\n+/, '');
    return { description, cleanMarkdown };
}

/* ---- Télécharger une image distante et la sauvegarder localement ---- */
async function downloadImage(url, destPath) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
    const buf = await res.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(buf));
}

/* ---- Génération SVG thumbnail ---- */
function generateThumbnailSvg(title) {
    const escaped = title
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const words = escaped.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > 28) {
            if (current) lines.push(current.trim());
            current = word;
        } else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current) lines.push(current.trim());

    const lineHeight = 62;
    const startY = 320 - (lines.length * lineHeight) / 2 + lineHeight / 2;
    const textLines = lines.map((line, i) =>
        `<text x="640" y="${startY + i * lineHeight}" text-anchor="middle" dominant-baseline="middle"
               font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
               font-size="50" font-weight="700" fill="white" filter="url(#shadow)">${line}</text>`
    ).join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1d29"/>
      <stop offset="45%" style="stop-color:#2d1b69"/>
      <stop offset="100%" style="stop-color:#1e3a5f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="0" y="676" width="1280" height="8" fill="url(#accent)"/>
  <circle cx="80" cy="80" r="200" fill="#5cb8f6" opacity="0.07"/>
  <circle cx="1220" cy="640" r="260" fill="#06327a" opacity="0.06"/>
  <rect x="80" y="340" width="3" height="80" rx="2" fill="url(#accent)" opacity="0.6"/>
  <text x="640" y="610" text-anchor="middle"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        font-size="22" fill="#d7dadd" opacity="0.85" letter-spacing="4">✨  G É N É R É  P A R  I A</text>
  ${textLines}
</svg>`;
}

/* ---- Prompt pour l'édition d'une slide unique ---- */
const SYSTEM_PROMPT_EDIT = `Tu es un expert en présentation BastaVerse Slides.
Ton rôle est de modifier le contenu d'une slide unique selon les instructions.

RÈGLES ABSOLUES :
- Retourne UNIQUEMENT le Markdown de la slide modifiée
- PAS de frontmatter YAML, PAS de séparateur "---"
- Conserve le layout et la structure existants SAUF instruction contraire explicite
- Format BastaVerse valide : <!-- layout: ... -->, <!-- style: ... -->, ![bg](url), <!-- notes\n...\n-->
- Maximum 6 bullet points ou ~80 mots de contenu
- Si une image URL est fournie, intègre-la dans le layout (![alt](url) ou ![bg](url) pour cover)
- Si un modèle de preset est fourni, utilise-le comme structure de base
- Pour tout flux, process ou architecture, utilise un bloc \`\`\`mermaid avec %%{init: {'theme': 'dark'}}%% — jamais de schéma ASCII`;

/* ---- Appel Mammouth ---- */
async function callMammouth(userContent, apiKey, baseUrl, model, systemPrompt) {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-litellm-api-key': apiKey
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
                { role: 'user', content: userContent }
            ],
            max_tokens: 8000,
            temperature: 0.75
        }),
        signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw Object.assign(new Error('Erreur Mammouth'), { status: response.status, preview: errText.substring(0, 300) });
    }

    const data = await response.json();
    let markdown = data?.choices?.[0]?.message?.content?.trim() || '';
    markdown = markdown.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim();
    return { markdown, finishReason: data?.choices?.[0]?.finish_reason };
}

/**
 * POST /generate
 * Génère uniquement le markdown (usage éditeur viewer)
 */
router.post('/generate', async (req, res) => {
    const logger = req.siteLogger;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Prompt manquant ou trop court' });
    }

    const { apiKey, baseUrl, model } = getMammouthConfig(req);
    if (!apiKey) {
        logger.warn('MAMMOUTH_API_KEY non configurée pour slides');
        return res.status(503).json({ success: false, error: 'Service IA non configuré (MAMMOUTH_API_KEY manquant)' });
    }

    try {
        const { markdown, finishReason } = await callMammouth(prompt.trim(), apiKey, baseUrl, model);

        if (!markdown) {
            logger.warn('Réponse Mammouth vide', { finishReason });
            return res.status(502).json({ success: false, error: 'Aucun contenu généré' });
        }

        const nbSlides = (markdown.match(/\n---\n/g) || []).length + 1;
        logger.info('Slides IA générées', { chars: markdown.length, slides: nbSlides });
        res.json({ success: true, data: { markdown } });

    } catch (error) {
        logger.error('Erreur génération slides IA', { error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la génération' });
    }
});

/**
 * POST /generate-and-create
 * Génère le markdown, crée la présentation + thumbnail SVG, retourne l'id pour redirection
 * Body: { prompt, title, description?, tags? }
 */
router.post('/generate-and-create', async (req, res) => {
    const logger = req.siteLogger;
    const { prompt, title, description, tags } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'Prompt manquant ou trop court' });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Titre manquant (minimum 3 caractères)' });
    }

    const { apiKey, baseUrl, model } = getMammouthConfig(req);
    if (!apiKey) {
        logger.warn('MAMMOUTH_API_KEY non configurée pour slides');
        return res.status(503).json({ success: false, error: 'Service IA non configuré' });
    }

    const slug = slugify(title.trim());
    if (!slug) {
        return res.status(400).json({ success: false, error: 'Le titre ne produit pas un identifiant valide' });
    }

    const siteRoot = path.join(
        process.env.SITES_PATH || '/sites',
        process.env.NODE_ENV || 'drafts',
        req.siteName
    );
    const pagesDir = path.join(siteRoot, 'pages', slug);
    const filePath = path.join(pagesDir, 'main.md');
    const registryPath = path.join(siteRoot, 'config', 'presentations.json');

    try {
        // Vérifier que le slug n'existe pas déjà
        try {
            await fs.access(pagesDir);
            return res.status(409).json({ success: false, error: 'Une présentation avec cet identifiant existe déjà' });
        } catch { /* n'existe pas, on continue */ }

        // Récupérer des images Pexels si clé disponible
        const pexelsKey = getPexelsKey(req);
        let imageContext = '';
        let pexelsImages = [];
        if (pexelsKey) {
            const keywords = extractKeywords(title.trim());
            logger.info('Recherche images Pexels', { keywords });
            pexelsImages = await fetchPexelsImages(keywords, pexelsKey);
            if (pexelsImages.length > 0) {
                imageContext = buildImageContext(pexelsImages);
                logger.info('Images Pexels récupérées', { count: pexelsImages.length });
            }
        }

        // Construire le contenu final envoyé à Gemini
        const userContent = prompt.trim() + (imageContext ? `\n\n${imageContext}` : '');

        // Générer le markdown
        const { markdown: rawMarkdown, finishReason } = await callMammouth(userContent, apiKey, baseUrl, model);

        if (!rawMarkdown) {
            logger.warn('Réponse Mammouth vide', { finishReason });
            return res.status(502).json({ success: false, error: 'Aucun contenu généré' });
        }

        // Extraire la description auto-générée
        const { description: aiDesc, cleanMarkdown: markdown } = extractAiDescription(rawMarkdown);
        const finalDescription = (description || '').trim() || aiDesc || 'Présentation générée par IA';

        // Créer le dossier + fichier markdown
        await fs.mkdir(pagesDir, { recursive: true });
        await fs.writeFile(filePath, markdown, 'utf-8');

        // Thumbnail : essayer d'utiliser la première image Pexels trouvée dans le markdown
        let thumbnailRelPath = `pages/${slug}/thumbnail.svg`;
        let thumbnailDownloaded = false;
        if (pexelsKey) {
            const imgMatch = markdown.match(/!\[bg\]\((https:\/\/[^\s)]+pexels[^\s)]*)\)/);
            const imgUrl = imgMatch ? imgMatch[1] : (pexelsImages[0] ? pexelsImages[0].urlBg : null);
            if (imgUrl) {
                try {
                    const thumbJpg = path.join(pagesDir, 'thumbnail.jpg');
                    await downloadImage(imgUrl, thumbJpg);
                    thumbnailRelPath = `pages/${slug}/thumbnail.jpg`;
                    thumbnailDownloaded = true;
                    logger.info('Thumbnail Pexels téléchargé', { url: imgUrl });
                } catch (dlErr) {
                    logger.warn('Échec téléchargement thumbnail Pexels', { error: dlErr.message });
                }
            }
        }
        if (!thumbnailDownloaded) {
            const svgContent = generateThumbnailSvg(title.trim());
            await fs.writeFile(path.join(pagesDir, 'thumbnail.svg'), svgContent, 'utf-8');
        }

        // Mettre à jour le registre
        const registryRaw = await fs.readFile(registryPath, 'utf-8');
        const registry = JSON.parse(registryRaw);
        const now = new Date().toISOString().split('T')[0];
        const newEntry = {
            id: slug,
            title: title.trim(),
            description: finalDescription,
            author: '',
            date: now,
            tags: [...new Set(['ia', ...extractKeywords(title.trim()), ...(Array.isArray(tags) ? tags : [])])],
            file: `pages/${slug}/main.md`,
            thumbnail: thumbnailRelPath
        };
        registry.presentations.push(newEntry);
        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

        const nbSlides = (markdown.match(/\n---\n/g) || []).length + 1;
        logger.info('Présentation IA créée', { id: slug, slides: nbSlides, chars: markdown.length, withPexels: !!imageContext });
        res.json({ success: true, data: { id: slug, file: newEntry.file } });

    } catch (error) {
        try { await fs.rm(pagesDir, { recursive: true, force: true }); } catch { /* ignore */ }
        logger.error('Erreur création présentation IA', { slug, error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la création' });
    }
});

/**
 * POST /edit-slide
 * Modifie le contenu d'une slide unique via IA
 * Body: { currentSlide: string, prompt: string, imageUrl?: string, presetContent?: string }
 * Returns: { success: true, data: { markdown: string } }
 */
router.post('/edit-slide', async (req, res) => {
    const logger = req.siteLogger;
    const { currentSlide, prompt, imageUrl, presetContent } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Instructions manquantes' });
    }
    if (!currentSlide || typeof currentSlide !== 'string') {
        return res.status(400).json({ success: false, error: 'Contenu de la slide manquant' });
    }

    const { apiKey, baseUrl, model } = getMammouthConfig(req);
    if (!apiKey) {
        logger.warn('MAMMOUTH_API_KEY non configurée pour edit-slide');
        return res.status(503).json({ success: false, error: 'Service IA non configuré' });
    }

    const parts = [
        `SLIDE ACTUELLE :\n${currentSlide.trim()}`,
        `INSTRUCTIONS : ${prompt.trim()}`
    ];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        parts.push(`IMAGE À UTILISER : ${imageUrl.trim()}`);
    }
    if (presetContent && typeof presetContent === 'string') {
        parts.push(`MODÈLE DE RÉFÉRENCE :\n${presetContent.trim()}`);
    }

    try {
        const { markdown, finishReason } = await callMammouth(
            parts.join('\n\n'), apiKey, baseUrl, model, SYSTEM_PROMPT_EDIT
        );

        if (!markdown) {
            logger.warn('Réponse Mammouth vide (edit-slide)', { finishReason });
            return res.status(502).json({ success: false, error: 'Aucun contenu généré' });
        }

        logger.info('Slide éditée par IA', { chars: markdown.length });
        res.json({ success: true, data: { markdown } });

    } catch (error) {
        logger.error('Erreur édition slide IA', { error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la modification' });
    }
});

/**
 * GET /image-search?q=keywords
 * Retourne une image Pexels aléatoire correspondant aux mots-clés
 */
router.get('/image-search', async (req, res) => {
    const logger = req.siteLogger;
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, error: 'Paramètre q manquant' });

    const pexelsKey = getPexelsKey(req);
    if (!pexelsKey) return res.status(503).json({ success: false, error: 'Pexels non configuré' });

    try {
        const images = await fetchPexelsImages(q.split(/\s+/).slice(0, 4), pexelsKey, 15);
        if (!images.length) return res.status(404).json({ success: false, error: 'Aucune image trouvée' });

        const pick = images[Math.floor(Math.random() * images.length)];
        logger.info('Image Pexels récupérée', { q, url: pick.urlContent });
        res.json({ success: true, data: { url: pick.urlContent, urlBg: pick.urlBg, alt: pick.alt } });
    } catch (error) {
        logger.error('Erreur image-search Pexels', { error: error.message });
        res.status(500).json({ success: false, error: 'Erreur lors de la recherche' });
    }
});

module.exports = router;
