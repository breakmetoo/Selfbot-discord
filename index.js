// ⚠️ Attention : Les self-bot sont contre les ToS de Discord


const { Client, MessageEmbed } = require('discord.js-selfbot-v13');
const { getVoiceConnection, joinVoiceChannel, getVoiceConnections } = require('@discordjs/voice');
const readline = require('readline');
const fs = require('fs');
const https = require('https');
const fetch = require('node-fetch');

let chalk;
const client = new Client({ checkUpdate: false });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const TOKEN_PATH = './token.json';
let afkStatus = { active: false, message: 'Je suis actuellement AFK (absent).', startTime: null };
let nitroSniperEnabled = true;
let stalkedUser = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function logError(commandName, errorMessage) {
    if (chalk) {
        console.error(chalk.red(`[ERREUR] Commande !${commandName}: ${errorMessage}`));
    } else {
        console.error(`[ERREUR] Commande !${commandName}: ${errorMessage}`);
    }
}

async function reply(message, content) {
    const embedToText = (embedContent) => {
        const embed = embedContent.embeds[0];
        let text = `**${embed.title || ''}**\n${embed.description || ''}\n\n`;
        if (embed.fields) {
            for (const field of embed.fields) {
                text += `**${field.name}**\n${field.value}\n\n`;
            }
        }
        return text;
    };
    const isDM = message.channel.type === 'DM';
    let newContent = content;
    if (isDM && content && content.embeds) {
        newContent = embedToText(content);
    }
    try {
        if (isDM) {
            await message.delete();
            await message.channel.send(newContent);
        } else {
            await message.edit(newContent);
        }
    } catch (error) {
        try {
            await message.delete();
            await message.channel.send(newContent);
        } catch (sendError) {
            logError('reply', `Échec de l'envoi du contenu (Raison: ${sendError.message}). Tentative de fallback final en texte.`);
            if (content && content.embeds) {
                const textFallback = embedToText(content);
                try {
                    await message.channel.send(textFallback);
                } catch (finalError) {
                    logError('reply.fallback', `Échec total de l'envoi du message: ${finalError.message}`);
                }
            }
        }
    }
}

function saveToken(token) {
    try {
        const config = { token: String(token).trim() };
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error(chalk.red(`[ERREUR] Impossible d'écrire le fichier token.json : ${error.message}`));
    }
}

function loadToken() {
    if (fs.existsSync(TOKEN_PATH)) {
        try {
            const fileContent = fs.readFileSync(TOKEN_PATH, 'utf8');
            const config = JSON.parse(fileContent);
            return config.token ? String(config.token).trim() : null;
        } catch (error) {
            console.error(chalk.red(`[ERREUR] Impossible de lire ou de parser le fichier token.json : ${error.message}`));
            console.log(chalk.red('Veuillez vérifier que le fichier token.json est un JSON valide avec une clé "token".'));
            return null;
        }
    }
    return null;
}

function showMenu() {
    console.clear();
    const border = '═'.repeat(35);
    console.log(chalk.cyanBright(chalk.bold(`╔${border}╗`)));
    console.log(chalk.cyanBright(chalk.bold(`║    🔥 SELF-BOT V12 -         🔥   ║`)));
    console.log(chalk.cyanBright(chalk.bold(`║        Power by Breakmetoo        ║`)));
    console.log(chalk.cyanBright(chalk.bold(`╚${border}╝`)));
    const status = client.isReady() ? chalk.green(`Connecté en tant que ${client.user.tag}`) : chalk.red('Déconnecté');
    console.log(chalk.bold('\n📡 Statut :'), status);
    console.log(chalk.bold('🎯 Sniper Nitro :'), nitroSniperEnabled ? chalk.green('Activé') : chalk.red('Désactivé'));
    if (stalkedUser) console.log(chalk.bold('👀 Suivi Vocal :'), chalk.magenta(`Activé sur un utilisateur`));
    if (client.isReady()) console.log(chalk.yellowBright('\nℹ️ Le bot est prêt. Tapez `!help` sur Discord.'));
    console.log('\n' + chalk.bold('⚙️ Options :'));
    console.log(' 1️⃣ ' + chalk.cyan('Changer de compte'));
    console.log(' 2️⃣ ' + chalk.magenta('Activer/Désactiver le Sniper Nitro'));
    console.log(' 3️⃣ ' + chalk.yellow('Quitter'));
    rl.question(chalk.bold('\n➡️  Votre choix : '), handleMenuChoice);
}

