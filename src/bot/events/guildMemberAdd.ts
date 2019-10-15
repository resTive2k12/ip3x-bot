import * as Discord from "discord.js";
import { Client } from "../api/client";

module.exports = (client: Client, member: Discord.GuildMember): void => {
    console.log("new member detected: ", member.user.username);
    //TODO: entry channel message
    const db = client.bot.config.db;
    
    db.fetch(member.guild.id).then(doc => {
        if (!doc.welcomeChannelId) {
            return;
        }
        const targetChannel = client.channels.get(doc.welcomeChannelId) as Discord.TextChannel;
        targetChannel.send(`Welcome ${member}! If you wish to join the Elite:Dangerous Squadron _INTERPLANETARY 3XPEDITIONS_ use the **!join** command. Otherwise feel free to contact an admiral or officer directly.`);
    });
    //TODO: officer channel notification
};
