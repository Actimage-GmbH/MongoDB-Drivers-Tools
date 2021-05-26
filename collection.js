const ObjectId = require('mongodb').ObjectId;



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
    this.insertOne =  (async function (obj) {
        let response = await me.db.collection(name).insertOne(obj || {});
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

 module.exports = {
    Collection
 }