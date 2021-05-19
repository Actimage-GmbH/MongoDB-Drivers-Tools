const MongoBucket = require('mongodb').GridFSBucket;


function Bucket (DB, name) {
    this.db = DB.db;
    me = this;
    this._bucket = new MongoBucket(this.db, {bucketName: name});

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
    this.uploadOne =  (async function (filename, fileStream) {
        if(!filename) throw new Error("Missing File name");

        let uploadStream = await me._bucket.openUploadStream(filename);
        fileStream.pipe(uploadStream);
        let _p = new Promise((reject, resolve) => {
            uploadStream.on('finish', (f) => {
                resolve(f, uploadStream);
            });
            uploadStream.on("error",reject);
        });
        return _p;
    });

    //download one
    this.downloadOne =  (async function (filename, fileStream) {
        if(!filename) throw new Error("Missing File name");

        let dlStream = await me._bucket.openDownloadStreamByName(filename);
        dlStream.pipe(fileStream);
        let _p = new Promise((reject, resolve) => {
            dlStream.on('file', (f) => {
                resolve(f, dlStream);
            });
            dlStream.on("error",reject);
        });
        return _p;
    });

    //download one revision
    this.downloadOneRevision =  (async function (id, fileStream) {
        if(!filename) throw new Error("Missing File name");

        let dlStream = await me._bucket.openDownloadStream(id);
        dlStream.pipe(fileStream);
        let _p = new Promise((reject, resolve) => {
            dlStream.on('file', (f) => {
                resolve(f, dlStream);
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