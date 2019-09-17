const zlib = require('zlib');
const zmq = require('zeromq');
const sock = zmq.socket('sub');
const Datastore = require('nedb');
const fs = require('fs');

//sock.connect('tcp:/ / eddn.edcd.io: 9500 ');
console.log('Worker connected to port 9500');

const getLastUpdateOfFile = (path) => {
    let stats = fs.statSync(path);
    return stats.mtime.getTime();
};

let db = {};

const parseCommoditiesData = () => {
    let data = require('./data/commodities.json');
    data.forEach(element => {
        let newDoc = {
            '_id': element.id,
            'name:': element.name,
            'category_id': element.category.id,
            'ed_id': element.ed_id
        };
        db.commodities.insert(newDoc);
        let category = element.category;

        db.categories.findOne({
                '_id': category.id
            },
            (err, doc) => {
                if (err) {
                    console.err(err);
                }
                if (doc === null) {
                    category._id = category.id;
                    delete category.id;
                    db.categories.insert(category);
                }
            });
    });
};

const parseStationData = () => {
    let data = require('./data/stations.json');
    data.array.forEach(element => {
        let newDoc = {
            "_id": element.id
        };
    });
};

const parseSystemData = () => {
    let data = require('./data/systems_populated.json');
    data.array.forEach(element => {
        let newDoc = {
            "_id": element.id,
            "name": element.name,
            "updated": element.updated_at
        };
        db.systems.insert(newDoc);
    });
};

db.commodities = new Datastore({
    filename: 'datastore/commodities.store',
    autoload: true
});
db.categories = new Datastore({
    filename: 'datastore/categories.store',
    autoload: true
});
db.stations = new Datastore({
    filename: 'datastore/stations.store',
    autoload: true
});
db.systems = new Datastore({
    filename: 'datastore/systems.store',
    autoload: true
});
db.prices = new Datastore({
    filename: 'datastore/prices.store',
    autoload: true
});

db.commodities.findOne({
    '_id': 'lastupdate'
}, (err, doc) => {
    if (err) {
        console.log(err);
        return;
    }
    if (doc === null) {

        let newDoc = {
            '_id': 'lastupdate',
            'value': getLastUpdateOfFile('datastore/stations.store')
        };
        db.commodities.insert(newDoc);
        parseCommoditiesData();
    }
});

db.systems.findOne({
    '_id': 'lastupdate'
}, (err, doc) => {
    if (err) {
        console.err(err);
        return;
    }
    if (doc === null) {
        console.info("creating new system store");
        let newDoc = {
            '_id': 'lastupdate',
            'value': getLastUpdateOfFile('./data/systems_populated.json')
        };
        db.stations.insert(newDoc);
        parseSystemData();
        console.info("system store created...");
    }
});

process.exit();

db.stations.findOne({
    '_id': 'lastupdate'
}, (err, doc) => {
    if (err) {
        console.err(err);
        return;
    }
    if (doc === null) {
        console.info("creating new station store");
        let newDoc = {
            '_id': 'lastupdate',
            'value': getLastUpdateOfFile('data/stations.store')
        };
        db.stations.insert(newDoc);
        parseStationData();
        console.info("station store created...");
    }
});



/*sock.subscribe('');
sock.on('message', topic => {
    let entry = JSON.parse(zlib.inflateSync(topic));
    console.log(entry['$schemaRef']);
    if (entry['$schemaRef'] == 'https://eddn.edcd.io/schemas/journal/1') {
        console.log(entry.message.StarSystem, entry['message']['StarPos'], entry.message.SystemAddress);
    }

    ///*if (msg['$schemaRef'] == 'https://eddn.edcd.io/schemas/commodity/3') {
    //    console.log(msg['message']['stationName']);
    //    console.log(msg['message']['commodities'][0])
    //}
});*/