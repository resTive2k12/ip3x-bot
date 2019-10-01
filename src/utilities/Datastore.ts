import Datastore from "nedb";
import { GuildEntry } from "../bot/api/storage";
import { resolve } from "url";
import { rejects } from "assert";

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

    public static fetchGuildData(id: string): Promise<GuildEntry> {
        return new Promise<GuildEntry>(function(resolve, reject): void {
            DB.instance.findOne<GuildEntry>({ _id: id }, (err, document) => {
                if (err) reject(err);
                else resolve(document);
            });
        });
    }

    public static updateGuildData(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            DB.instance.update({ _id: entry._id }, entry, {}, (err, numRows, upsert) => {
                if (err) reject(err);
                else if (numRows < 1) reject(new Error("No data has been updated"));
                else resolve(entry);
            });
        });
    }

    public static insertGuildData(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
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
