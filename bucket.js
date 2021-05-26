const MongoBucket = require('mongodb').GridFSBucket;
const fs = require('fs');

function Bucket (DB, name) {
    this.db = DB.db;
    var me = this;
    DB.ready.then(e => {

        this._bucket = new MongoBucket(this.db, {bucketName: name});
        console.warn("buck", me._bucket);
    })


    //search in
    this.find = (async function (filter) {
        let response = await me._bucket.find(filter || {}).toArray();
        return response;
    });

    //find one
    this.findById = (async function (id) {
        let response = await me._bucket.find({_id: new ObjectId(id)}); 
        if(response.length < 1) return null;
        return response.pop();
    });

    //find one by Name
    this.findByName = (async function (id) {
        let response = await me._bucket.find({name: id});
        if(response.length < 1) return null;
        return response.pop();
    });

    //upload one
    this.uploadOne =  (async function (filename, buffer) {
        if(!filename) throw new Error("Missing File name");

        let uploadStream;
        try {
            //console.warn('buffer', buffer.toString('utf8').substr(0,100));
            uploadStream = await me._bucket.openUploadStream(filename);
            uploadStream.end(buffer);

        } catch(e) {
            console.warn('error on upload', e.message);
        }
        
        let _p = new Promise((resolve, reject) => {
            uploadStream.on('finish', (f) => {
                resolve(f);
            });
            uploadStream.on("error",reject);
        });
        return _p;
    });

    //download one
    this.downloadOne =  (async function (filename) {
        if(!filename) throw new Error("Missing File name");
        let dlStream;
        let res = {};
       
        let _p = new Promise(async (resolve, reject) => {
            
            let bufs = [];
            try {
                dlStream = await me._bucket.openDownloadStreamByName(filename);
                dlStream.on('data', chunk => bufs.push(chunk));
            } catch(e) {
                console.warn('error on dl');
            }
            dlStream.on('file', (file) => {
                res.metadata = file;
            });
            //
            dlStream.on('end', () => {
                res.data = Buffer.concat(bufs);
                resolve(res);
            });
            dlStream.on("error",reject);
        });
        return _p;
    });

    //download one revision
    this.downloadOneRevision =  (async function (id) {
        if(!id) throw new Error("Missing File id");

        let dlStream;
        let res = {};
       
        let _p = new Promise(async (resolve, reject) => {
            
            let bufs = [];
            try {
                dlStream = await me._bucket.openDownloadStream(id);
                dlStream.on('data', chunk => bufs.push(chunk));
            } catch(e) {
                console.warn('error on dl');
            }
            dlStream.on('file', (file) => {
                res.metadata = file;
            });
            //
            dlStream.on('end', () => {
                res.data = Buffer.concat(bufs);
                resolve(res);
            });
            dlStream.on("error",reject);
        });
        return _p;
    });

    
    //delete One file
    this.delete = async function (filename) {
        let response = await me.find({name: filename});
        try {
            for(let i of response) {
                await me._bucket.delete(i._id);
            }
        } catch(e) {
            throw e;
        }

        return {success: true};
    };

    //delete One Revision
    this.deleteAll = async function (id) {
        let response =  await me._bucket.delete(new ObjectId(id));
        return response;
    };
}
 module.exports = {
    Bucket
 }