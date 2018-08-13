const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const assert = require('assert');

function Collection (DB, name) {
    this.db = DB.db;
    me = this;

    //search in
    this.find = (async function (filter) {
            let response = {err: null, result: []};
            try {
                response.result = await me.db.collection(name).find(filter || {}).toArray();


            } catch(e) {
                response.err = e;
            }
            return response;
        });
    //find one
    this.findById = (async function (id) {
        let response = await me.db.collection(name).findOne({_id: new ObjectId(id)});
        return response;
    });
    //insert one
    this.insertOne =  (async function (user) {
        let response = await me.db.collection(name).insertOne(user || {});
        return response;
    });
    //update
    this.update = async function (filter, obj) {
        if(obj._id) delete obj._id;
        let resp = await me.db.collection(name).update(filter || {}, obj, {multiple: true});
        return resp;
    };
    //updateOne
    this.updateById = async function (id, obj) {
        if(obj._id) delete obj._id;
        let resp = await me.db.collection(name).update({_id: new ObjectId(id)}, obj, {multiple: false});
        return resp;
    };
}

function DataBase (cfg) {
    this.db = {};
    var me = this;
    ensureConnection(cfg, this);

    this.ready = new Promise((resolve, reject) => {
        me.defered = {
            resolve: resolve,
            reject: reject
        };
    });

    this.ready.then(() => {
        me.gateways = new Collection(me, 'gateways');
    });

    this.registerCollection = name => {
        me.ready.then(() => {
            me[name] = new Collection(me, name);
        });
    };

    this.__driver = require('mongodb');
    this.errorType = require('mongodb').MongoError;


    this.close;

};

const __db = (cfg) => new DataBase(cfg);

const DBConnections = {};

const ensureConnection = (cfg, __db) => {

    if(!DBConnections[cfg.url]) {
        //Create database connection
        (async function() {
            // Connection URL
            const url = cfg.url;
            // Database Name
            const dbName = cfg.name;
            let client;

            var options = {
                server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }

            };

            try {
                // Use connect method to connect to the Server
                client = await MongoClient.connect(url, options);

                __db.db = client.db(dbName);
                __db.defered.resolve();
            } catch (err) {
                console.log("MongoRoot", err.stack);
            }

            if (client) {
                //client.close();
                __db.client = client;
            }

            DBConnections[cfg.url] = {
                client: client,
                base: {}
            };
            DBConnections[cfg.url].base[cfg.name]= __db;
            return DBConnections[cfg.url];
        })();



    } else if(!DBConnections[cfg.url].base[name]){
        let c = DBConnections[cfg.url];
        __db.db = c.client.db(cfg.name);
        __db.defered.resolve();
        __db.client = c.client;

        c.base[cfg.name]= __db;

    } else {
        __db = DBConnections[cfg.url].base[cfg.name];
        __db.defered.resolve();
        return DBConnections[cfg.url];
    }

};
/*
//Create database connection
(async function() {
    // Connection URL
    const url = cfg.database.url;
    // Database Name
    const dbName = cfg.database.name;
    let client;

    var options = {
        server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }

    };

    try {
        // Use connect method to connect to the Server
        client = await MongoClient.connect(url, options);

        __db.db = client.db(dbName);
        __db.defered.resolve();
    } catch (err) {
        console.log("MongoRoot", err.stack);
    }

    if (client) {
        //client.close();
        __db.client = client;
    }
})();

*/

module.exports = __db;