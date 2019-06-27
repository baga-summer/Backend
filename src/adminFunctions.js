

const mongoID = require("mongodb").ObjectID;
const dbconfig = require('../config/dbConfig.js');


/**
* getAllProjects gets all the projects for the admin
* @param {object} db database object from dbWrapper
* @param {array} params,no parameters in this case
*/
const getAllProjects = async (db) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all projects
    let projects = await dbo.collection('Projects').find();

    //return projects
    return projects;
};

/**
* getAllObjects gets all the objects for the admin
* @param {object} db database object from dbWrapper
* @param {array} params,no parameters in this case
*/
const getAllObjects = async (db) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all projects
    let projects = await dbo.collection('Objects').find({
        "$or": [
            {"approved": "1"},
            {"approved": {"$exists": false}}
        ]
    });

    //return projects
    return projects;
};

/**
  * Get all Objects that are requesting approvement
  *
  * params {DB} database object
  * returns {JSON} MongoDB response of all requested objects
  */
const getRequestApproveObjects = async (db) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all objects, this is known as a cursor
    let objects = await dbo.collection('Objects').find({"requestApprove": "1"});

    return objects;
};


/**
  * Approve object that are requesting approvement
  *
  * params {DB} database object
  * params {Array} [0] = body, [1] = object id
  * returns {JSON} MongoDB response of all requested objects
  */
const setObjectRequest = async (db, params) => {
    let acceptRequest = params[0];

    if (acceptRequest != "1" && acceptRequest != "0") {
        return {"error": true, "info": "Required parameters not set"};
    }

    let dbo = db.db(dbconfig.connection.database);
    //Update values

    let check = checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}


    let request = {"requestApprove": "0", "approved": acceptRequest};
    //Approve

    if (acceptRequest == "1") {
        request = {"requestApprove": "0", "approved": acceptRequest, "creatorID": []};
    }

    await dbo.collection('Objects').updateOne({"_id": mongoID(params[1])},
        {"$set": request});

    //Get updated object
    let objects = await dbo.collection('Objects').find({"_id": mongoID(params[1])});

    return objects;
};

/**
  * Disable Objects as admin
  *
  * params {DB} database object
  * params {Array} [0] = object id, [1] = disableValue
  * returns {JSON} MongoDB response of all requested objects
  */
const disableObject = async (db, params) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all projects
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    let disableValue = params[1];

    if (disableValue !== "1" && disableValue !== "0") {
        return {"error": true, "info": "Value has to be 1 or 0"};
    }

    await dbo.collection('Objects').updateOne({
        "_id": mongoID(params[0])
    },
    {
        "$set": {
            "isDisabled": disableValue
        }
    }
    );

    let type = await dbo.collection('Objects').find({"_id": mongoID(params[0])});

    //return projects
    return type;
};

/**
  * Delete Objects as admin
  *
  * params {DB} database object
  * params {Array} [0] = object id
  * returns {JSON} MongoDB response of all requested objects
  */
const deleteObject = async (db, params) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all projects
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    await dbo.collection('Objects').deleteOne({"_id": mongoID(params[0])});

    //return projects
    return {"error": false, "info": "Object deleted"};
};

const checkInvalidID = (db, id) => {
    if (!mongoID.isValid(id)) {
        return {"error": true, "info": "Invalid Id"};
    }
    return undefined;
};

module.exports = {
    getAllProjects,
    getAllObjects,
    getRequestApproveObjects,
    setObjectRequest,
    disableObject,
    deleteObject
};
