import "../src/utilities/Datastore";
import { expect } from "chai";
import "mocha";
import fs from "fs";
import { DB } from "../src/utilities/Datastore";
import { GuildEntry } from "../src/bot/api/storage";
import { throws } from "assert";

const storageFile = "test/data/storage-access-tests.store";

beforeEach(() => {
    const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 1 };
    fs.writeFileSync(storageFile, JSON.stringify(guildData), { flag: "w+" });
    DB.initialize(storageFile);
});

afterEach(() => {
    DB.compact();
});

describe("Fetching guild data from database", () => {
    it("fetching Testdata", () => {
        return DB.fetchGuildData("Test-ID 123").then(entry => {
            expect(entry).not.null;
            expect(entry._id).equals("Test-ID 123");
            expect(entry.lastUpdate).equals(1);
        });
    });

    it("fetching wrong Testdata", () => {
        return DB.fetchGuildData("unknown id").then(entry => {
            expect(entry).null;
        });
    });
});

describe("manipulating guild data", () => {
    it("updated field lastupdate", () => {
        const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 2 };
        return DB.updateGuildData(guildData).then(entry => {
            expect(entry).not.null;
        });
    });
    it("insert existing document fails", () => {
        const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 2 };
        return DB.insertGuildData(guildData)
            .then(newEntry => {})
            .catch(rej => expect(rej).to.equal(["Error: Can't insert key Test-ID 123, it violates the unique constraint"]));
    });
});
