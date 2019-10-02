import Datastore from "nedb";
import { GuildEntry } from "../bot/api/storage";

export class DB {
    private static instance: Datastore;

    /**
     * Initializes the NoSql-Database.
     * @param fileName The location of the datastore file
     * @param autoLoad True if the datastore should be loaded immediatly
     */
    public static initialize(fileName: string, autoLoad = true): void {
        DB.instance = new Datastore({
            filename: fileName,
            autoload: autoLoad
        });
    }

    public static fetch(id: string): Promise<GuildEntry> {
        return new Promise<GuildEntry>(function(resolve, reject): void {
            if (!DB.instance) reject("Database instance not loaded...");
            DB.instance.findOne<GuildEntry>({ _id: id }, (err, document) => {
                if (err) reject(err);
                else resolve(document);
            });
        });
    }

    public static updateOrInsert(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!DB.instance) reject("Database instance not loaded...");
            DB.instance.update({ _id: entry._id }, entry, { upsert: true }, (err, numRows, upsert) => {
                if (err) reject(err);
                else if (numRows < 1) reject(new Error("No data has been updated"));
                else resolve(entry);
            });
        });
    }

    public static update(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!DB.instance) reject("Database instance not loaded...");
            DB.instance.update({ _id: entry._id }, entry, {}, (err, numRows) => {
                if (err) reject(err);
                else if (numRows < 1) reject(new Error("No data has been updated"));
                else resolve(entry);
            });
        });
    }

    public static insert(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!DB.instance) reject("Database instance not loaded...");
            DB.instance.insert(entry, (err, newdoc) => {
                if (err) reject(err);
                else resolve(newdoc);
            });
        });
    }

    public static compact(): void {
        DB.instance.persistence.compactDatafile();
    }
}
