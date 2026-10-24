<div align="center">

# 🎮 PlayTrace

### Ton Steam Wrapped, mais en **temps réel**.

*Real-time Steam Wrapped: PlayTrace tracks your gaming sessions live and displays your stats as you play.*

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-sans%20framework-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Steam](https://img.shields.io/badge/Steam-Web%20API-171A21?style=for-the-badge&logo=steam&logoColor=white)

</div>

---

## ✨ Le concept

PlayTrace détecte le jeu en cours sur ton compte Steam, enregistre chaque session et affiche tes statistiques **en direct**, dans un style « Wrapped » animé.

> L'API Steam ne fournit **aucun historique de sessions**. PlayTrace enregistre donc lui-même ton activité : l'historique précis commence à l'activation du suivi.

---

## 🧱 Stack technique

| Couche | Technologie |
|---|---|
| Front | **React** + Vite |
| Style | Tailwind CSS + **shadcn/ui** |
| Animations | **Motion** (motion.dev) |
| Composants animés | React Bits, Aceternity UI, Magic UI, Kokonut UI, Lightswind, Cult UI |
| Back | Node.js **sans framework** (module `http`) |
| Base de données | SQLite |
| Temps réel | SSE (Server-Sent Events) |
| Données | API Web Steam |

---

## 🎨 Bibliothèques UI

| Bibliothèque | Site | Utilisation prévue |
|---|---|---|
| **shadcn/ui** | [ui.shadcn.com](https://ui.shadcn.com/) | Base du design system : cartes, onglets, badges, skeletons, graphiques, toasts |
| **Motion** | [motion.dev](https://motion.dev) | Animations au scroll (`useScroll`, `useInView`), transitions d'apparition, `AnimatePresence` |
| **React Bits** | [reactbits.dev](https://reactbits.dev) | Compteurs animés, textes qui apparaissent, fonds animés, cartes interactives |
| **Aceternity UI** | [aceternity.com](https://www.aceternity.com) | Effets de spotlight, bento grid, révélation au scroll, cartes 3D |
| **Magic UI** | [magicui.design](https://magicui.design) | Bordures lumineuses, marquee des jeux, compteurs, effets de particules |
| **Kokonut UI** | [kokonutui.com](https://kokonutui.com) | Composants modernes complémentaires (boutons, cartes, inputs) |
| **Lightswind** | [lightswind.com](https://lightswind.com) | Composants et effets complémentaires |
| **Cult UI** | [cult-ui.com](https://cult-ui.com) | Composants d'interface originaux (dock, éléments extensibles) |

> Les composants se copient dans le projet (`src/components/ui/`) ou s'installent via la CLI de chaque bibliothèque. Vérifie sur chaque site les noms exacts et les commandes d'installation, ils évoluent régulièrement.

---

## 🚀 Fonctionnalités

### MVP
- 🔐 Connexion via **Steam OpenID**
- 📡 Détection du jeu en cours (sondage serveur toutes les 60 s)
- 💾 Enregistrement des sessions (jeu, début, fin, durée)
- 🔴 Bandeau **« En train de jouer à… »** en direct, qui pulse
- 📊 Stats : heures totales, **top 5** des jeux, **jeu de l'année**
- 📥 **Téléchargements en cours** : jeux que ton client Steam télécharge, met à jour ou installe (progression, vitesse, temps restant)

### Bonus
- 🔥 Heatmap d'activité par jour et par heure
- 🧬 Répartition par genre
- 🖼️ Export du Wrapped en image
- ⚔️ Duel de profils entre amis, avec score de compatibilité

---

## 🎬 Design et animations

- **Thème** : sombre, moderne, accents néon
- **Hero** : fond animé + compteur d'heures qui monte en direct
- **Scroll** : les cartes (top jeux, jeu de l'année, heatmap) apparaissent au défilement
- **Expériences / timeline** : défilement **alterné** gauche/droite pour l'historique des sessions
- **Bandeau live** : bordure lumineuse et pulsation quand un jeu est détecté
- **Marquee** : défilement continu des jaquettes des jeux joués

---

## 🏗️ Architecture

```
┌──────────────┐   OpenID    ┌───────────────┐
│   Navigateur │◄───────────►│  Serveur Node │
│  React + UI  │   SSE ◄─────│  (sans fwk)   │
└──────────────┘             └───────┬───────┘
                                     │ sondage 60 s (1 seul, partagé)
                       ┌─────────────┼─────────────┐
                       ▼                           ▼
                ┌────────────┐              ┌────────────┐
                │   SQLite   │              │ API Steam  │
                │  sessions  │              │ (clé en .env)
                └────────────┘              └────────────┘
```

---

## 🗄️ Modèle de données

**`users`**
| Champ | Type |
|---|---|
| steamid64 | TEXT (clé primaire) |
| pseudo | TEXT |
| created_at | DATETIME |

**`sessions`**
| Champ | Type |
|---|---|
| id | INTEGER (clé primaire) |
| steamid64 | TEXT |
| appid | INTEGER |
| game_name | TEXT |
| started_at | DATETIME |
| ended_at | DATETIME |
| duration_s | INTEGER |

**Cache** : liste des jeux possédés (`GetOwnedGames`), rafraîchie 1 fois par heure.

---

## 🔒 Sécurité

- 🔑 **Clé API uniquement côté serveur**, dans `.env` (jamais dans le code React)
- ✅ Validation stricte du format **SteamID64** (17 chiffres)
- 🚦 Limitation de requêtes par IP
- 🧱 Requêtes SQL **paramétrées**
- 🔁 **Un seul sondage serveur** partagé entre tous les visiteurs
- 🪪 Authentification via Steam OpenID, vérification côté serveur
- 🛡️ En-têtes de sécurité (CSP, `X-Content-Type-Options`, etc.)
- 📦 Build de production **minifié** (Vite)

> ⚠️ La minification et l'obfuscation ralentissent l'inspection du code client, mais ne le protègent pas : tout ce qui arrive dans le navigateur est lisible. **Seul ce qui reste sur le serveur est réellement protégé.**

---

## ⚙️ Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/<ton-pseudo>/playtrace.git
cd playtrace

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# puis renseigner STEAM_API_KEY dans .env

# 4. Lancer le serveur
npm run server

# 5. Lancer le front (autre terminal)
npm run dev
```

**`.env.example`**
```env
STEAM_API_KEY=ta_cle_api_steam
PORT=3000
BASE_URL=http://localhost:5173
SESSION_SECRET=une_longue_chaine_aleatoire_d_au_moins_32_caracteres
POLL_INTERVAL_MS=60000
# Optionnels, pour les téléchargements en cours (détectés automatiquement sinon)
# STEAM_PATH=/mnt/c/Program Files (x86)/Steam
# STEAM_LOCAL_STEAMID=7656119XXXXXXXXXX
```

> Ajoute `.env` au `.gitignore` **avant** ton premier commit.

La clé API s'obtient sur : https://steamcommunity.com/dev/apikey (nom de domaine : `localhost` en local).

---

## 📁 Structure du projet

```
playtrace/
├── server/
│   ├── index.js          # serveur HTTP + routes
│   ├── config.js         # lecture et validation du .env
│   ├── poller.js         # sondage GetPlayerSummaries
│   ├── sessions.js       # ouverture / fermeture des sessions
│   ├── stats.js          # stats annuelles, top 5, heatmap
│   ├── library.js        # cache GetOwnedGames (1 h)
│   ├── steam.js          # appels à l'API Web Steam
│   ├── sse.js            # flux temps réel
│   ├── downloads.js      # téléchargements du client Steam local
│   ├── vdf.js            # lecture des fichiers .vdf / .acf de Steam
│   ├── auth.js           # Steam OpenID + cookie de session signé
│   ├── security.js       # en-têtes, limitation par IP
│   ├── static.js         # sert le build Vite en production
│   ├── users.js          # profils
│   └── db.js             # SQLite (node:sqlite)
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui + composants animés
│   │   ├── LiveBanner.jsx
│   │   ├── DownloadsPanel.jsx
│   │   ├── TopGames.jsx
│   │   ├── GameOfTheYear.jsx
│   │   ├── Heatmap.jsx
│   │   └── SessionTimeline.jsx
│   ├── hooks/
│   │   └── useLiveStatus.js   # abonnement SSE
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
└── package.json
```

> SQLite passe par le module natif `node:sqlite` : **Node.js 22.13 ou plus** est requis, sans dépendance native à compiler.

**Production** : `npm run build` puis `npm start` (le serveur Node sert alors le front sur `PORT`, pense à mettre `BASE_URL` à jour).

---

## ⚠️ Contraintes

- Le **profil** et les **détails des jeux** doivent être en **public** sur Steam
- Environ **100 000 requêtes par jour** par clé : un sondage par minute en consomme environ 1 440
- Un Wrapped annuel n'est vraiment riche qu'après plusieurs semaines de collecte
- L'API Web Steam ne donne **pas** les téléchargements : PlayTrace lit les fichiers `appmanifest_*.acf` du client Steam installé **sur la machine du serveur** (y compris Steam Windows vu depuis WSL via `/mnt/c`). Ils ne sont visibles que par le compte connecté à ce client. Sur un serveur distant, la fonction est simplement désactivée

---

## 🗺️ Roadmap

- [x] Back : OpenID, sondage, stockage des sessions
- [x] Route SSE
- [x] Front React : dashboard et bandeau live
- [x] Animations et effets (Motion + bibliothèques UI)
- [ ] Stats avancées : heatmap, genres
- [ ] Sécurisation et déploiement
- [ ] Export image et duel entre amis

---

## 👤 Auteur

**LaFicelleCmoi** : étudiant à EPITECH Marseille, passionné de jeux vidéo, d'animes, de nouvelles technologies et de Formule 1.

---

<div align="center">

*Fait avec ☕, du néon et beaucoup de parties de Steam.*

</div>
