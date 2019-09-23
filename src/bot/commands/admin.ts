import * as Discord from "discord.js";
import { HelpField, Client } from "../..";


function setWelcomeChannel(db: Nedb, message: Discord.Message, client: Client): void {
  db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
    if (err) {
      client.bot.logger.error("error finding guild config", err);
      return;
    }
    if (doc === null) {
      client.bot.logger.debug(`no config entry found for guild ${message.guild.name}, ${message.guild.id}`);
      db.insert(
        {
          "guild-id": message.guild.id,
          "welcome-channel": message.channel.id,
          "last-update": Date.now()
        },
        (err, insertedDoc) => {
          if (err) {
            client.bot.logger.error(`Error inserting document: ${err}`);
            return;
          }
          client.bot.logger.debug(`inserted document: ${insertedDoc}`);
        }
      );
    } else {
      client.bot.logger.debug(`config entry found for guild ${message.guild.name}, ${message.guild.id}: ${doc._id}`);
      doc["welcome-channel"] = message.channel.id;
      doc["last-update"] = Date.now();
      db.update({ _id: doc._id }, doc, {}, (err: any, numAffected: any, affectedDocs: any, upsert: any) => {
        console.log(err, numAffected, affectedDocs, upsert);
      });
      db.persistence.compactDatafile();
    }
    message.channel.send(`${message.member} the channel for the welcome message is now: ${(message.channel as Discord.TextChannel).name}`);
  });
}

function unsetWelcomeChannel(db: Nedb, message: Discord.Message, client: Client): void {
  db.findOne({ "guild-id": message.guild.id }, (err, doc) => {
    if (err) {
      client.bot.logger.error("error finding guild config", err);
      return;
    }
    if (!doc) {
      return;
    }
    doc["welcome-channel"] = undefined;
    db.update({ _id: doc._id }, doc);
    db.persistence.compactDatafile();
  });
}

exports.run = (client: Client, message: Discord.Message, args: string[]): void => {
  if (message.content.indexOf(client.bot.config.prefix + "admin") < 0) {
    console.info(`skipping admin command: ${message.content}`);
    return;
  }
  if (!message.isMentioned(client.users.filter(user => user.id === client.user.id).first())) {
    return;
  }
  const db = client.bot.config.db;
  if (!db) {
    return;
  }

  if (!message.member) {
    client.bot.logger.warning(`Message author ${message.author.username} is not a member of the server (anymore)`);
    return;
  }

  const allowedRoles = [];
  allowedRoles.push(message.guild.roles.find(role => role.name.toLowerCase() === "admin"));
  allowedRoles.push(message.guild.roles.find(role => role.name === "IP3X Admiralty"));

  let hasAdminRole = false;

  allowedRoles.forEach(role => {
    if (role && message.member.roles.get(role.id)) {
      hasAdminRole = true;
    }
  });

  if (!hasAdminRole) {
    message.channel.send(`${message.member} you are not allowed to perform administrative actions.`);
    return;
  }

  if (args.find(arg => arg === "set-welcome-channel")) {
    setWelcomeChannel(db, message, client);
  } else if (args.find(arg => arg === "unset-welcome-channel")) {
    unsetWelcomeChannel(db, message, client);
  }
};

exports.help = (): HelpField => {
  return {
    name: "admin",
    value: `__**!admin set-welcome-channel**__
 - Sets the channel in which this command is executed as the one, where the welcome message is displayed.
 - Every execution of overwrites previous settings.
 - Value is saved per server.

__**!admin unset-welcome-channel**__
 - Deletes the settings for the welcome channel. If not set again, the welcome message will not be used on this server.
 - Value is saved per server.
 `
  };
};