function askForToken() {
    rl.question(chalk.cyan('🔑 Entrez votre token Discord : '), (token) => {
        if (!token) {
            console.log(chalk.red('❌ Le token ne peut pas être vide.'));
            return delay(1500).then(showMenu);
        }
        console.log(chalk.cyan('🚀 Tentative de connexion...'));
        client.login(token).catch(err => {
            console.error(chalk.red(`\n❌ Échec de la connexion. Vérifiez votre token.`));
            delay(2000).then(showMenu);
        });
    });
}

async function handleMenuChoice(choice) {
    switch (choice.trim()) {
        case '1': askForToken(); break;
        case '2':
            nitroSniperEnabled = !nitroSniperEnabled;
            console.log(chalk.magenta(`🎯 Sniper Nitro ${nitroSniperEnabled ? 'activé' : 'désactivé'}.`));
            await delay(1500);
            showMenu();
            break;
        case '3':
            console.log(chalk.green('👋 À bientôt !'));
            await client.destroy();
            rl.close();
            process.exit(0);
        default:
            console.log(chalk.red('❌ Choix invalide.'));
            await delay(1500);
            showMenu();
    }
}

async function handleHelpCommand(message) {
    const helpEmbed = new MessageEmbed()
        .setTitle('🔥 Help du Self-Bot 🔥')
        .setColor('#FF00FF')
        .setDescription('Voici la liste des commandes disponibles.')
        .setTimestamp()
        .setFooter({ text: `Power by Breakmetoo` });
    const utilCommands = [
        '`!help` > Affiche ce message.',
        '`!ping` > Affiche la latence.',
        '`!cleanup [nombre]` > Supprime le nombre spécifié de vos messages récents (ex: `!cleanup 50`). Si `0` est utilisé (`!cleanup 0`), il supprime autant de messages que possible (jusqu\'à 1000 messages récents, limités à ceux de moins de 14 jours par Discord).',
        '`!purge <user>` > Supprime les messages d\'un utilisateur (serveur uniquement).',
        '`!afk [msg]` > Active/Désactive le mode AFK.',
        '`!nitrosniper` > Active/Désactive le sniper Nitro.',
        '`!qr <texte>` > Génère un QR code.',
        '`!poll <q>` > Crée un sondage.',
        '`!calc <calcul>` > Calcule une expression.',
        '`!cat` > Affiche une image de chat aléatoire.'
    ].join('\n');
    const vocalCommands = [
        '`!joinvc [ID|nom]` > Rejoint un salon vocal.',
        '`!leavevc` > Quitte le salon vocal.',
        '`!vc <user>` > Trouve un utilisateur en vocal.',
        '`!stalk <user>` > Suit un utilisateur en vocal.',
        '`!unstalk` > Arrête de suivre.'
    ].join('\n');
    const profilCommands = [
        '`!setpfp <url>` > Change votre photo de profil.',
        '`!copyprofile <user>` > Copie l\'avatar d\'un utilisateur.',
        '`!playing <nom>` > Change le statut (pas de boutons).',
        '`!streaming <nom>, [stream_url]` > Change le statut avec un lien de streaming optionnel (pas de boutons).',
        '`!listening <nom>, [image_url]` > Change le statut avec une image optionnelle (pas de boutons).',
        '`!watching <nom>, [image_url]` > Change le statut avec une image optionnelle (pas de boutons).',
        '`!clearstatus` > Supprime votre statut.'
    ].join('\n');
    const infoCommands = [
        '`!userinfo [user]` > Infos sur un utilisateur.',
        '`!serverinfo` > Infos sur le serveur.',
        '`!avatar [user]` > Affiche l\'avatar.',
        '`!servericon` > Affiche l\'icône du serveur.',
        '`!roleinfo <rôle>` > Infos sur un rôle.',
        '`!weather <ville>` > Météo d\'une ville.',
        '`!ipinfo <ip>` > Affiche des infos sur une adresse IP.'
    ].join('\n');
    helpEmbed.addFields(
        { name: '🛠️ UTILITAIRES & AUTOMATION', value: utilCommands, inline: false },
        { name: '🎙️ VOCAL & SUIVI', value: vocalCommands, inline: false },
        { name: '👤 PROFIL & PERSONNALISATION', value: profilCommands, inline: false },
        { name: 'ℹ️ INFO', value: infoCommands, inline: false }
    );
    await reply(message, { embeds: [helpEmbed] });
}

