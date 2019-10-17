import { Controller } from "../api/controller";
import { DiscordEvent } from "../api/command";
import { Client } from "../api/client";

export abstract class AbstractController implements Controller {

  protected client: Client;

  protected listeners: DiscordEvent[] = [];

  constructor(client: Client) {
    this.client = client;
  }

  initializeListeners(): void {
    if (!this.listeners || this.listeners.length === 0) {
      return;
    }
    const listeningTo: string[] = [];
    const missing: string[] = [];
    this.listeners.forEach(event => {
      const fn = (this as any)[event.callback];
      if (!fn) {
        missing.push(event.callback);
        return;
      }
      listeningTo.push(event.callback);
      this.client.on(event.eventName, (this as any)[event.callback].bind(this));
    });

    if (missing.length > 0) console.debug(`${this.constructor.name} has no implementation for ${missing}.`);
    console.log(`${this.constructor.name} is listening to ${listeningTo.length > 0 ? listeningTo : 'nothing'}.`);
  }
}