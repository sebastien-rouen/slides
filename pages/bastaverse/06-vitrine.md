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

</v-switch>

<!--
BastaVerse, c'est le hub central qui connecte tout mon écosystème !
-->