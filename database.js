const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const assert = require('assert');
const Collection = require('./collection').Collection;
const Bucket = require('./bucket').Bucket;

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
    this.registeredBuckets = [];
    this.initializedBuckets = [];

    function pushInCollection(col) {
        if(!me.initializedCollections) me.initializedCollections = [];
        me.initializedCollections.push(col);
        if(me.initializedCollections.length == me.registeredCollections.length) {
            me.colDefered.resolve();
        }
    }

    function pushInBucket(buk) {
        if(!me.initializedBuckets) me.initializedBuckets = [];
        me.initializedBuckets.push(buk);
        if(me.initializedBuckets.length == me.registeredBuckets.length) {
            me.bukDefered.resolve();
        }
    }
    me.collectionsReady = new Promise((resolve, reject) => {
        me.colDefered = {
            resolve: resolve,
            reject: reject
        };
    });
    me.bucketsReady = new Promise((resolve, reject) => {
        me.bukDefered = {
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

     //set up bucket request helper for given bucket name
     this.registerBucket = (name, indexes) => {
        this.registeredBucket.push(name);
        me.ready.then(() => {
            me[name] = new Bucket(me, name, indexes);
            pushInBucket(me[name]);
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
function MainExporter(cfg) {return new DataBase(cfg);}


 //set ref to MongoError Class
 MainExporter.__driver = require('mongodb');
 let errorClass = MainExporter.__driver.MongoError;
 MainExporter.errorName = "MongoError";


 //set some const for specific errors handling
 errorClass.DATABASE_ERR_CODES = {
     DUPLICATE_ENTRY: 11000
 };
 errorClass.ERRORS_NAME = "MongoError";
 
 MainExporter.errorClass = errorClass;


const DBConnections = {};

const ensureConnection = (cfg, __db) => {
    //check if there isn't a connection to this database already opened
    if(!DBConnections[cfg.url]) {
        //Create database connection
        (async function() {
            // Connection URL
            const url = cfg.url;
            // Database Name
            const dbName = cfg.name;
            let client;

            var options = {
                socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
                tlsAllowInvalidCertificates: true,
                tlsAllowInvalidHostnames: true
            };

            try {
                // Use connect method to connect to the Server
                client = await MongoClient.connect(url, options);
                //save connection to database object and resolve database ready promise
                __db.db = client.db(dbName);
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
        //resolve database ready promise
        __db.defered.resolve();
        __db.client = c.client;

        c.base[cfg.name]= __db;

    } else {
        let prom = __db.ready;
        let defer = __db.defered;


        //return alredy existing connection
        __db.db = DBConnections[cfg.url].base[cfg.name].db;
        __db.client = DBConnections[cfg.url].base[cfg.name].client;


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

module.exports = MainExporter;