async function handleCatCommand(message) {
    try {
        const apiUrl = 'https://api.thecatapi.com/v1/images/search?mime_types=gif';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return message.edit("❌ L'API des chats ne répond pas correctement.");
        }
        const result = await response.json();
        if (!Array.isArray(result) || result.length === 0 || !result[0].url) {
            return message.edit('❌ L\'API n\'a renvoyé aucun GIF valide.');
        }
        const imageUrl = result[0].url;
        await message.edit(imageUrl);
    } catch (e) {
        logError('cat', `Erreur inattendue: ${e.message}`);
        try {
            await message.edit("❌ Une erreur critique est survenue avec la commande !cat.");
        } catch (finalError) {
            logError('cat.final', `Impossible de notifier l'utilisateur: ${finalError.message}`);
        }
    }
}

async function handlePingCommand(message) {
    const startTime = Date.now();
    await reply(message, 'Pinging...');
    const endTime = Date.now();
    await reply(message, `🏓 **Pong !** La latence est de **${endTime - startTime}ms**.`);
}

async function handleUserInfoCommand(message, args) {
    let user;
    const mention = message.mentions.users.first();
    const query = args[0];
    if (mention) { user = mention; }
    else if (query) { try { user = await client.users.fetch(query); } catch { return reply(message, '❌ Utilisateur introuvable.'); } }
    else { user = message.author; }
    const member = message.guild?.members.cache.get(user.id);
    const joinDate = member ? new Date(member.joinedTimestamp).toLocaleDateString('fr-FR') : 'N/A';
    const roles = member ? member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.name).join(', ') || 'Aucun' : 'N/A';
    const info = `
\`\`\`
--- INFO UTILISATEUR ---
Nom        : ${user.tag}
ID         : ${user.id}
Compte créé le : ${new Date(user.createdTimestamp).toLocaleDateString('fr-FR')}
A rejoint le   : ${joinDate}
Rôles      : ${roles.substring(0, 1000)}
Bot        : ${user.bot ? 'Oui' : 'Non'}
\`\`\`
`;
    await reply(message, info);
}

async function handleServerInfoCommand(message) {
    if (!message.guild) return reply(message, '❌ Commande disponible sur un serveur uniquement.');
    const guild = message.guild;
    const owner = await guild.fetchOwner();
    const info = `
    \`\`\`
    --- INFO SERVEUR ---
    Nom        : ${guild.name}
    ID         : ${guild.id}
    Propriétaire : ${owner.user.tag}
    Créé le    : ${new Date(guild.createdTimestamp).toLocaleDateString('fr-FR')}
    Membres    : ${guild.memberCount}
    Salons     : ${guild.channels.cache.size}
    Rôles      : ${guild.roles.cache.size}
    \`\`\`
    `;
    await reply(message, info);
}

async function handleAvatarCommand(message, args) {
    let user;
    const mention = message.mentions.users.first();
    const query = args[0];
    if (mention) { user = mention; }
    else if (query) { try { user = await client.users.fetch(query); } catch { return reply(message, '❌ Utilisateur introuvable.'); } }
    else { user = message.author; }
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });
    await reply(message, `Voici l'avatar de **${user.tag}**:\n${avatarURL}`);
}

