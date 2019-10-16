import * as Discord from "discord.js";
import { Client } from "../src/bot/api/client";

function handledApplicationResponse(client: Client, reaction: Discord.MessageReaction, user: Discord.User): boolean {

  function handledNegativeResponse(): boolean {
    if (reaction.emoji.name == '❌') {
      reaction.message.reply(`Understood.\nWe're sorry to see you've chosen not to join IP3X at this time.\nIf you wish to resume this process, please run the command **!join** IP3X in #general`);
      reaction.message.delete(10000).then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
      return true;
    }
    return false;
  }

  function handledPositiveResponse(): boolean {

    if (reaction.emoji.name == '✅') {
      reaction.message.reply(
        `Welcome to IP3X, CMDR ${user.username}
We've granted you probationary access to our squadron channel.\n
- Step 1: Please join our Squadron on Inara - https://inara.cz/squadron/6172/. State your Discord name in your application.
- Step 2: Please join our Squadron in-game: Right Panel, Squadrons, search for IP3X. State your discord name in your application.
- Step 3: Please join our private group: Main menu, Social, Groups, <describe this step properly>
           Not mandatory, but you can't wing with anyone if you don't do this.
It only takes a few minutes, so please ensure you follow the steps as soon as you can.

These steps require verification by a senior member of or team. Once you've completed your part of each step, please click ✅5 to proceed. If you changed your mind you can cancel this progress by using ❌`).then(msg => {
          (msg as Discord.Message).react('✅');
          (msg as Discord.Message).react('❌');
        });
    }
    return false;
  }


  if (user.id === client.user.id) {
    //console.log('this is not a reaction to an application message...');
    return false;
  }

  if (handledNegativeResponse()) {
    return true;
  }

  if (handledPositiveResponse()) {
  }



  return false;

}

module.exports = (client: Client, reaction: Discord.MessageReaction, user: Discord.User): void => {
  console.log(`${reaction.emoji} was added from ${user.username} to message ${reaction.message.id} ${reaction.message.cleanContent.substring(0, 10)}` + '...');
  return;
  if (handledApplicationResponse(client, reaction, user)) {
    return;
  }

};
