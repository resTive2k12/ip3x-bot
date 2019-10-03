import { GuildEntry } from "../bot/api/storage";

export declare class DB {
    /**
     * Initializes the NoSql-Database.
     * @param fileName The location of the datastore file
     * @param autoLoad True if the datastore should be loaded immediatly
     */
    public fetch(id: string): Promise<GuildEntry>;

    public updateOrInsert(entry: GuildEntry): Promise<GuildEntry>;

    public update(entry: GuildEntry): Promise<GuildEntry>;

    public insert(entry: GuildEntry): Promise<GuildEntry>;

    public compact(): void;
}
