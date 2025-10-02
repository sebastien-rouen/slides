---
layout: image
class: text-center
image: https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop
backgroundSize: contain
backgroundSize: 100%
---

# 🌌 BASTAVERSE

### L'entrée de mon univers numérique !

<br />

<v-switch>

<template #1>

```mermaid {scale: 0.5}
graph TB
    A[🌌 BastaVerse]

    %% --- Vie ---
    subgraph Vie
        D[🏠 Maison]
        E[🚗 Voiture]
        F[🐕 Animaux]
        H[👨‍🍳 Cuisine]
        K[🏐 Volley]
        O[👗 Vêtements]
    end

    %% --- Médias ---
    subgraph Médias
        M[📻 Stream]
        I[🎮 Rétro Games]
    end

    %% --- Voyages ---
    subgraph Voyages
        B[📸 Photos]
        C[🗺️ Explorateur]
    end

    %% --- Dev / Réseau ---
    subgraph Dev/Réseau
        N[🛡️ BastaLab]
        J[✍️ Prompts]
        P[🤖 AI Local]
        R[🐛 Debug]
    end

    %% --- Professionnel ---
    subgraph Professionnel
        L[✍️ Blog]
        G[💼 Agile]
        Q[🤧 SIRH]
    end

    %% --- Liens avec le hub central ---
    A --> Vie
    A --> Médias
    A --> Voyages
    A --> Dev/Réseau
    A --> Professionnel
```

</template>


<template #2>

#### GIT Versionning

```mermaid {scale: 1.3}
---
config:
  logLevel: 'debug'
  theme: 'base'
  gitGraph:
    rotateCommitLabel: true
  themeVariables:
      commitLabelColor: '#161303ff'
      commitLabelBackground: '#ca55d4ff'
      commitLabelFontSize: '10px'
      
      tagLabelColor: '#ebebebff'
      tagLabelBackground: '#000000ff'
      tagLabelBorder: '#ffffffff'

      'git0': '#9c2828ff'
      'gitBranchLabel0': '#ffffff'

      'git1': '#00ff00'
      'gitBranchLabel1': '#000000ff'

      'git2': '#0000ff'
      'gitBranchLabel2': '#ffffff'

      'git3': '#ff00ff'
      'gitBranchLabel3': '#ffffff'

      'git4': '#00ffff'
      'gitBranchLabel4': '#ffffff'
---
gitGraph:
    checkout main
    commit id: "init: project"
    commit id: "feat: structures"
    branch develop
    checkout develop
    commit id: "feat: add core features"
    commit id: "feat: style CSS"
    commit id: "tests: CI"
    commit tag:"v1.0.0"
    commit id: "fix: security patch"
    checkout develop
    commit id: "feat: best IDEA #1"
    commit tag:"v1.1.0"
    checkout main
    merge develop
    commit id: "release: v1.1.0"
```

</template>

<template #3>
    <div align="center"><img src="./assets/network-bastou-v1.jpg" alt="Network" style="height: 26vh; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);" /></div>
</template>

<template #4>

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">

<div style="text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1); width:100%;">
<h5 style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">💻 IDE</h5>
<div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://kiro.dev/favicon.ico" alt="Kiro.dev" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Kiro.dev<br />(bêta)</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://code.visualstudio.com/assets/images/code-stable.png" alt="VSCode" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">VSCode</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://www.windsurf.ai/favicon.ico" alt="Windsurf" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Windsurf</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://cursor.sh/favicon.ico" alt="Cursor" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Cursor</div>
</div>
</div>
</div>

<div style="text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
<h5 style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🔄 Versionning</h5>
<div style="display: flex; justify-content: center; flex-direction: column; align-items: center;">
<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">GitHub</div>
</div>
</div>

<div style="text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);">
<h5 style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🗄️ BDD</h5>
<div style="display: flex; justify-content: center; flex-direction: column; align-items: center;">
<img src="https://pocketbase.io/images/logo.svg" alt="PocketBase" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">PocketBase</div>
</div>
</div>

</div>

<div style="text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1); margin: 20px 0;">
<h5 style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🤖 LLM</h5>
<div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://media.licdn.com/dms/image/v2/D4E0BAQEAIa5uaO47Ng/company-logo_200_200/company-logo_200_200/0/1725739233054/mammouth_ai_logo?e=2147483647&v=beta&t=KavXDWcm2fQKhTsIJwJM09w0ye_9joqlcsn9-lpA0Yc" alt="Mammouth.ai" style="height: 40px; width: 40px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 12px rgba(0,0,0,0.4); background: white;" />
<div style="font-size: 10px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Mammouth.ai<br />(portail)</div>
</div>
</div>
<div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://claude.ai/favicon.ico" alt="Claude" style="height: 30px; width: 30px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white;" />
<div style="font-size: 8px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Claude</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://mistral.ai/favicon.ico" alt="Mistral" style="height: 30px; width: 30px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white;" />
<div style="font-size: 8px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Mistral</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://openai.com/favicon.ico" alt="ChatGPT" style="height: 30px; width: 30px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white;" />
<div style="font-size: 8px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">ChatGPT</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://www.deepseek.com/favicon.ico" alt="DeepSeek" style="height: 30px; width: 30px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white;" />
<div style="font-size: 8px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">DeepSeek</div>
</div>
<div style="display: flex; flex-direction: column; align-items: center;">
<img src="https://static.xx.fbcdn.net/rsrc.php/y9/r/tL_v571NdZ0.svg" alt="Llama" style="height: 30px; width: 30px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: white;" />
<div style="font-size: 8px; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">Llama</div>
</div>
</div>
</div>

</template>


</v-switch>

<!--
🌌 BASTAVERSE - L'ENTRÉE DE MON UNIVERS NUMÉRIQUE

🎯 Le hub central :
- BastaVerse, c'est la porte d'entrée de tout mon écosystème
- Le point de départ pour accéder à toutes mes apps
- La vitrine de mon autonomie numérique

📊 LES SLIDES :
1️⃣ SLIDE 1 - Architecture globale :
- Montrer le schéma Mermaid avec toutes les apps organisées par catégorie
- Vie quotidienne, Médias, Voyages, Dev/Réseau, Professionnel
- Tout est interconnecté !

2️⃣ SLIDE 2 - Versionning Git :
- Montrer le workflow Git professionnel
- Branches develop, features, releases
- Tags de versions sémantiques
- "Oui, même mes projets persos suivent les bonnes pratiques !"

3️⃣ SLIDE 3 - Architecture réseau :
- Montrer le schéma du réseau local
- Proxmox, VMs, containers, NAS...
- "C'est mon petit datacenter à la maison !"

4️⃣ SLIDE 4 - Stack technique :
- IDE : Kiro.dev (bêta), VSCode, Windsurf, Cursor
- Versionning : GitHub
- BDD : PocketBase
- LLM : Mammouth.ai (portail), Claude, Mistral, ChatGPT, DeepSeek, Llama

🎯 CONSEIL : Prendre le temps sur ces slides - c'est le cœur technique de la présentation !
-->