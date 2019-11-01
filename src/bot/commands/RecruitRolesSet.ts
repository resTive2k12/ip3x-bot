import { Client } from '../api/client';
import * as Discord from 'discord.js';
import { HelpField } from '../..';
import { AbstractCommand } from './AbstractCommand';
import { DiscordEvents } from '../core/DiscordEvents';
import { Role } from '../api/storage';

export class SetRecruitRole extends AbstractCommand {
  public command = 'set-recruit-roles';
  public aliases: string[] = [];
  public requiresBotMention = true;
  public requiresAdminAccess = true;
  public botAllowed = false;

  constructor(client: Client) {
    super(client);
    this.listeners.push(DiscordEvents.MESSAGE);
  }

  async onMessage(message: Discord.Message): Promise<void> {
    const matches = await this.matches(message);
    if (!matches) {
      return;
    }

    let parsed = this.parseMessageIntoParameters(message);
    parsed = parsed.slice(2);
    const entry = await this.db.fetch(message.guild.id);
    const roles: Role[] = entry.recruitRoles || [];
    parsed.forEach(async item => {
      const mentions = item.match(/^<((@(?:&?|!?))(\d+))>$/);
      if (mentions) {
        if (roles.find(role => role.id === mentions[3])) {
          console.debug(`${this.constructor.name}#onMessage entry for id ${mentions[3]} already exists.`);
          return;
        }
        if (mentions[2] === '@&') {
          roles.push({ type: 'role', id: mentions[3] });
        } else {
          console.debug(`${this.constructor.name}#onMessage ignoring mention ${mentions[0]}. It is not a role.`);
        }
      }
    });
    entry.recruitRoles = roles;
    this.db
      .update(entry)
      .then(() => {
        message.channel.send('Successfully added.').catch(console.log);
      })
      .catch(rejected => {
        message.channel.send('Failed to add recruit role(s). Check protocol.').catch(console.log);
        console.error('Error saving adding admin access: ', rejected);
      });
  }

  help(): HelpField[] {
    return [
      {
        name: 'set-recruit-roles',
        value:
          'The mentions of groups a successful applicant gets assigned. Mentions of user and channels will be silently ignored.\n\n**Usage**: ```@IP3X-Assistant set-recruit-role [@role...]```'
      }
    ];
  }
}
