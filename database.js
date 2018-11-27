const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const assert = require('assert');

function Collection (DB, name, indexes) {
    this.db = DB.db;
    me = this;

    if(indexes && Array.isArray(indexes)) {
        for (var ind = 0; ind < indexes.length; ind++) {

            me.db.collection(name).dropIndex(indexes[ind]+"_1", {unique: true}).catch(e => {
            });

            me.db.collection(name).createIndex(indexes[ind], {unique: true});
        }
    }

    //search in
    this.find = (async function (filter) {
        let response = await me.db.collection(name).find(filter || {}).toArray();
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
        return response.ops.pop();
    });
    //update
    this.update = async function (filter, obj, isRaw) {
        let query;
        if(!isRaw) {
            if(obj._id) delete obj._id;
            query = {$set: obj}
        } else {
            query = obj;
        }
        let resp = await me.db.collection(name).update(filter || {}, query, {multiple: true});
        if(resp.result.nModified < 1) return [];
        return await me.db.collection(name).find(filter || {}).toArray();
    };
    //updateOne
    this.updateById = async function (id, obj, isRaw) {
        let query;
        if(!isRaw) {
            if(obj._id) delete obj._id;
            query = {$set: obj}
        } else {
            query = obj;
        }

        let resp = await me.db.collection(name).update({_id: new ObjectId(id)}, query, {multiple: false});
        if(resp.result.n < 1) return null;
        return await me.db.collection(name).findOne({_id: new ObjectId(id)});
    };

    //deleteById
    this.deleteById = async function (id) {
        let response = await me.db.collection(name).deleteOne({_id: new ObjectId(id)});
        if(response.result.nRemoved < 1) return null;
        return response.result;
    };

    //deleteALl
    this.deleteAll = async function (filter) {
        let response = await me.db.collection(name).deleteMany(filter);

        return response;
    };
}

function DataBase (cfg) {
    this.db = {};
    var me = this;


    //set up promise for database ready
    this.ready = new Promise((resolve, reject) => {
        me.defered = {
            resolve: resolve,
            reject: reject
        };
    });
    this.renewReadyPromise = () => {
        this.ready = new Promise((resolve, reject) => {
            me.defered = {
                resolve: resolve,
                reject: reject
            };
        });
    };

    this.registeredCollections = [];
    this.initializedCollections = [];

    function pushInCollection(col) {
        if(!me.initializedCollections) me.initializedCollections = [];
        me.initializedCollections.push(col);
        if(me.initializedCollections.length == me.registeredCollections.length) {
            me.colDefered.resolve();
        }
    }
    me.collectionsReady = new Promise((resolve, reject) => {
        me.colDefered = {
            resolve: resolve,
            reject: reject
        };
    });


    //set up collection request helper for given collection name
    this.registerCollection = (name, indexes) => {
        this.registeredCollections.push(name);
        me.ready.then(() => {
            me[name] = new Collection(me, name, indexes);
            pushInCollection(me[name]);
        });
    };



    //set ref to MongoError Class
    this.__driver = require('mongodb');
    this.errorClass = require('mongodb').MongoError;
    this.errorName = "MongoError";

    //set some const for specific errors handling
    this.errorClass.DATABASE_ERR_CODES = {
        DUPLICATE_ENTRY: 11000
    };
    this.errorClass.ERRORS_NAME = "MongoError";


    this.close;


    //connect to mongo or get opened connection if any
    ensureConnection(cfg, this);

};

const __db = (cfg) => new DataBase(cfg);

const DBConnections = {};

const ensureConnection = (cfg, __db) => {
    //check if there isn't a connection with to this database already opened
    if(!DBConnections[cfg.url]) {
        //Create database connection
        (async function() {
            // Connection URL
            const url = cfg.url;
            // Database Name
            const dbName = cfg.name;
            let client;

            var options = {
                socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }
            };

            try {
                // Use connect method to connect to the Server
                client = await MongoClient.connect(url, options);
                //save connection to database object and resolve database ready promise
                __db.db = client.db(dbName);
                console.log("prom2",__db.defered, __db.ready);
                __db.defered.resolve();
            } catch (err) {
                console.log("MongoRoot", err.stack);
            }

            if (client) {
                //client.close();
                __db.client = client;
            }

            //save current connection in memory
            DBConnections[cfg.url] = {
                client: client,
                base: {}
            };
            DBConnections[cfg.url].base[cfg.name]= __db;

            //return connection
            return DBConnections[cfg.url];
        })();



    } else if(!DBConnections[cfg.url].base[cfg.name]){
        //if connection already existe but for another database
        //set up database connection and save it to the current mongo connection
        let c = DBConnections[cfg.url];
        __db.db = c.client.db(cfg.name);
        console.log("prom1",__db.defered, __db.ready);
        //resolve database ready promise
        __db.defered.resolve();
        __db.client = c.client;

        c.base[cfg.name]= __db;

    } else {
        let prom = __db.ready;
        let defer = __db.defered;

        console.log('def',prom,defer,__db);

        //return alredy existing connection
        __db.db = DBConnections[cfg.url].base[cfg.name].db;
        __db.client = DBConnections[cfg.url].base[cfg.name].client;

        console.log('def2',__db.ready, __db);

        //resolve database ready promise
        __db.ready = prom;
        __db.defered = defer;
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