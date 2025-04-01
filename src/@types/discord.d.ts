import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    // eslint-disable-next-line
    commands: Collection<any, any>;
  }
}
