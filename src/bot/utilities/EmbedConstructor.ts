import * as Discord from "discord.js";
import { RichEmbed } from "discord.js";

export class EmbedConstrutor {
  createWelcomeEmbed(mention: Discord.GuildMember | string): RichEmbed {
    // We can create embeds using the MessageEmbed constructor
    // Read more about all that you can do with the constructor
    // over at https://discord.js.org/#/docs/main/stable/class/RichEmbed
    const embed = new RichEmbed()
      // Set the title of the field
      .setTitle("Welcome to the ED Squadron *INTERPLANETARY 3XPEDITIONS*")
      .attachFiles(["./images/logo-90-90.png"])
      .setThumbnail("attachment://logo-90-90.png")
      // Set the color of the embed
      .setColor(0xff0000)
      // Set the main content of the embed
      .setDescription(
        `Greetings ${
          mention ? mention : "Commander"
        }, be welcomed to our discord channel!\nThis is an automated message. Please consider following the steps if not done already.`
      )
      .addField(
        "1️⃣: JOIN OUR IN-GAME SQUADRON:",
        `- Tag: IP3X (PC)
- In-game, the right panel contains Squadrons, search for IP3X and apply.
`
      )
      .addField(
        "2️⃣: JOIN OUR DISCORD:",
        `- Link: https://discord.gg/FT5dKKH
- Please announce your presence in chat and be patient for an officer to respond, depending on the time of day.
- The Elite channel for IP3X is private, an officer will need to grant you access.`
      )
      .addField(
        "3️⃣: JOIN OUR PRIVATE GROUP:",
        `- PC: Search for the Group "Evil Tactician", and/or ask an officer on Discord.`
      )
      .addField(
        "4️⃣: JOIN US ON INARA",
        `- Link: https://inara.cz/squadron/6172/`
      )
      .setTimestamp(new Date());

    return embed;
  }
}
