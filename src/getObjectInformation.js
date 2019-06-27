/*
 * Database queries to retrive object information
 * This contains the db commands that should be executed
 * from within the db wrapper.
 */

const dbconfig = require('../config/dbConfig.js');
const mongoID = require("mongodb").ObjectID;
const defaultImage = require("./defaultImage.js");


/**
  * Get all objects from the database
  * @param {object} db This is the mongodb database object
  */
const getAllObjects = async (db) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all objects, this is known as a cursor
    let objects = await dbo.collection('Objects').find({});

    //The data here is not the clean data but instead something that is called a cursor.
    //Parsing that will be taken care of in the dbWrapper
    return objects;
};

/**
  * Get global and local objects for a specific project
  *
  * @param {object} db This is the mongodb database object
  * @param {Array} [0] = Project data, [1] = UserID
  * @returns {JSON} Mongodb response
  */
const getAllLocalObjects = async (db, params) => {
    //Select database
    let owner = params[0]['creator']['userID'];
    let names = [];
    let loopNames = params[0]['access'];

    for (let i = 0; i < loopNames.length; i++) {
        names.push(loopNames[i]['userID']);
    }
    names.push(owner);

    let dbo = db.db(dbconfig.connection.database);
    //find all objects, this is known as a cursor
    let objects = await dbo.collection('Objects').find({
        "$or": [
            {"isDisabled": "0", "approved": "0", "creatorID": {"$in": names}},
            {"isDisabled": "0", "approved": "1"},
            {"isDisabled": {"$exists": false},
                "approved": {"$exists": false}}
        ]
    },
    {
        projection: {"isDisabled": 0, "approved": 0, "requestApprove": 0}
    }); //creatorID is array (for <fill>)

    //The data here is not the clean data but instead something that is called a cursor.
    //Parsing that will be taken care of in the dbWrapper
    return objects;
};

/**
* Find all items with matching category
* @param {object} db This is the mongodb database object
* @param {string} type category you want to find
*/
const getObjectsByType = async (db, type) => {
    let dbo = db.db(dbconfig.connection.database);
    let typeData = await dbo.collection('Objects').find({"Kategori": type[0]});

    return typeData;
};

/**
  * Get all objects user created
  *
  * @param {Array} [0] = UserId
  * @returns {JSON} Mongodb response
  */
const getCreatedObjects = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    let types = await dbo.collection('Objects').find({"creatorID": {"$in": [params[0]]}});

    return types;
};

/**
  * Get object by ObjectId
  *
  * @param {Array} [0] = ObjectId
  * @returns {JSON} Mongodb response
  */
const getObjectById = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    let check = await checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    let extraInfo = {};

    if (params[1] === "hidden") {
        extraInfo = {
            projection: {"isDisabled": 0, "approved": 0, "requestApprove": 0}
        };
    }

    let types = await dbo.collection('Objects').find({"_id": mongoID(params[0])},
        extraInfo);

    return types;
};

/**
  * Delete object by id (only for creator of object)
  *
  * @param {Array} [0] = ObjectId, [1] = UserId
  * @returns {JSON} Mongodb response
  */
const deleteObjects = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    //Check for invalid projectId
    let check = await checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    await dbo.collection('Objects').deleteOne({"_id": mongoID(params[0]),
        "creatorID": {"$in": [params[1]]}});

    let types = await dbo.collection('Objects').find({"creatorID": {"$in": [params[1]]}});

    return types;
};

/**
  * Create new object
  *
  * @param {Array} [0] = JSON data of object, [1] = userId
  * @returns {JSON} Mongodb response
  */
const insertObject = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    params[0]["creatorID"] = [params[1]];
    params[0]["isDisabled"] = "0";
    params[0]["approved"] = "0";
    params[0]["requestApprove"] = "0";

    if (params[0]['Bild'] == undefined) {
        params[0]['Bild'] = defaultImage.defaultImage;
    }

    await dbo.collection('Objects').insertOne(params[0]);
    let object = await dbo.collection('Objects').find({"_id": params[0]._id});

    return object;
};

/**
  * Update object by Id
  *
  * @param {Array} [0] = JSON data of object, [1] = projectId, [2] = userId
  * @returns {JSON} Mongodb response
  */
