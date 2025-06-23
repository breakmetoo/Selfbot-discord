# 🔥 Discord Self-Bot v12 par Breakmetoo 🔥

⚠️ **ATTENTION :** L'utilisation de self-bots est strictement contre les Conditions d'Utilisation (ToS) de Discord et peut entraîner la résiliation de votre compte. Utilisez ce script à vos propres risques.

Ce dépôt contient un self-bot Discord écrit en JavaScript, utilisant la librairie `discord.js-selfbot-v13`. Il offre diverses fonctionnalités pour améliorer votre expérience Discord.

## ✨ Fonctionnalités

Le bot inclut une gamme de commandes et de fonctionnalités :

### 🛠️ Utilitaires & Automatisation
* `!help` : Affiche la liste des commandes disponibles.
* `!ping` : Affiche la latence du bot.
* `!cleanup [nombre]` : Supprime un nombre spécifié de vos messages récents. Utilisez `0` pour supprimer autant de messages que possible (jusqu'à 1000, limités à ceux de moins de 14 jours par Discord).
* `!purge <user>` : Supprime les messages d'un utilisateur spécifique sur un serveur (nécessite les permissions de gestion des messages).
* `!afk [message]` : Active ou désactive le mode AFK avec un message personnalisé.
* `!nitrosniper` : Active ou désactive la fonctionnalité de "Nitro Sniper" pour tenter de réclamer automatiquement les codes Nitro partagés.
* `!qr <texte>` : Génère un code QR à partir du texte fourni.
* `!poll <question>` : Crée un sondage simple avec des réactions ✅ et ❌.
* `!calc <expression>` : Calcule une expression mathématique simple.
* `!cat` : Affiche une image de chat aléatoire.

### 🎙️ Vocal & Suivi
* `!joinvc [ID|nom]` : Rejoignez un salon vocal par ID ou nom, ou votre salon actuel si aucun n'est spécifié.
* `!leavevc` : Quitte le salon vocal actuel.
* `!vc <user>` : Trouve le salon vocal où se trouve un utilisateur et génère un lien d'invitation (si possible).
* `!stalk <user>` : Commence à suivre un utilisateur en vocal et rejoint automatiquement son salon lorsqu'il change.
* `!unstalk` : Arrête le suivi vocal.

### 👤 Profil & Personnalisation
* `!setpfp <url>` : Change votre photo de profil Discord avec l'URL donnée.
* `!copyprofile <user>` : Copie l'avatar d'un utilisateur spécifié.
* `!playing <nom>` : Change votre statut pour "Joue à..."
* `!streaming <nom>, [stream_url]` : Change votre statut pour "Streame..." (avec une URL de stream optionnelle).
* `!listening <nom>, [image_url]` : Change votre statut pour "Écoute..." (avec une URL d'image optionnelle).
* `!watching <nom>, [image_url]` : Change votre statut pour "Regarde..." (avec une URL d'image optionnelle).
* `!clearstatus` : Supprime votre statut personnalisé.

### ℹ️ Informations
* `!userinfo [user]` : Affiche des informations détaillées sur un utilisateur (vous-même si non spécifié).
* `!serverinfo` : Affiche des informations sur le serveur actuel.
* `!avatar [user]` : Affiche l'avatar d'un utilisateur.
* `!servericon` : Affiche l'icône du serveur actuel.
* `!roleinfo <rôle>` : Affiche des informations sur un rôle spécifique sur le serveur.
* `!weather <ville>` : Affiche la météo pour une ville donnée.
* `!ipinfo <ip>` : Affiche des informations de géolocalisation pour une adresse IP.

## 🚀 Installation

Pour installer et exécuter ce self-bot, suivez les étapes ci-dessous :

1.  **Prérequis :**
    * [Node.js](https://nodejs.org/) (version 16.6 ou supérieure recommandée)
    * Un compte Discord (utilisé pour le token de votre self-bot)

2.  **Cloner le dépôt :**
    ```bash
    git clone https://github.com/breakmetoo/Selfbot-discord.git
    cd Selfbot-discord
    ```

3.  **Installer les dépendances :**
    ```bash
    npm install
    ```
    Si vous rencontrez des problèmes avec `chalk`, installez-le spécifiquement :
    ```bash
    npm install chalk@^5.0.0
    ```

4.  **Exécuter le bot :**
    ```bash
    node index.js
    ```

    Lors du premier lancement, le script vous demandera votre token Discord. Ce token sera sauvegardé dans un fichier `token.json` pour les connexions futures.

    **Comment obtenir votre token Discord :**
    1.  Ouvrez Discord dans votre navigateur (ou l'application de bureau).
    2.  Appuyez sur `Ctrl + Shift + I` (Windows/Linux) ou `Cmd + Option + I` (macOS) pour ouvrir les outils de développement.
    3.  Allez dans l'onglet `Application` (ou `Stockage local` > `Local Storage` > `https://discord.com` si `Application` n'est pas visible).
    4.  Dans le stockage local, cherchez la clé `token`. Copiez la valeur (elle est entre guillemets et commence par `mfa.` ou `ND...`).
    5.  Collez cette valeur dans le terminal lorsque le script vous le demande.

## ⚙️ Configuration (via le Menu Console)

Après la connexion réussie, un menu s'affichera dans votre console :