async function handleCleanupCommand(message, args) {
    let limit = 100;
    let originalLimitRequest = '100';
    if (args.length > 0) {
        const parsedLimit = parseInt(args[0]);
        if (!isNaN(parsedLimit) && parsedLimit >= 0) {
            if (parsedLimit === 0) {
                limit = 1000;
                originalLimitRequest = 'tous les messages possibles';
            } else {
                limit = Math.min(parsedLimit, 1000);
                originalLimitRequest = parsedLimit.toString();
            }
        } else {
            return reply(message, '❌ Veuillez spécifier un nombre valide de messages à supprimer (ex: `!cleanup 50`, `!cleanup 0` pour tout).');
        }
    }
    try {
        await reply(message, `🧹 Nettoyage en cours...`);
        const fetchedMessages = await message.channel.messages.fetch({ limit: limit });
        const userMessages = fetchedMessages.filter(m => m.author.id === client.user.id);
        if (userMessages.size === 0) {
            if (message.deletable) await message.delete().catch(() => {});
            const confirm = await message.channel.send('✅ Aucun de vos messages à supprimer n\'a été trouvé dans la plage spécifiée.');
            setTimeout(() => confirm.delete().catch(() => {}), 3000);
            return;
        }
        let deletedCount = 0;
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
        const recentMessages = userMessages.filter(m => m.createdTimestamp > twoWeeksAgo);
        const olderMessages = userMessages.filter(m => m.createdTimestamp <= twoWeeksAgo);
        

        if (message.channel.type !== 'DM' && recentMessages.size > 0 && typeof message.channel.bulkDelete === 'function') {
            const messagesToBulkDelete = recentMessages.array();
            const chunks = [];
            for (let i = 0; i < messagesToBulkDelete.length; i += 99) {
                chunks.push(messagesToBulkDelete.slice(i, i + 99));
            }
            for (const chunk of chunks) {
                await message.channel.bulkDelete(chunk, true).catch(err => {
                    logError('cleanup.bulkDelete', `Échec partiel: ${err.message}`);
                });
                deletedCount += chunk.length;
                await delay(1000);
            }
        }
        

        const messagesToDeleteIndividually = message.channel.type === 'DM' ? userMessages : olderMessages;
        if (messagesToDeleteIndividually.size > 0) {
            console.log(chalk.yellow(`[INFO] Suppression de ${messagesToDeleteIndividually.size} messages...`));
            for (const msg of messagesToDeleteIndividually.values()) {
                await msg.delete().catch(() => {});
                deletedCount++;
                await delay(350); // Rate limit 
            }
        }
        
        if (deletedCount === 0) {
            if (message.deletable) await message.delete().catch(() => {});
            const confirm = await message.channel.send('⚠️ Aucun message n\'a pu être supprimé. Vérifiez les permissions ou l\'âge des messages.');
            setTimeout(() => confirm.delete().catch(() => {}), 3000);
            return;
        }
        
        const confirmMsg = await message.channel.send(`✅ ${deletedCount} messages supprimés.`);
        setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);
    } catch (e) {
        logError('cleanup', e.message);
        await reply(message, "❌ Erreur lors de la suppression. Je n'ai peut-être pas les permissions nécessaires ou une erreur s'est produite.");
    }
}

async function handleAfkCommand(message, args) {
    afkStatus.active = !afkStatus.active;
    if (afkStatus.active) {
        afkStatus.message = args.join(' ') || 'Je suis actuellement AFK (absent).';
        afkStatus.startTime = new Date();
        await reply(message, `✅ Mode AFK activé : **${afkStatus.message}**`);
    } else {
        await reply(message, '✅ Mode AFK désactivé.');
    }
}

async function handleSetStatusCommand(message, args, type) {
    const fullArgs = args.join(' ');
    const parts = fullArgs.split(/\s*,\s*/);
    const name = parts[0];
    const imageUrl = type !== 'PLAYING' ? parts[1] : null;
    const streamUrl = type === 'STREAMING' ? parts[2] : null;
    if (!name) {
        return reply(message, '❌ Veuillez fournir un texte.');
    }
    try {
        const activity = {
            name: name,
            type: type,
            assets: {}
        };
        if (type === 'STREAMING') {
            activity.url = streamUrl && (streamUrl.startsWith('http://') || streamUrl.startsWith('https://'))
                ? streamUrl
                : 'https://www.twitch.tv/discord';
        }
        if (imageUrl && type !== 'PLAYING' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            activity.assets.large_image = imageUrl;
            activity.assets.large_text = name;
        }
        client.user.setPresence({ activities: [activity], status: 'online' });
        let response = `✅ Statut mis à jour : **${type.charAt(0) + type.slice(1).toLowerCase()} ${name}**`;
        if (imageUrl && type !== 'PLAYING') response += ' avec une image';
        if (type === 'STREAMING' && streamUrl) response += ' et un lien de streaming personnalisé';
        response += '.';
        await reply(message, response);
    } catch (e) {
        logError(type.toLowerCase(), e.message);
        await reply(message, '❌ Erreur lors du changement de statut. Vérifiez que les URLs (image, streaming) sont valides.');
    }
}

