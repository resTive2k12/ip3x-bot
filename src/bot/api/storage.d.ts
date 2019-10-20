/** Dataset for persistant data around each discord server (called guild). */
export interface GuildEntry {
  /** ID of the discord server (called guild) this configuration is associated to. in the same time it is the unique ID of the entire dataset. */
  _id: string;
  /** ID of the channel the !welcome message is displayed. */
  welcomeChannelId?: string;
  /** Missiondata. */
  mission?: MissionEntry;

  /** List of discord role ids  which are allowed to perform administrative actions (mostly configuration)
   * @see {Discord.Role#id} */
  adminRoles?: AdminRoles[];
  notificationChannels?: NotificationChannels[];

  /** List of known users in that guild (Discord.GuildMember) */
  users?: User[];

  /** Time if the las update of this dataset. */
  lastUpdate: number;
}

export interface AdminRoles {
  type: string;
  id: string;
}

export interface NotificationChannels {
  id: string;
}

/** A single mission objective. */
export interface ObjectiveEntry {
  /** Title of the mission */
  title: string;
  /** Descirption of the mission */
  description: string;
}

/** A collection of mission objectives. */
export interface MissionEntry {
  /** Title for this mission. */
  title: string;
  /** Longer (In depth) description. */
  description: string;
  /** Ordered list of objectives. Semantically, the first entry is the "primary" objective. */
  objectives: ObjectiveEntry[];
  /** Timestamp of last sync. */
  lastSync: number;
}

export interface User {
  id: string;
  name: string;

  joinedAt: Date;
  leftAt?: Date;
  isBot: boolean;
  lastSeen?: Date;

  application?: {
    startAt: Date;
    applicationStep: number;
    finishedAt?: Date;
    canceledAt?: Date;
    dmChannelId: string;
    msgId: string;
  };
}
