/**
 * theme-manager.js — Gestion des thèmes visuels des slides
 *
 * Presets : sombre (défaut), clair, océan, sunset, forest
 * Fine-tuning : couleur d'accent, police, style de titres
 *
 * Persistance : frontmatter du fichier .md (theme, accent, font, heading-style)
 */

const SLIDE_THEME_PRESETS = {
  default: { label: 'Sombre', bg: '#1e2235', text: '#e4e7ec', accent: '#3b82f6' },
  light:   { label: 'Clair',  bg: '#ffffff', text: '#1e293b', accent: '#3b82f6' },
  ocean:   { label: 'Océan',  bg: '#0c1b33', text: '#e0f2fe', accent: '#38bdf8' },
  sunset:  { label: 'Sunset', bg: '#1a0a2e', text: '#fde68a', accent: '#f97316' },
  forest:  { label: 'Forêt',  bg: '#0a1f0a', text: '#d1fae5', accent: '#34d399' }
};

const FONT_OPTIONS = [
  { value: '',         label: 'Système (défaut)' },
  { value: 'calibri',  label: 'Calibri', family: 'Calibri, "Segoe UI", Tahoma, sans-serif' },
  { value: 'arial',    label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { value: 'verdana',  label: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { value: 'trebuchet',label: 'Trebuchet', family: '"Trebuchet MS", Helvetica, sans-serif' },
  { value: 'serif',    label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { value: 'mono',     label: 'Monospace', family: 'var(--font-mono)' }
];

const HEADING_STYLE_OPTIONS = [
  { value: '',          label: 'Classique (défaut)' },
  { value: 'uppercase', label: 'Majuscules' },
  { value: 'underline', label: 'Souligné' },
  { value: 'light',     label: 'Léger' },
  { value: 'accent',    label: 'Accent' },
  { value: 'shadow',    label: 'Ombre' }
];

const ThemeManager = {
  currentPreset: 'default',
  customAccent: null,
  customFont: null,
  customHeadingStyle: null,
  panelEl: null,

  init() {
    this.panelEl = document.getElementById('themePickerPanel');
    this.restoreFromMeta();
    this.buildPanel();
    this.bindEvents();
  },

  /**
   * Lit le style depuis le frontmatter (SlideState.meta)
   */
  restoreFromMeta() {
    const meta = (typeof SlideState !== 'undefined') ? SlideState.meta : {};
    this.currentPreset = meta.theme || 'default';
    this.customAccent = meta.accent || null;
    this.customFont = meta.font || null;
    this.customHeadingStyle = meta['heading-style'] || null;

    this.applyPreset(this.currentPreset, false);
    if (this.customAccent) this.applyCustomAccent(this.customAccent, false);
    if (this.customFont) this.applyCustomFont(this.customFont, false);
    if (this.customHeadingStyle) this.applyHeadingStyle(this.customHeadingStyle, false);
  },

  /**
   * Écrit le style dans le frontmatter (SlideState.meta)
   * et marque l'éditeur comme modifié
   */
  saveToMeta() {
    if (typeof SlideState === 'undefined') return;
    const meta = SlideState.meta;

    // Écrire uniquement les valeurs non-défaut
    if (this.currentPreset && this.currentPreset !== 'default') {
      meta.theme = this.currentPreset;
    } else {
      delete meta.theme;
    }

    if (this.customAccent) {
      meta.accent = this.customAccent;
    } else {
      delete meta.accent;
    }

    if (this.customFont) {
      meta.font = this.customFont;
    } else {
      delete meta.font;
    }

    if (this.customHeadingStyle) {
      meta['heading-style'] = this.customHeadingStyle;
    } else {
      delete meta['heading-style'];
    }

    // Marquer l'éditeur comme modifié
    if (typeof SlideEditor !== 'undefined') {
      SlideEditor.setStatus('modified', 'Style modifié');
    }
  },

  applyPreset(name, save = true) {
    this.currentPreset = name;

    // Retirer l'ancien thème
    if (name === 'default') {
      delete document.documentElement.dataset.slideTheme;
    } else {
      document.documentElement.dataset.slideTheme = name;
    }

    // Nettoyer les surcharges inline (backgroundColor, pas background qui écraserait backgroundImage)
    document.querySelectorAll('.slide').forEach(slide => {
      slide.style.removeProperty('--slide-bg');
      slide.style.removeProperty('--text-primary');
      slide.style.removeProperty('--text-secondary');
      slide.style.removeProperty('color');
      slide.style.removeProperty('background-color');
    });

    // Appliquer les surcharges inline pour le thème clair (pas de CSS dédié)
    if (name === 'light') {
      document.querySelectorAll('.slide').forEach(slide => {
        slide.style.setProperty('--slide-bg', '#ffffff');
        slide.style.setProperty('--text-primary', '#1e293b');
        slide.style.setProperty('--text-secondary', '#475569');
        slide.style.color = '#1e293b';
        slide.style.backgroundColor = '#ffffff';
      });
    }

    // Mettre à jour le bouton actif
    this.updateActivePreset();

    // Mettre à jour l'input couleur avec l'accent du preset
    const preset = SLIDE_THEME_PRESETS[name];
    if (preset && !this.customAccent) {
      const colorInput = document.getElementById('themeAccentColor');
      if (colorInput) colorInput.value = preset.accent;
    }

    if (save) this.saveToMeta();
  },

  applyCustomAccent(color, save = true) {
    this.customAccent = color;
    document.querySelectorAll('.slide').forEach(slide => {
      slide.style.setProperty('--primary-color', color);
    });
    // Appliquer aussi globalement pour les éléments hors slides
    document.documentElement.style.setProperty('--primary-color', color);
    if (save) this.saveToMeta();
  },

  applyCustomFont(fontKey, save = true) {
    this.customFont = fontKey || null;
    const option = FONT_OPTIONS.find(f => f.value === fontKey);
    document.querySelectorAll('.slide').forEach(slide => {
      if (option && option.family) {
        slide.style.setProperty('--font-sans', option.family);
        slide.style.fontFamily = option.family;
      } else {
        slide.style.removeProperty('--font-sans');
        slide.style.removeProperty('font-family');
      }
    });
    if (save) this.saveToMeta();
  },

  applyHeadingStyle(styleKey, save = true) {
    this.customHeadingStyle = styleKey || null;
    document.querySelectorAll('.slide').forEach(slide => {
      if (styleKey) {
        slide.dataset.headingStyle = styleKey;
      } else {
        delete slide.dataset.headingStyle;
      }
    });
    if (save) this.saveToMeta();
  },

  reset() {
    this.customAccent = null;
    this.customFont = null;
    this.customHeadingStyle = null;
    this.applyPreset('default', false);

    // Retirer tous les overrides
    document.documentElement.style.removeProperty('--primary-color');
    document.querySelectorAll('.slide').forEach(slide => {
      slide.style.removeProperty('--primary-color');
      slide.style.removeProperty('--font-sans');
      slide.style.removeProperty('font-family');
      delete slide.dataset.headingStyle;
    });

    // Réinitialiser les inputs
    const colorInput = document.getElementById('themeAccentColor');
    if (colorInput) colorInput.value = SLIDE_THEME_PRESETS.default.accent;
    const fontSelect = document.getElementById('themeFontSelect');
    if (fontSelect) fontSelect.value = '';
    const headingSelect = document.getElementById('themeHeadingStyle');
    if (headingSelect) headingSelect.value = '';

    this.saveToMeta();
  },

  buildPanel() {
    if (!this.panelEl) return;

    // Titre
    const title = document.createElement('div');
    title.className = 'theme-picker-title';
    title.textContent = 'Style des slides';
    this.panelEl.appendChild(title);

    // Grille des presets
    const presetsGrid = document.createElement('div');
    presetsGrid.className = 'theme-picker-presets';

    Object.entries(SLIDE_THEME_PRESETS).forEach(([key, preset]) => {
      const btn = document.createElement('button');
      btn.className = 'theme-preset-btn';
      btn.dataset.preset = key;
      if (key === this.currentPreset) btn.classList.add('active');

      const swatch = document.createElement('div');
      swatch.className = 'theme-preset-swatch';
      swatch.style.background = preset.bg;
      swatch.style.boxShadow = `inset 0 0 0 2px ${preset.accent}`;
      btn.appendChild(swatch);

      const label = document.createElement('span');
      label.className = 'theme-preset-label';
      label.textContent = preset.label;
      btn.appendChild(label);

      presetsGrid.appendChild(btn);
    });

    this.panelEl.appendChild(presetsGrid);

    // Séparateur
    const sep = document.createElement('div');
    sep.className = 'theme-picker-separator';
    this.panelEl.appendChild(sep);

    // Titre ajustements
    const tuneTitle = document.createElement('div');
    tuneTitle.className = 'theme-picker-title';
    tuneTitle.textContent = 'Ajustements';
    this.panelEl.appendChild(tuneTitle);

    // Couleur d'accent
    const accentField = document.createElement('div');
    accentField.className = 'theme-picker-field';
    const accentLabel = document.createElement('label');
    accentLabel.className = 'theme-picker-label';
    accentLabel.textContent = 'Couleur d\'accent';
    accentLabel.setAttribute('for', 'themeAccentColor');
    accentField.appendChild(accentLabel);

    const accentInput = document.createElement('input');
    accentInput.type = 'color';
    accentInput.id = 'themeAccentColor';
    accentInput.className = 'theme-picker-color';
    const currentPreset = SLIDE_THEME_PRESETS[this.currentPreset];
    accentInput.value = this.customAccent || currentPreset.accent;
    accentField.appendChild(accentInput);
    this.panelEl.appendChild(accentField);

    // Police
    const fontField = document.createElement('div');
    fontField.className = 'theme-picker-field';
    const fontLabel = document.createElement('label');
    fontLabel.className = 'theme-picker-label';
    fontLabel.textContent = 'Police';
    fontLabel.setAttribute('for', 'themeFontSelect');
    fontField.appendChild(fontLabel);

    const fontSelect = document.createElement('select');
    fontSelect.id = 'themeFontSelect';
    fontSelect.className = 'theme-picker-select';
    FONT_OPTIONS.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === (this.customFont || '')) option.selected = true;
      fontSelect.appendChild(option);
    });
    fontField.appendChild(fontSelect);
    this.panelEl.appendChild(fontField);

    // Style des titres
    const headingField = document.createElement('div');
    headingField.className = 'theme-picker-field';
    const headingLabel = document.createElement('label');
    headingLabel.className = 'theme-picker-label';
    headingLabel.textContent = 'Titres';
    headingLabel.setAttribute('for', 'themeHeadingStyle');
    headingField.appendChild(headingLabel);

    const headingSelect = document.createElement('select');
    headingSelect.id = 'themeHeadingStyle';
    headingSelect.className = 'theme-picker-select';
    HEADING_STYLE_OPTIONS.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === (this.customHeadingStyle || '')) option.selected = true;
      headingSelect.appendChild(option);
    });
    headingField.appendChild(headingSelect);
    this.panelEl.appendChild(headingField);

    // Bouton réinitialiser
    const resetBtn = document.createElement('button');
    resetBtn.className = 'theme-picker-reset';
    resetBtn.textContent = 'Réinitialiser';
    resetBtn.id = 'themeResetBtn';
    this.panelEl.appendChild(resetBtn);
  },

  bindEvents() {
    // Bouton toggle
    const toggleBtn = document.getElementById('stylePickerBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePanel());
    }

    // Clic sur les presets
    if (this.panelEl) {
      this.panelEl.addEventListener('click', (e) => {
        const presetBtn = e.target.closest('.theme-preset-btn');
        if (presetBtn) {
          this.applyPreset(presetBtn.dataset.preset);
        }
        if (e.target.id === 'themeResetBtn') {
          this.reset();
        }
      });
    }

    // Couleur d'accent
    const accentInput = document.getElementById('themeAccentColor');
    if (accentInput) {
      accentInput.addEventListener('input', (e) => {
        this.applyCustomAccent(e.target.value);
      });
    }

    // Police
    const fontSelect = document.getElementById('themeFontSelect');
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        this.applyCustomFont(e.target.value);
      });
    }

    // Style des titres
    const headingSelect = document.getElementById('themeHeadingStyle');
    if (headingSelect) {
      headingSelect.addEventListener('change', (e) => {
        this.applyHeadingStyle(e.target.value);
      });
    }

    // Fermer le panneau en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (!this.panelEl || !this.panelEl.classList.contains('open')) return;
      const toggleBtn = document.getElementById('stylePickerBtn');
      if (!this.panelEl.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
        this.closePanel();
      }
    });
  },

  togglePanel() {
    if (!this.panelEl) return;
    this.panelEl.classList.toggle('open');
    const btn = document.getElementById('stylePickerBtn');
    if (btn) btn.classList.toggle('active', this.panelEl.classList.contains('open'));
  },

  closePanel() {
    if (!this.panelEl) return;
    this.panelEl.classList.remove('open');
    const btn = document.getElementById('stylePickerBtn');
    if (btn) btn.classList.remove('active');
  },

  updateActivePreset() {
    if (!this.panelEl) return;
    this.panelEl.querySelectorAll('.theme-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === this.currentPreset);
    });
  }
};

/* Initialiser quand les slides sont prêtes (event depuis slide-engine.js) */
window.addEventListener('slidesReady', () => ThemeManager.init());