async function handleClearStatusCommand(message) {
    try {
        client.user.setActivity(null);
        await reply(message, '✅ Statut personnalisé supprimé.');
    } catch (e) {
        logError('clearstatus', e.message);
    }
}

async function handleJoinVcCommand(message, args) {
    let targetChannel;
    const query = args.join(' ');
    if (query) {
        targetChannel = client.channels.cache.get(query) || client.channels.cache.find(c => c.name?.toLowerCase() === query.toLowerCase() && c.type === 'GUILD_VOICE');
    } else if (message.guild) {
        targetChannel = message.member?.voice?.channel;
        if (!targetChannel) return reply(message, "❌ Vous n'êtes dans aucun salon vocal. Rejoignez-en un ou spécifiez un ID.");
    } else {
        return reply(message, '❌ Usage : `!joinvc <ID du salon>` (obligatoire en message privé).');
    }
    if (!targetChannel || targetChannel.type !== 'GUILD_VOICE') return reply(message, '❌ Salon vocal introuvable.');
    try {
        joinVoiceChannel({ channelId: targetChannel.id, guildId: targetChannel.guild.id, adapterCreator: targetChannel.guild.voiceAdapterCreator });
        await reply(message, `✅ J'ai rejoint le salon vocal **${targetChannel.name}**.`);
    } catch (t) {
        logError('joinvc', t.message);
        await reply(message, `❌ Impossible de rejoindre le salon : ${t.message}`);
    }
}

async function handleLeaveVcCommand(message) {
    const connection = getVoiceConnections().values().next().value;
    if (!connection) return reply(message, "❌ Vous n'êtes dans aucun salon vocal.");
    try {
        connection.destroy();
        await reply(message, '👋 Vous avez quitté le salon vocal.');
    } catch (r) {
        logError('leavevc', r.message);
    }
}

async function handleLeaveServerCommand(message) {
    if (!message.guild) return reply(message, '❌ Commande impossible en message privé.');
    if (message.guild.ownerId === client.user.id) return reply(message, "❌ **Action impossible :** Vous êtes le propriétaire du serveur.");
    try {
        const serverName = message.guild.name;
        await reply(message, `🚨 AVERTISSEMENT 🚨\nQuitter "**${serverName}**" dans 5 secondes...`);
        await delay(5000);
        await message.guild.leave();
        console.log(chalk.yellow(`✅ Serveur "${serverName}" quitté.`));
    } catch (r) {
        logError('leave', r.message);
    }
}

async function handleNitroSniperToggle(message) {
    nitroSniperEnabled = !nitroSniperEnabled;
    await reply(message, `🎯 **Sniper Nitro ${nitroSniperEnabled ? "Activé" : "Désactivé"}**.`);
}

async function handleVcCommand(message, args) {
    const query = args.join(' ');
    if (!query) return reply(message, '❌ Veuillez mentionner un utilisateur ou donner son ID.');
    const userToFind = message.mentions.users.first() || await client.users.fetch(query).catch(() => null);
    if (!userToFind) return reply(message, '❌ Utilisateur introuvable.');
    for (const guild of client.guilds.cache.values()) {
        const member = await guild.members.fetch(userToFind.id).catch(() => null);
        if (member && member.voice.channel) {
            const channel = member.voice.channel;
            try {
                const invite = await channel.createInvite({ maxAge: 60, maxUses: 1 });
                return reply(message, `✅ **${userToFind.tag}** est dans **${channel.name}** sur le serveur **${guild.name}**.\nLien d'invitation (valide 1 min) : ${invite.url}`);
            } catch (i) {
                return reply(message, `✅ **${userToFind.tag}** est dans **${channel.name}** sur **${guild.name}**, mais je ne peux pas créer d'invitation.`);
            }
        }
    }
    await reply(message, `❌ **${userToFind.tag}** n'a pas été trouvé dans aucun salon vocal commun.`);
}

