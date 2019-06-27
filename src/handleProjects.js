/*
* Database queries to retrive, modify, delete and create projects
*
*
*
*/
const mongoID = require("mongodb").ObjectID;
const dbconfig = require('../config/dbConfig.js');

/**
  * Get a predefined find project query where we see if a userId is
  * in the access value
  *
  * @param {String} UserId to find
  * @returns {JSON} JSON query
  *
  */
const findProjectQuery = (name) => {
    return {"$or": [{"access": { "$all": [{"$elemMatch": {"userID": name}}] }},
        {"creator.userID": name}]};
    //return {"access": { "$all": [{"$elemMatch": {"userID": name}}] }};
};

/**
  * Get a predefined find project query where we see if a userId is
  * in the access value and if the id matches
  *
  * @param {String} MongodbID to find
  * @param {String} UserId to find
  * @returns {JSON} JSON query
  *
  */
const findProjectQueryWithId = (id, name) => {
    return {"_id": mongoID(id),
        "$or": [{"access": { "$all": [{"$elemMatch": {"userID": name}}] }},
            {"creator.userID": name}]};
    //return {"_id": mongoID(id), "access": { "$all": [{"$elemMatch": {"userID": name}}] }};
};

/**
  * Get a predefined find project query where we see if a userId is
  * in the access value and if the id matches and if has permission/creator
  * (creator is the same as highest permission)
  *
  * @param {String} MongodbID to find
  * @param {String} UserId to find
  * @param {String} Permission to find
  * @returns {JSON} JSON query
  *
  */
const findPermissionQuery = (id, name, permission) => {
    return {"_id": mongoID(id),
        "$or": [{"access": { "$all":
        [{"$elemMatch": {"userID": name, "permission": permission}}] }},
        {"creator.userID": name}]};
};

/**
  * Get predefined query of find project with correct id and creator
  *
  * @param {String} MongodbID to find
  * @param {String} UserId to find in creator
  * @returns {JSON} JSON query
  *
  */
const findCreatorQueryWithId = (id, name) => {
    return {"_id": mongoID(id), "creator.userID": name};
};

/**
  * Check if object has correct permissions under access.permission
  *
  * @param {JSON} JSON to check permissions
  * @returns {JSON} if invalid permission, an error. If not, undefined
  *
  */
const checkValidPermission = (dict) => {
    if (dict["access"] != undefined) {
        for (let i = 0; i < dict["access"].length; i++) {
            let permission = dict["access"][i]["permission"];

            if (permission != undefined && permission !== "w" && permission !== "r") {
                return {"error": true, "info": "Invalid permission"};
            }
        }
    } else {
        dict['access'] = [];
    }

    return undefined;
};

/**
  * Get all project info for user
  *
  * @param {Array} [0] = UserId
  * @returns {JSON} mongodb response
  *
  */
const getProjects = async (db, params) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //find all projects

    let projects = await dbo.collection('Projects').find(findProjectQuery(params[0]),
        {projection: {"data": 0}});

    return projects;
};

/**
  * Get specific project for user
  *
  * @param {Array} [0] = ProjectId, [1] = UserId
  * @returns {JSON} mongodb response
  *
  */
const getProject = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[0],
        params[1]));

    return project;
};

/**
  * Get data from specific project for user
  *
  * @param {Array} [0] = ProjectId, [1] = UserId
  * @returns {JSON} mongodb response
  *
  */
const getProjectData = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[0],
        params[1]), {projection: {"data": 1}});

    return project;
};

/**
  * Get basic info from specific project for user
  *
  * @param {Array} [0] = ProjectId, [1] = UserId
  * @returns {JSON} mongodb response
  *
  */
const getProjectInfo = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[0],
        params[1]), {projection: {"data": 0}});

    return project;
};

/**
  * Insert new project for user
  *
  * @param {Array} [0] = JSON POST request, [1] = UserId, [2] username
  * @returns {JSON} mongodb response
  *
  */
const insertProject = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);

    let dict = params[0];

    let error = checkValidPermission(dict);

    if (error != undefined) {
        return error;
    }

    let defaultValues = {};

    if (dict["default"] != undefined) {
        defaultValues = dict["default"];
    }

    let insertedID = "";

    if ("name" in dict && "version" in dict) {
        let toInsert = {
            "name": dict["name"],
            "version": dict["version"], "access": dict['access'],
            "default": defaultValues,
            "creator": {"userID": params[1], "username": params[2]},
            "data": []
        };

        await dbo.collection('Projects').insertOne(toInsert);
        insertedID = toInsert._id;
    }
    let projects = await dbo.collection('Projects').findOne({"_id": insertedID},
        {projection: {"data": 0}});

    return projects;
};

/**
  * Delete project for user
  *
  * @param {Array} [0] = ProjectId, [1] = UserId
  * @returns {JSON} mongodb response
  *
  */
const deleteProject = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[0]);

    if (check != undefined) {return check;}

    await dbo.collection('Projects').deleteOne(findCreatorQueryWithId(params[0],
        params[1]));
    let project = await dbo.collection('Projects').find(findProjectQuery(params[1]),
        {projection: {"data": 0}});

    return project;
};

/**
  * Update basic info for specific project
  *
  * @param {Array} [0] = JSON POST request, [1] = ProjectId, [2] = UserId
  * @returns {JSON} mongodb response
  *
  */
const updateProject = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    let dict = params[0];

    let error = checkValidPermission(dict);

    if (error != undefined) {
        return error;
    }

    //delete creator value if submitted
    if (dict['creator'] != undefined) {
        delete dict['creator'];
    }

    await dbo.collection('Projects').updateOne(findCreatorQueryWithId(params[1],
        params[2]), {"$set": dict});

    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[1],
        params[2]), {projection: {"data": 0}});

    return project;
};

/**
  * Update data for specific project
  *
  * @param {Array} [0] = JSON POST request, [1] = ProjectId, [2] = UserId
  * @returns {JSON} mongodb response
  *
  */
const updateProjectData = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    await dbo.collection('Projects').replaceOne(findPermissionQuery(params[1],
        params[2], "w"), {"$set": {"data": params[0]}});
    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[1],
        params[2]));

    return project;
};

const getUsersPermission = async (db, params) => {
    let dbo = db.db(dbconfig.connection.database);
    //Check for valid mongodb objectId
    let check = checkInvalidID(db, params[1]);

    if (check != undefined) {return check;}

    let project = await dbo.collection('Projects').find(findProjectQueryWithId(params[1],
        params[2]), {projection: {"access": 1, "creator": 1}});

    return project;
};

/**
  * Check if string is valid mongoId
  *
  * @param {Array} [0] = JSON POST request, [1] = ProjectId, [2] = UserId
  * @returns {JSON} undefined if not, empty request if yes
  *
  */
const checkInvalidID = (db, id) => {
    if (!mongoID.isValid(id)) {
        return {"error": true, "info": "Invalid Id"};
    }
    return undefined;
};

//Export modules
module.exports = {
    getProjects,
    getProject,
    getProjectData,
    getProjectInfo,
    insertProject,
    deleteProject,
    updateProject,
    updateProjectData,
    getUsersPermission
};
