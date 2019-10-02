import Datastore from "nedb";
import { GuildEntry } from "../bot/api/storage";

export class DB {
    private store: Datastore;

    constructor(fileName: string, autoLoad = true) {
        this.store = new Datastore({
            filename: fileName,
            autoload: autoLoad
        });
    }

    /**
     * Initializes the NoSql-Database.
     * @param fileName The location of the datastore file
     * @param autoLoad True if the datastore should be loaded immediatly
     */


    public fetch(id: string): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!this.store) reject("Database instance not loaded...");
            this.store.findOne<GuildEntry>({ _id: id }, (err, document) => {
                if (err) reject(err);
                else resolve(document);
            });
        });
    }

    public updateOrInsert(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!this.store) reject("Database instance not loaded...");
            this.store.update({ _id: entry._id }, entry, { upsert: true }, (err, numRows) => {
                if (err) reject(err);
                else if (numRows < 1) reject(new Error("No data has been updated"));
                else resolve(entry);
            });
        });
    }

    public update(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!this.store) reject("Database instance not loaded...");
            this.store.update({ _id: entry._id }, entry, {}, (err, numRows) => {
                if (err) reject(err);
                else if (numRows < 1) reject(new Error("No data has been updated"));
                else resolve(entry);
            });
        });
    }

    public insert(entry: GuildEntry): Promise<GuildEntry> {
        return new Promise<GuildEntry>((resolve, reject): void => {
            if (!this.store) reject("Database instance not loaded...");
            this.store.insert(entry, (err, newdoc) => {
                if (err) reject(err);
                else resolve(newdoc);
            });
        });
    }

    public compact(): void {
        this.store.persistence.compactDatafile();
    }
}
