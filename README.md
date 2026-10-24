<div align="center">

# 🎮 PlayTrace

### Ton Steam Wrapped, mais en **temps réel**.

*Real-time Steam Wrapped: PlayTrace tracks your gaming sessions live and displays your stats as you play.*

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-sans%20framework-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
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
| Base de données | PostgreSQL (**Supabase**) |
| Hébergement | **Vercel** (front + fonction API) |
| Sondage | `pg_cron` Supabase, chaque minute |
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
- 🧬 Répartition par genre *(à venir)*
- 🖼️ Export du Wrapped en image (format story 1080 × 1920)
- ⚔️ Duel de profils entre amis, avec score de compatibilité

### Et aussi
- 🎬 **Mode Story** : le Wrapped raconté en slides plein écran, façon stories
- 🧠 **Profil de joueur** : personnalité, séries de jours, 10 badges PlayTrace à débloquer
- 📅 **Calendrier** de l'année, jour par jour, et **sélecteur d'année**
- 🏆 **Fiche de chaque jeu** : succès obtenus / manquants, rareté mondiale, succès « à portée de main », courbe de progression
- 📚 **Mes jeux** : toute la bibliothèque, recherche, tris et % de succès par jeu
- ⌨️ **Recherche rapide** `Ctrl + K`
- 🔔 **Notifications** de début et de fin de session (toast + notification du navigateur)
- 🌍 **Profil public** optionnel (désactivé par défaut), partageable par lien
- 📱 **Application installable** (PWA), utilisable hors ligne pour la coquille de l'app

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
┌──────────────┐   OpenID    ┌──────────────────────┐  sondage   ┌────────────┐
│  Navigateur  │◄───────────►│  Vercel              │───────────►│ API Steam  │
│  React + UI  │   SSE ◄─────│  front + api/index.js│            └────────────┘
└──────────────┘             └──────────┬───────────┘
                                        │ SQL               ▲ GET /api/cron/poll
                                        ▼                   │ (toutes les minutes)
                                 ┌──────────────────────────┴─┐
                                 │  Supabase Postgres         │
                                 │  schéma playtrace + pg_cron│
                                 └────────────────────────────┘
┌──────────────────────┐  POST /api/agent/downloads
│ PC avec Steam        │─────────────────────────────► Vercel
│ npm run agent        │  (téléchargements en cours)
└──────────────────────┘
```

- **Sur Vercel**, aucune fonction ne tourne en continu : c'est `pg_cron` (Supabase) qui appelle `/api/cron/poll` chaque minute, et le flux SSE envoie l'état puis se reconnecte toutes les 15 s.
- **En local**, `npm run server` fait tout dans un seul process : sondage toutes les 60 s, SSE ouvert en continu, lecture directe des téléchargements Steam.

---

## 🗄️ Modèle de données

**`users`**
| Champ | Type |
|---|---|
| steamid64 | TEXT (clé primaire) |
| pseudo | TEXT |
| avatar | TEXT |
| created_at | TIMESTAMPTZ |

**`sessions`**
| Champ | Type |
|---|---|
| id | BIGINT (clé primaire) |
| steamid64 | TEXT |
| appid | INTEGER |
| game_name | TEXT |
| started_at | TIMESTAMPTZ |
| ended_at | TIMESTAMPTZ |
| duration_s | INTEGER |
| last_seen_at | TIMESTAMPTZ |

**Cache** : liste des jeux possédés (`GetOwnedGames`), rafraîchie 1 fois par heure.

Tout vit dans le schéma `playtrace` (non exposé par l'API REST de Supabase), créé par [`server/schema.sql`](server/schema.sql). L'app s'y connecte avec un rôle dédié `playtrace_app` qui n'a accès qu'à ce schéma.

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
# puis renseigner STEAM_API_KEY et DATABASE_URL dans .env

# 4. Lancer le serveur
npm run server

# 5. Lancer le front (autre terminal)
npm run dev
```

