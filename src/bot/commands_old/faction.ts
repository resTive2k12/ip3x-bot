import * as Discord from "discord.js";
import { RichEmbed } from "discord.js";
import request from "request";
import { HelpField, Client } from "../..";


exports.run = (client: Client, message: Discord.Message, args: string[]): void => {
  if (message.content.indexOf(client.bot.config.prefix + "faction") < 0) {
    console.info(`skipping faction command: ${message.content}`);
    return;
  }

  console.log("1", args.shift());
  let type = "";

  if (args[1] && args[1].toLowerCase() === 'status') {
    type = "status";
    console.log("2", args.shift());
  } else {
    type = "status";
  }

  if (args.length === 0) {
    message.channel.send(`${message.member} Insufficient arguments see "**!help**"`);
    return;
  }



  //const systemname = args[0];
  let url = "https://elitebgs.app/api/ebgs/v4/factions?name=IP3X Corporation";

  const daysOfHistory = args[0] || undefined;
  if (daysOfHistory) {
    const date = new Date();
    date.setDate(date.getDate() - Number(daysOfHistory));
    url += "&timemin=" + date.getTime() + "&timemax=" + Date.now();
  }
  console.log(url);

  request(url, { json: true }, (err, response, body) => {
    if (err) { return console.log(err); }
    if (body.total === 0) {
      message.channel.send(`${message.member} Could not find any information for system "${args[0]}"...`);
    }
    console.log(body.docs[0]);
  });
};

exports.help = (): HelpField => {
  return { name: "faction", value: "!faction [status] <Systemname> <Days of history" };
};
