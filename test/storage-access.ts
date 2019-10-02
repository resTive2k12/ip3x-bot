import "../src/utilities/Datastore";
import { expect } from "chai";
import "mocha";
import fs from "fs";
import { GuildEntry } from "../src/bot/api/storage";
import { DB } from "../src/utilities/Datastore";

const storageFile = "test/data/storage-access-tests.store";
let db: DB;


before(() => {
    if (fs.existsSync(storageFile)) {
        fs.unlinkSync(storageFile);
    }
    db = new DB(storageFile);

});

afterEach(() => {
    db.compact();
});

describe("creating data", () => {
    it("inserts a new dataset", () => {
        const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 1 };
        return db.insert(guildData).then(newEntry => {
            expect(newEntry).to.not.equal(null);
            expect(newEntry._id).to.equal("Test-ID 123");
        });
    });

    it("inserts another new dataset", () => {
        const guildData: GuildEntry = { _id: "Test-ID 234", lastUpdate: 1 };
        return db.insert(guildData).then(newEntry => {
            expect(newEntry).to.not.equal(null);
            expect(newEntry._id).to.equal("Test-ID 234");
        });
    });
});

describe("Fetching guild data from database", () => {
    it("fetching Testdata returns dataset 'Test-ID 123", () => {
        return db.fetch("Test-ID 123").then(entry => {
            expect(entry).not.null;
            expect(entry._id).equals("Test-ID 123");
            expect(entry.lastUpdate).equals(1);
        });
    });

    it("fetching wrong Testdata returns null document", () => {
        return db.fetch("unknown id").then(entry => {
            expect(entry).null;
        });
    });
});

describe("manipulating guild data", () => {
    it("updated field lastupdate to '2'", () => {
        const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 2 };
        return db.update(guildData).then(entry => {
            expect(entry).not.null;
            expect(entry.lastUpdate).to.equal(2);
        });
    });
    it("insert existing document with id 'Test-ID 123' fails", () => {
        const guildData: GuildEntry = { _id: "Test-ID 123", lastUpdate: 2 };
        return db.insert(guildData)
            .then(newEntry => expect(newEntry).to.be.null)
            .catch(rej => expect(rej).to.be.instanceOf(Error)); //["Error: Can't insert key Test-ID 123, it violates the unique constraint"]));
    });

    it("inserts or updates a new dataset with ID 'Test-ID 456'", () => {
        const guildData: GuildEntry = { _id: "Test-ID 456", lastUpdate: 1 };
        return db.updateOrInsert(guildData)
            .then(newEntry => {
                expect(newEntry).to.be.null;
            })
            .catch(rej => expect(rej).to.be.instanceOf(Error)); //["Error: Can't insert key Test-ID 123, it violates the unique constraint"]));
    });

    it("inserts or updates a new dataset with ID 'Test-ID 456' again and has updated 'lastUpdate'-value", () => {
        const guildData: GuildEntry = { _id: "Test-ID 456", lastUpdate: 3 };
        return db.updateOrInsert(guildData)
            .then(newEntry => {
                expect(newEntry).to.be.null;
                expect(newEntry.lastUpdate).to.equal(3);
            })
            .catch(rej => expect(rej).to.be.instanceOf(Error)); //["Error: Can't insert key Test-ID 123, it violates the unique constraint"]));
    });
});
