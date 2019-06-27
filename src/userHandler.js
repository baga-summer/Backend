/**
* user.js
* has functions related to user specific actions
*/

const dbconfig = require('../config/dbConfig.js');

/**
* Get all users from the database
* @param {object} db This is the mongodb database object
* @return returns a cursor containing all users
*/
const getAllUsers = async (db) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);

    //find all users, but only return id, username and admin status
    let users = await dbo.collection('Users').find({});

    //The data here is not the clean data but instead something that is called a cursor.
    //Parsing that will be taken care of in the dbWrapper
    return users;
};

module.exports = {
    getAllUsers
};
