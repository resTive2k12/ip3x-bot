/**
 * Dataset for persistant data around each discord server (called guild).
 */
export interface GuildEntry {
    /**
     * ID of the discord server (called guild) this configuration is associated to. in the same time it is the unique ID of the entire dataset.
     */
    _id: string;
    /**
     * ID of the channel the !welcome message is displayed.
     */
    welcomeChannelId?: string;

    /** Missiondata. */
    mission?: MissionEntry;

    /**
     * Time if the las update of this dataset.
     */
    lastUpdate: number;
}

export interface ObjectiveEntry {
    title: string;
    description: string;
}

export interface MissionEntry {
    objectives: ObjectiveEntry[];
    lastSync: number;
}
