/*
* LoginHandler.js
* This contains all the functions to handle account events such as
* creating accounts, login, changing passwords, sending confirmation emails.
*/

//needs dbConfig to select database
const dbconfig          = require('../config/dbConfig.js');
const jwtAuth           = require('./jwtAuthentication.js');
const mailman           = require('./smtpMailman.js');
const crypto            = require("crypto");
const bcrypt            = require('bcrypt');
const saltRounds        = 10;
const mongoID = require("mongodb").ObjectID;

/**
* Salts and hashes a password with bcrypt.
* @param {string} passwd the unhashed password
* @return {string} Returns the hashed password
*/
const createNewPasswordHash = (passwd) => {
    let bcryptHash = bcrypt.hash(passwd, saltRounds).then(function(hash) {
        return hash;
    });

    return bcryptHash;
};

/**
* Checks if a password matches the password hash from the userObject
* @param {string} plaintext the plaintext password the user tries to log in with
* @param {object} userObject a userObject containing at least password
* @return {bool} Returns true if it matches, false if it doesn't
*/
const validatePassword = (plaintext, hash) => {
    let hashCompare = bcrypt.compare(plaintext, hash).then(function(res) {
        return res;
    });

    return hashCompare;
};

/**
* Generates a one time key to be stored in the database as a reset token
* @return {string} returns the random key
*
*/
const createOneTimeKey = () => {
    return crypto.randomBytes(32).toString('base64');
};

/**
* Creates a user object to match how it's stored in the database.
* @param {string} username the username or email the account is tied to
* @param {string} password the users password, will be ran through hashPasswordSecurly
* @param {bool} admin sets if the user should be admin, default false
*/
const createNewUser = async (username, password, admin = false) => {
    let hashedPassword = await createNewPasswordHash(password);
    let userObject = {
        "username": username,
        "password": hashedPassword,
        "isAdmin": admin
    };

    return userObject;
};

/**
* Inserts a user into the database
* @param {object} db database object from dbWrapper
* @param {json} userAccount a user account in json format, should be generated from createUser.
* @return {bool} specifies if the insert statement was successfull or not.
*/
const insertUserInDatabase = async (db, userAccount) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne({"username": userAccount[0].username});

    //If we find an existing user, return false - a new user was not created
    if (existingUser != null) {
        return false;
    }

    //We have no existing user with this name, insert the new one.
    let insertStatement = await dbo.collection('Users').insertOne(userAccount[0]);

    if (insertStatement.result.ok == 1) {
        return true;
    }
    return false;
};

/**
* Check if the user login is correct
* @param {object} db Database object
* @param userAccount the user account that tries to login
* @return {bool} True if login is successfull, false if it fails
*/
const verifyUserLogin = async (db, userAccount) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne({"username": userAccount[0].username});

    //If we don't find a user they can't log in.
    if (existingUser == null) {
        return {"error": true};
    }

    // Make sure we don't throw an unhandled promise rejection if the password does not exist
    if (userAccount[0].password == undefined || userAccount[0].password == undefined) {
        return {"error": true};
    }

    //Check if the user submitted password matches the hashed password in the database
    let passwordIsValid = await validatePassword(userAccount[0].password, existingUser.password);

    if (passwordIsValid) {
        return {"error": false, token: jwtAuth.createToken(existingUser)};
    }
    return {"error": true};
};

/**
* changePassword updates the new users password
* @param {object} db Database object
* @param {array} userChangePassword array conianing the userObject
* @return {bool} return true if password has been changed, false if it hasn't
*/
const changePassword = async (db, userChangePassword) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne(
        {"username": userChangePassword[0].username}
    );

    //If we don't find a user they can't change their password
    if (existingUser == null) {
        return false;
    }

    // Make sure we don't throw an unhandled promise rejection if the password does not exist
    if (
        userChangePassword[0].password == undefined ||
        userChangePassword[0].password == undefined) {
        return false;
    }

    //They have to enter their password again to change it
    let oldPasswordMatches = await validatePassword(
        userChangePassword[0].password,
        existingUser.password
    );

    if (!oldPasswordMatches) {
        return false;
    }
    //New password must be written twice and match
    if (userChangePassword[0].newPassword != userChangePassword[0].confirmNewPassword) {
        return false;
    }

    //Create new hashed password and salt and update the database
    let newpw = await createNewPasswordHash(userChangePassword[0].newPassword);
    let res = await dbo.collection('Users').updateOne(
        {"username": userChangePassword[0].username},
        {$set: {"password": newpw}}
    );

    //Check to make sure it went ok and the database was updated
    if (res.result.ok == 1 && res.result.nModified == 1) {
        return true;
    }
    return false;
};

