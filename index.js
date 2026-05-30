const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');

// 🔥 GLITCH 7/24 İÇİN WEB SUNUCUSU EKLEDİK
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('🤖 Bot canavar gibi 7/24 aktif çalışıyor!');
});

// Port 3000 üzerinden web sitesini yayına alıyoruz
app.listen(3000, () => {
    console.log('🌐 Web sunucusu port 3000 üzerinde başlatıldı.');
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const verificationCache = new Map();

const rbxApi = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// ROZET İÇİN: Komutu direkt senin sunucuna anında kaydeder
client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} aktif ve hazır!`);
    try {
        const guild = await client.guilds.fetch(config.guildId);
        if (guild) {
            await guild.commands.set([
                {
                    name: 'rozet',
                    description: 'Aktif Gelistirici rozetini tetikler.'
                }
            ]);
            console.log('⚡ Rozet komutu SUNUCUYA ANINDA KAYDEDİLDİ!');
        }
    } catch (error) {
        console.error('Sunucuya komut kaydedilirken hata oluştu:', error);
    }
});

// SUNUCUYA YENİ BİRİ GİRDİĞİNDE OTOMATİK ÇALIŞAN KISIM
client.on('guildMemberAdd', async (member) => {
    try {
        const unverifiedRole = member.guild.roles.cache.get(config.unverifiedRoleId);
        if (unverifiedRole) {
            await member.roles.add(unverifiedRole);
        }
    } catch (error) {
        console.error("Yeni gelene rol verilirken bir hata oluştu:", error);
    }
});

// KURULUM YÖNTEMİ (.kurulum)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '.kurulum') {
        if (!message.member.permissions.has('Administrator')) return;

        await message.delete().catch(() => {});

        const hosgeldinEmbed = new EmbedBuilder()
            .setTitle('ROBLOX HESAP DOĞRULAMA')
            .setDescription(
                `Sunucuya hoş geldin! Topluluğumuza katılmak ve tüm kanallara erişim sağlamak için Roblox hesabını doğrulamalısın.\n\n` +
                `🔴 **Neden Doğrulama Yapmalıyım?**\n` +
                `Sunucumuzu trollerden, reklamcılardan ve bot hesaplardan korumak için bu sistem zorunludur.\n\n` +
                `👇 Aşağıdaki **"🔗 Hesabımı Doğrula"** butonuna basarak işlemleri başlatabilirsin.`
            )
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setColor('#ff4757')
            .setFooter({ text: `${message.guild.name} Güvenlik Sistemi`, iconURL: client.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('start_verification')
                .setLabel('🔗 Hesabımı Doğrula')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [hosgeldinEmbed], components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    // ROZET İÇİN: /rozet komutu
    if (interaction.isChatInputCommand() && interaction.commandName === 'rozet') {
        return interaction.reply({ 
            content: '🎉 **Komut başarıyla çalıştırıldı!** 24 saat sonra rozetini alabilirsin.', 
            ephemeral: true 
        });
    }

    // Butona basıldığında açılacak form (Modal)
    if (interaction.isButton() && interaction.customId === 'start_verification') {
        const modal = new ModalBuilder()
            .setCustomId('roblox_username_modal')
            .setTitle('Roblox Kullanıcı Adın');

        const usernameInput = new TextInputBuilder()
            .setCustomId('roblox_input_name')
            .setLabel('Roblox Kullanıcı Adınızı Yazın:')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: xDemqrr')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(usernameInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    // Form gönderildiğinde kod üretme aşaması
    if (interaction.isModalSubmit() && interaction.customId === 'roblox_username_modal') {
        await interaction.deferReply({ ephemeral: true });
        const robloxUsername = interaction.fields.getTextInputValue('roblox_input_name');

        try {
            const userResponse = await rbxApi.post('https://users.roblox.com/v1/usernames/users', {
                usernames: [robloxUsername],
                excludeBannedUsers: false
            });

            if (!userResponse.data.data || !userResponse.data.data.length) {
                return interaction.editReply({ content: '❌ Bu kullanıcı adına sahip bir Roblox hesabı bulunamadı!' });
            }

            const robloxUser = userResponse.data.data[0];
            const verificationCode = `VASCOTIA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            verificationCache.set(interaction.user.id, {
                robloxId: robloxUser.id,
                robloxName: robloxUser.name,
                robloxDisplayName: robloxUser.displayName,
                code: verificationCode
            });

            const embed = new EmbedBuilder()
                .setTitle('📥 Son Bir Adım Kaldı!')
                .setDescription(
                    `Merhaba **${robloxUser.displayName}** (@${robloxUser.name}), hesabın bulundu! Doğrulamayı tamamlamak için:\n\n` +
                    `1️⃣ Roblox profilindeki **"Hakkında" (About / Bio)** kısmına şu kodu yapıştır:\n\`${verificationCode}\`\n\n` +
                    `2️⃣ Profilini kaydedip güncelledikten sonra aşağıdaki **"✅ Kodumu Kontrol Et"** butonuna bas.`
                )
                .setColor('#ffa500');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_check_final')
                    .setLabel('✅ Kodumu Kontrol Et')
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Roblox API bağlantısında bir hata oluştu.' });
        }
    }

    // Son kontrol ve isim değiştirme aşaması [Vascotia (@xDemqrr) formatı]
    if (interaction.isButton() && interaction.customId === 'verify_check_final') {
        await interaction.deferReply({ ephemeral: true });
        const data = verificationCache.get(interaction.user.id);

        if (!data) {
            return interaction.editReply({ content: '❌ Doğrulama oturumu bulunamadı.' });
        }

        try {
            const profileResponse = await rbxApi.get(`https://users.roblox.com/v1/users/${data.robloxId}`);
            const description = profileResponse.data.description;

            if (description && description.includes(data.code)) {
                const member = interaction.member;
                const verifiedRole = interaction.guild.roles.cache.get(config.verifiedRoleId);
                const unverifiedRole = interaction.guild.roles.cache.get(config.unverifiedRoleId);

                if (verifiedRole) {
                    await member.roles.add(verifiedRole);
                    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
                        await member.roles.remove(unverifiedRole);
                    }
                    // 🔥 BURASI SENİN İSTEDİĞİN JİLET GİBİ FORMAT
                    await member.setNickname(`${data.robloxDisplayName} (@${data.robloxName})`).catch(() => {});
                    verificationCache.delete(interaction.user.id);
                    await interaction.editReply({ content: `🎉 **BAŞARILI!** Hesabınız doğrulandı.` });
                } else {
                    await interaction.editReply({ content: '❌ Doğrulama rolü bulunamadı.' });
                }
            } else {
                await interaction.editReply({ content: `❌ Kod profilinizde bulunamadı!` });
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Doğrulama yapılırken bir hata oluştu.' });
        }
    }
});

client.login(config.token);