const updateObjects = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    //Check for invalid projectId
    let check = await checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    params[0]['isDisabled'] = params[3]['isDisabled'];
    params[0]['approved'] = params[3]['approved'];
    params[0]['requestApprove'] = params[3]['requestApprove'];
    params[0]["creatorID"] = params[3]["creatorID"];

    //Update values
    await dbo.collection('Objects').replaceOne({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}}, params[0]);

    //Get updated object
    let types = await dbo.collection('Objects').find({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}});

    return types;
};

/**
  * Disable Objects without removing it from the database
  *
  * @param {Array} [0] = body, [1] = objectId, [2] = userId
  * @returns {JSON} Mongodb response
  */
const setObjectDisabled = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    //Check for invalid projectId
    let check = await checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    let disableValue = params[0]['isDisabled'];

    if (disableValue !== "1" && disableValue !== "0") {
        return {"error": true, "info": "Required parameters not set"};
    }


    //Update values
    await dbo.collection('Objects').updateOne({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}}, {"$set": {"isDisabled": disableValue}});

    //Get updated object
    let types = await dbo.collection('Objects').find({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}});

    return types;
};

/**
  * Make request to make object global
  *
  * @param {Array} [0] = body, [1] = objectId, [2] = userId
  * @returns {JSON} Mongodb response
  */
const setObjectRequestApprove = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    //Check for invalid projectId
    let check = await checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    let requestApprove = params[0];

    if (requestApprove != "1" && requestApprove != "0") {
        return {"error": true, "info": "Required parameters not set"};
    }


    //Update values
    await dbo.collection('Objects').updateOne({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}},
    {"$set": {"requestApprove": requestApprove}});

    //Get updated object
    let types = await dbo.collection('Objects').find({"_id": mongoID(params[1]),
        "creatorID": {"$in": [params[2]]}});

    return types;
};

/**
  * List unique categories in object collection
  *
  * @returns {Array} Mongodb response with an array
  */
const listCategories = async (db) => {
    let dbo = db.db(dbconfig.connection.database);

    let types = await dbo.collection('Objects').distinct("Kategori");

    return types;
};

/**
  * Get icon for category
  *
  * @param {Array} [0] = Category to find
  * @returns {JSON} Mongodb response with images
  */
const getCategoryIcon = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    let types = await dbo.collection('Ikoner').find({"Kategori": params[0]});

    return types;
};

/**
  * Get icon for all categories
  *
  * @returns {JSON} Mongodb response with images
  */
const getAllCategoryIcons = async (db) => {
    let dbo = db.db(dbconfig.connection.database);

    let types = await dbo.collection('Ikoner').find({});

    return types;
};

/**
  * Insert icon for category
  *
  * @param {Array} [0] = JSON object with Kategori and imgData
  * @returns {JSON} Mongodb response with images
  */
const insertCategoryIcon = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    let dict = params[0];
    //check if correct values is set

    if (dict['Kategori'] == undefined) {
        return {"error": true, "info": "Kategori not set"};
    }

    if (dict['Bild'] == undefined) {
        dict['Bild'] = defaultImage.defaultImage;
    }

    let toInsert = {"Kategori": dict['Kategori'], "Bild": dict['Bild']};

    await dbo.collection('Ikoner').insertOne(toInsert);
    let types = await dbo.collection('Ikoner').find({"_id": toInsert._id},
        {projection: {"Bild": 0}});

    return types;
};

/**
  * Remove Categori from icon table
  *
  * param {Array} [0] = categori name
  * returns {JSON} Json object saying removed true
  */
const removeCategoryIcon = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    await dbo.collection('Ikoner').deleteOne({"Kategori": params[0]});
    return {"removed": true, "error": false};
};

/**
  * Check if string is valid mongoId
  *
  * @param {Array} [0] = JSON POST request, [1] = ProjectId, [2] = UserId
  * @returns {JSON} undefined if not, empty request if yes
  *
  */
const checkInvalidID = async (db, id) => {
    if (!mongoID.isValid(id)) {
        return {"error": true, "info": "Invalid Id"};
    }
    return undefined;
};

//export modules
module.exports = {
    getAllObjects,
    getAllLocalObjects,
    setObjectRequestApprove,
    getObjectsByType,
    getCreatedObjects,
    getObjectById,
    deleteObjects,
    insertObject,
    updateObjects,
    setObjectDisabled,
    listCategories,
    getCategoryIcon,
    getAllCategoryIcons,
    insertCategoryIcon,
    removeCategoryIcon
};