async function handleStalkCommand(message, args) {
    if (stalkedUser) return reply(message, "❌ Je suis déjà en train de suivre quelqu'un. Utilisez `!unstalk` d'abord.");
    const query = args.join(' ');
    if (!query) return reply(message, '❌ Veuillez mentionner un utilisateur ou donner son ID.');
    const userToStalk = message.mentions.users.first() || await client.users.fetch(query).catch(() => null);
    if (!userToStalk) return reply(message, '❌ Utilisateur introuvable.');
    stalkedUser = userToStalk.id;
    await reply(message, `👀 Je suis maintenant en train de suivre **${userToStalk.tag}**. Je le rejoindrai dès qu'il changera de salon.`);
    console.log(chalk.magenta(`[STALK] Suivi de ${userToStalk.tag} activé.`));
}

async function handleUnstalkCommand(message) {
    if (!stalkedUser) return reply(message, "❌ Je ne suis personne en ce moment.");
    console.log(chalked.magenta('[STALK] Suivi désactivé.'));
    stalkedUser = null;
    await reply(message, '👀 Suivi désactivé.');
}

async function handleSetPfpCommand(message, args) {
    const url = args[0];
    if (!url) return reply(message, "❌ Veuillez fournir une URL d'image.");
    await reply(message, "🔄 Changement de l'avatar en cours...");
    try {
        await client.user.setAvatar(url);
        await reply(message, '✅ Photo de profil mise à jour !');
    } catch (r) {
        logError('setpfp', r.message);
        await reply(message, "❌ Erreur. L'URL est-elle valide ? Le format est-il correct (PNG/JPG) ?");
    }
}

async function handleCopyProfileCommand(message, args) {
    const query = args.join(' ');
    if (!query) return reply(message, '❌ Veuillez mentionner un utilisateur ou donner son ID.');
    const userToCopy = message.mentions.users.first() || await client.users.fetch(query).catch(() => null);
    if (!userToCopy) return reply(message, '❌ Utilisateur introuvable.');
    await reply(message, `🔄 Copie de l'avatar de **${userToCopy.tag}**...`);
    try {
        await client.user.setAvatar(userToCopy.displayAvatarURL({ format: 'png', size: 1024 }));
        await reply(message, `✅ Avatar de **${userToCopy.tag}** copié !`);
    } catch (t) {
        logError('copyprofile', t.message);
        await reply(message, '❌ Erreur lors de la copie du profil.');
    }
}

async function handlePurgeCommand(message, args) {
    if (message.channel.type === 'DM') {
        return reply(message, '❌ La commande `!purge` ne peut être utilisée que sur un serveur.');
    }
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return reply(message, "❌ Vous n'avez pas la permission de gérer les messages.");
    }
    const userToPurge = message.mentions.users.first();
    if (!userToPurge) return reply(message, '❌ Veuillez mentionner un utilisateur.');
    try {
        await reply(message, `🧹 Purge des messages de ${userToPurge.tag}...`);
        const messages = (await message.channel.messages.fetch({ limit: 100 })).filter(m => m.author.id === userToPurge.id);
        if (messages.size === 0) return reply(message, `✅ Aucun message récent trouvé pour ${userToPurge.tag}.`);
        await message.channel.bulkDelete(messages, true);
        const confirmMsg = await message.channel.send(`✅ ${messages.size} messages de **${userToPurge.tag}** ont été supprimés.`);
        setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
    } catch (t) {
        logError('purge', t.message);
        await reply(message, '❌ Erreur lors de la suppression des messages. Ils sont peut-être trop anciens.');
    }
}

async function handleQrCommand(message, args) {
    const text = args.join(' ');
    if (!text) return reply(message, '❌ Veuillez fournir du texte ou un lien pour générer un QR code.');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
    await reply(message, `**Voici votre QR Code :**\n${qrUrl}`);
}

async function handlePollCommand(message, args) {
    const question = args.join(' ');
    if (!question) return reply(message, '❌ Veuillez poser une question pour le sondage.');
    await message.delete();
    const pollMessage = await message.channel.send(`**📊 Sondage :** ${question}`);
    await pollMessage.react('✅');
    await pollMessage.react('❌');
}