/**
* Issues a one time use token to the user
* @param {object} db Database object
* @param {array} userToResetPassword array conianing the userObject
* @return {bool} return true if a one time key has been created, false if it hasn't
*/
const setOneTimeKey = async (db, userToResetPassword) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne(
        {"username": userToResetPassword[0].username}
    );

    //If we don't find a user they can't change their password
    if (existingUser == null) {
        return false;
    }

    //Create a oneTimeKey
    let oneTimeKey = createOneTimeKey();
    let res  = await dbo.collection('Users').updateOne(
        {"username": userToResetPassword[0].username},
        {$set: {"oneTimeKey": oneTimeKey}}
    );

    //Check to make sure it went ok and the database was updated
    if (res.result.ok == 1 && res.result.nModified == 1) {
        //Send the reset token to the users email
        mailman.sendEmail(
            userToResetPassword[0].username,
            mailman.createResetTokenEmail(oneTimeKey)
        );
        return true;
    }
    return false;
};

/**
* Verifies the one time token, removes it and sets the new password
* @param {object} db Database object
* @param {array} userToUpdatePassword array conianing the userObject
* @return {bool} return true if the key matches and password has been changed, false if it hasn't
*/
const verifyOneTimeKeyAndSetPassword = async (db, userToUpdatePassword) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne(
        {"username": userToUpdatePassword[0].username}
    );

    //If we don't find a user they can't change their password
    if (existingUser == null) {
        return false;
    }

    //Make sure the user has a oneTimeKey to use
    if (
        existingUser.oneTimeKey == undefined ||
        existingUser.oneTimeKey == null ||
        existingUser.oneTimeKey == ""
    ) {
        return false;
    }

    if (userToUpdatePassword[0].oneTimeKey != existingUser.oneTimeKey) {
        return false;
    }

    //New password must be written twice and match
    if (userToUpdatePassword[0].newPassword != userToUpdatePassword[0].confirmNewPassword) {
        return false;
    }

    //Create new hashed password and salt and update the database
    let newpw = await createNewPasswordHash(userToUpdatePassword[0].newPassword);
    let res = await dbo.collection('Users').updateOne(
        {"username": userToUpdatePassword[0].username},
        {$set: {"password": newpw, "oneTimeKey": null}}
    );

    //Check to make sure it went ok and the database was updated
    if (res.result.ok == 1 && res.result.nModified == 1) {
        return true;
    }
    return false;
};

/**
* Admin user action to create a new account for a user
* @param {object} db Database object
* @param {array} newUser array conianing the userObject
* @return {bool} return true if the user was created, false if it wasn't
*/
const adminCreateAccountForUser = async (db, newUser) => {
    //Select database
    let dbo = db.db(dbconfig.connection.database);
    //Search for an existing user with that username
    let existingUser = await dbo.collection('Users').findOne(
        {"username": newUser[0].username}
    );

    //If we find an existing user, return false - a new user was not created
    if (existingUser != null) {
        return {"error": true, "info": "User already exists."};
    }

    //Create a oneTimeKey
    let generatedOneTimeKey = createOneTimeKey();
    //Create a user account with one time key without a password

    console.log(newUser[0]);
    let userAccount = {
        "username": newUser[0].username,
        "isAdmin": newUser[0].isAdmin,
        "oneTimeKey": generatedOneTimeKey
    };
    //We have no existing user with this name, insert the new one.
    let res = await dbo.collection('Users').insertOne(userAccount);
    //Check to make sure it went ok and the database was updated

    //Check that the result is correctly inserted into the database
    if (res.result.ok == 1 && res.result.n == 1) {
        //Send the user an email with the token that they need to signup
        mailman.sendEmail(
            newUser[0].username,
            mailman.createNewAccountTokenEmail(generatedOneTimeKey)
        );
        return {"error": false};
    }
    return {"error": true, "info": "Error adding user to database."};
};
/**
  * Remove an account from the database by id
  *
  * @param {Array} [0] = userId
  * @return {JSON} if user was removed or not
  */
const adminRemoveAccount = async (db, deleteUser) => {
    //Check for valid mongo id
    if (!mongoID.isValid(deleteUser[0])) {
        return {"error": true, "info": "Invalid Id"};
    }

    //Try remove from database
    let dbo = db.db(dbconfig.connection.database);
    let delResp = await dbo.collection('Users').deleteOne(
        {"_id": mongoID(deleteUser[0])}
    );

    //Check if anything was deleted
    if (delResp.deletedCount > 0) {
        return {"error": false};
    } else {
        return {"error": true};
    }
};

module.exports = {
    insertUserInDatabase,
    createNewUser,
    verifyUserLogin,
    changePassword,
    setOneTimeKey,
    verifyOneTimeKeyAndSetPassword,
    adminCreateAccountForUser,
    adminRemoveAccount
};