**`.env.example`**
```env
STEAM_API_KEY=ta_cle_api_steam
DATABASE_URL=postgresql://playtrace_app.<ref>:<mot_de_passe>@aws-1-eu-west-3.pooler.supabase.com:6543/postgres
PORT=3000
BASE_URL=http://localhost:5173
SESSION_SECRET=une_longue_chaine_aleatoire_d_au_moins_32_caracteres
POLL_INTERVAL_MS=60000
CRON_SECRET=jeton_du_cron
AGENT_TOKEN=jeton_de_l_agent
AGENT_URL=https://play-trace-nine.vercel.app
# Optionnels, pour les téléchargements en cours (détectés automatiquement sinon)
# STEAM_PATH=/mnt/c/Program Files (x86)/Steam
# STEAM_LOCAL_STEAMID=7656119XXXXXXXXXX
```

> Ajoute `.env` au `.gitignore` **avant** ton premier commit.

La clé API s'obtient sur : https://steamcommunity.com/dev/apikey (nom de domaine : `localhost` en local).

---

## ☁️ Déploiement (Vercel + Supabase)

1. **Supabase** : exécuter [`server/schema.sql`](server/schema.sql), créer le rôle `playtrace_app` (droits sur le schéma `playtrace` uniquement), puis activer `pg_cron` et `pg_net` et programmer l'appel :
   ```sql
   SELECT cron.schedule('playtrace-poll', '* * * * *', $$
     SELECT net.http_get(
       url := 'https://play-trace-nine.vercel.app/api/cron/poll',
       headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
     ) $$);
   ```
2. **Vercel** : importer le dépôt (preset Vite). [`vercel.json`](vercel.json) envoie `/api/*` et `/auth/*` vers la fonction [`api/index.js`](api/index.js), dans la région `cdg1` (Paris, à côté de la base).
3. **Variables Vercel** : `STEAM_API_KEY`, `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`, `AGENT_TOKEN`, `BASE_URL` (URL publique du site).
4. **Téléchargements en cours** : sur le PC qui a Steam, avec le même `AGENT_TOKEN` dans `.env` :
   ```bash
   npm run agent
   ```

Chaque push sur `main` redéploie automatiquement.

---

## 📁 Structure du projet

```
playtrace/
├── server/
│   ├── app.js            # routes, communes au local et à Vercel
│   ├── index.js          # serveur Node local (sondage + SSE continus)
│   ├── agent.js          # envoie les téléchargements Steam au site déployé
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
│   ├── schema.sql        # schéma Postgres
│   └── db.js             # client Postgres (Supabase)
├── api/
│   └── index.js          # fonction Vercel
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
├── vercel.json
└── package.json
```

> **Node.js 22 ou plus** est requis.

**Sans Vercel** : `npm run build` puis `npm start` (le serveur Node sert alors le front sur `PORT`, pense à mettre `BASE_URL` à jour).

---

## ⚠️ Contraintes

- Le **profil** et les **détails des jeux** doivent être en **public** sur Steam
- Environ **100 000 requêtes par jour** par clé : un sondage par minute en consomme environ 1 440
- Un Wrapped annuel n'est vraiment riche qu'après plusieurs semaines de collecte
- L'API Web Steam ne donne **pas** les téléchargements : PlayTrace lit les fichiers `appmanifest_*.acf` du client Steam installé sur ton PC (y compris Steam Windows vu depuis WSL via `/mnt/c`), via `npm run server` ou `npm run agent`. Ils ne sont visibles que par le compte connecté à ce client, et disparaissent du site si l'agent ne donne plus de nouvelles depuis 45 s
- Le serveur local et Vercel partagent la même base si `DATABASE_URL` est la même : évite de laisser `npm run server` tourner en même temps que la prod, sinon Steam est sondé deux fois

---

## 🗺️ Roadmap

- [x] Back : OpenID, sondage, stockage des sessions
- [x] Route SSE
- [x] Front React : dashboard et bandeau live
- [x] Animations et effets (Motion + bibliothèques UI)
- [x] Stats avancées : heatmap, calendrier, profil de joueur
- [x] Sécurisation et déploiement (Vercel + Supabase)
- [x] Export image et duel entre amis
- [ ] Répartition par genre

---

## 👤 Auteur

**LaFicelleCmoi** : étudiant à EPITECH Marseille, passionné de jeux vidéo, d'animes, de nouvelles technologies et de Formule 1.

---

<div align="center">

*Fait avec ☕, du néon et beaucoup de parties de Steam.*

</div>