async function handleCalcCommand(message, args) {
    const expression = args.join(' ');
    if (!expression) return reply(message, '❌ Veuillez fournir une expression mathématique.');
    try {
        const result = eval(expression.replace(/[^-()\d/*+.]/g, ''));
        await reply(message, `🧮 **Résultat :** \`${expression} = ${result}\``);
    } catch {
        await reply(message, '❌ Expression mathématique invalide.');
    }
}

async function handleRoleInfoCommand(message, args) {
    if (!message.guild) return reply(message, '❌ Commande de serveur uniquement.');
    const query = args.join(' ');
    if (!query) return reply(message, '❌ Veuillez spécifier un nom ou un ID de rôle.');
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === query.toLowerCase() || r.id === query);
    if (!role) return reply(message, '❌ Rôle introuvable.');
    const info = `
    \`\`\`
    --- INFO RÔLE ---
    Nom        : ${role.name}
    ID         : ${role.id}
    Couleur    : ${role.hexColor}
    Créé le    : ${new Date(role.createdTimestamp).toLocaleDateString('fr-FR')}
    Membres    : ${role.members.size}
    Position   : ${role.position}
    Mentionable: ${role.mentionable ? 'Oui' : 'Non'}
    \`\`\`
    `;
    await reply(message, info);
}

async function handleServerIconCommand(message) {
    if (!message.guild) return reply(message, '❌ Commande de serveur uniquement.');
    const iconURL = message.guild.iconURL({ dynamic: true, size: 1024 });
    if (!iconURL) return reply(message, "❌ Ce serveur n'a pas d'icône.");
    await reply(message, `Voici l'icône de **${message.guild.name}**:\n${iconURL}`);
}

async function handleWeatherCommand(message, args) {
    const city = args.join(' ');
    if (!city) return reply(message, '❌ Veuillez spécifier une ville.');
    https.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const weather = JSON.parse(data);
                const current = weather.current_condition[0];
                const info = `
                \`\`\`
                Météo pour : ${weather.nearest_area[0].areaName[0].value}, ${weather.nearest_area[0].country[0].value}
                ---------------------------------
                Condition  : ${current.weatherDesc[0].value}
                Température: ${current.temp_C}°C (ressenti ${current.FeelsLikeC}°C)
                Vent       : ${current.windspeedKmph} km/h
                Humidité   : ${current.humidity}%
                \`\`\`
                `;
                reply(message, info);
            } catch (n) {
                reply(message, '❌ Impossible de trouver la météo pour cette ville.');
            }
        });
    }).on('error', e => logError('weather', e.message));
}

function loadToken() {
    if (fs.existsSync(TOKEN_PATH)) {
        try {
            return fs.readFileSync(TOKEN_PATH, 'utf8').trim();
        } catch (error) {
            console.error(chalk.red(`[ERREUR] Impossible de lire le fichier token.json : ${error.message}`));
            return null;
        }
    }
    return null;
}

function saveToken(token) {
    fs.writeFileSync(TOKEN_PATH, token.trim(), 'utf8');
}

async function handleIpInfoCommand(message, args) {
    const ip = args[0];
    if (!ip) return reply(message, '❌ Veuillez fournir une adresse IP.');
    const http = require('http');
    http.get(`http://ip-api.com/json/${ip}`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const info = JSON.parse(data);
                if (info.status === 'fail') return reply(message, "❌ Adresse IP invalide ou privée.");
                const embed = new MessageEmbed()
                    .setTitle(`ℹ️ Informations sur ${info.query}`)
                    .setColor('#3498DB')
                    .addFields(
                        { name: 'Pays', value: `${info.country || 'N/A'}`, inline: true },
                        { name: 'Région', value: `${info.regionName || 'N/A'}`, inline: true },
                        { name: 'Ville', value: `${info.city || 'N/A'}`, inline: true },
                        { name: 'FAI', value: `${info.isp || 'N/A'}`, inline: false },
                        { name: 'Organisation', value: `${info.org || 'N/A'}`, inline: false }
                    );
                reply(message, { embeds: [embed] });
            } catch (e) {
                logError('ipinfo', e.message);
                reply(message, "❌ Erreur de l'API de géolocalisation.");
            }
        });
    }).on('error', (e) => {
        logError('ipinfo', e.message);
        reply(message, "❌ Erreur de connexion à l'API de géolocalisation.");
    });
}

async function main() {
    try {
        chalk = (await import('chalk')).default;
    } catch (e) {
        console.log("Le module 'chalk' n'a pas pu être chargé. Les couleurs ne seront pas disponibles. Assurez-vous de l'installer avec 'npm install chalk'.");
        const noColor = (str) => str;
        chalk = new Proxy({}, { get: () => noColor });
    }
    client.once('ready', () => {
        console.clear();
        console.log(chalk.green(`\n✅ Prêt ! ${client.user.tag}`));
        if (client.token) saveToken(client.token);
        showMenu();
    });
    client.on('messageCreate', async (message) => {
        if (nitroSniperEnabled) {
            const nitroRegex = /(discord\.gift\/|discordapp\.com\/gifts\/)([a-zA-Z0-9]+)/;
            const match = message.content.match(nitroRegex);
            if (match && match[2]) {
                const code = match[2];
                const options = {
                    method: 'POST',
                    hostname: 'discordapp.com',
                    path: `/api/v9/entitlements/gift-codes/${code}/redeem`,
                    headers: { 'Authorization': client.token }
                };
                const req = https.request(options, (res) => {
                    if (res.statusCode === 200) {
                        console.log(chalk.green(`[NITRO] Succès ! Cadeau Nitro réclamé : ${code}`));
                        message.channel.send(`Merci pour le Nitro ! Cadeau réclamé par ${client.user.username}.`).catch(()=>{});
                    } else {
                        console.log(chalk.red(`[NITRO] Échec de la réclamation du code ${code} (Code: ${res.statusCode}). Il est probablement invalide ou déjà utilisé.`));
                    }
                });
                req.on('error', (e) => logError('nitrosniper', e.message));
                req.end();
            }
        }
        if (afkStatus.active && message.mentions.has(client.user) && !message.author.bot) {
            await message.channel.send(`**${client.user.username}** est AFK : *${afkStatus.message}* (depuis ${afkStatus.startTime.toLocaleTimeString('fr-FR')})`).catch(()=>{});
            return;
        }
        if (message.author.id !== client.user.id || !message.content.startsWith('!')) return;
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const commands = {
            'help': handleHelpCommand, 'ping': handlePingCommand, 'cleanup': handleCleanupCommand,
            'userinfo': handleUserInfoCommand, 'serverinfo': handleServerInfoCommand, 'avatar': handleAvatarCommand,
            'joinvc': handleJoinVcCommand, 'leavevc': handleLeaveVcCommand,
            'leave': handleLeaveServerCommand, 'afk': handleAfkCommand,
            'playing': (m, a) => handleSetStatusCommand(m, a, 'PLAYING'),
            'streaming': (m, a) => handleSetStatusCommand(m, a, 'STREAMING'),
            'listening': (m, a) => handleSetStatusCommand(m, a, 'LISTENING'),
            'watching': (m, a) => handleSetStatusCommand(m, a, 'WATCHING'),
            'clearstatus': handleClearStatusCommand, 'nitrosniper': handleNitroSniperToggle,
            'vc': handleVcCommand, 'stalk': handleStalkCommand, 'unstalk': handleUnstalkCommand,
            'setpfp': handleSetPfpCommand, 'copyprofile': handleCopyProfileCommand,
            'purge': handlePurgeCommand, 'qr': handleQrCommand,
            'cat': handleCatCommand,
            'poll': handlePollCommand, 'calc': handleCalcCommand, 'roleinfo': handleRoleInfoCommand,
            'servericon': handleServerIconCommand, 'weather': handleWeatherCommand, 'ipinfo': handleIpInfoCommand,
        };
        if (commands[command]) await commands[command](message, args);
    });
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (stalkedUser && newState.id === stalkedUser && oldState.channelId !== newState.channelId && newState.channel) {
            console.log(chalk.magenta(`[STALK] ${newState.member.user.tag} a bougé vers ${newState.channel.name}. Je le suis...`));
            joinVoiceChannel({
                channelId: newState.channel.id,
                guildId: newState.guild.id,
                adapterCreator: newState.guild.voiceAdapterCreator,
            });
        }
    });
    const savedToken = loadToken();
    if (savedToken) {
        console.log(chalk.cyan('ℹ️ Un token a été trouvé. Tentative de connexion automatique...'));
        client.login(savedToken).catch(() => {
            console.log(chalk.red('❌ La connexion automatique a échoué. Veuillez entrer un token manuellement.'));
            askForToken();
        });
    } else {
        console.log(chalk.yellow('👋 Bienvenue ! Aucun token sauvegardé.'));
        askForToken();
    }
}

main().catch(err => console.error("Erreur critique au démarrage:", err));
