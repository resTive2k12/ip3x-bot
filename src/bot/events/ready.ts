import { Client } from "../api/client";
import { GuildEntry } from "../api/storage";

module.exports = (client: Client): void => {
    console.log("ready: ", client.guilds.reduce((acc, guild ) =>  acc + `${guild.name} [ID: ${guild.id}] ${guild.owner.user.username} `, ''));
    client.guilds.forEach(guild => {
        client.bot.config.db.fetch(guild.id).then(() => console.log('found configuration for ' + guild.name)).catch(() => {
            const newGuild: GuildEntry = {_id:guild.id, lastUpdate: Date.now()};
            client.bot.config.db.insert(newGuild);
            console.log(`created new configuration entry for ${guild.name} [ID: ${guild.id}].`);
        });
    });
};