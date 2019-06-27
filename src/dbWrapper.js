/*
* Database functions
* Should be used instead of connecting to the database over
* and over again in other src files.
*/

/* Required dependencies */
const mongoClient = require('mongodb').MongoClient;
const dbConnConf = require('../config/dbConfig.js');

/*
* Connect
* Simple connect test, conntects to database.
*/
const connect = async () => {
    mongoClient.connect(
        "mongodb://" + dbConnConf.connection.username + ":" +  dbConnConf.connection.password +
        "@" + dbConnConf.connection.base_url + "/" + dbConnConf.connection.database,
        { useNewUrlParser: true },
        async (err, db) => {
            console.log("Connected");
            db.close();
        });
};

/**
* dbConnectPipe
* Takes a function as parameter and executes it against the database. Parses the result.
* @param fExecute function - Executed against the database
*/
const dbConnectPipe = (fExecute, fParams = undefined) => {
    return new Promise((resolve, reject) => {
        mongoClient.connect(
            "mongodb://" + dbConnConf.connection.username + ":" +  dbConnConf.connection.password +
            "@" + dbConnConf.connection.base_url + "/" + dbConnConf.connection.database,
            { useNewUrlParser: true },
            async (err, db) => {
                let res;

                if (fParams != undefined) {
                    res = await fExecute(db, fParams);
                } else {
                    res = await fExecute(db);
                }

                if (res.constructor == Object) {
                    resolve(res);
                } else {
                    res.toArray((err, data) => {
                        err ? reject(err) : resolve(data);
                    });
                }
                db.close();
            }
        );
    });
};


/**
 * dbSimpleStatement is a wrapper function
 * that executes the function inside a database scope
 * this function does not try and parse the data.
 * @param {function} fExecute is the function that will be executed.
 * @param {string} fParams parameters for the executed function
 * @return {Promise} Resolves the probmise and returns the fExecute return
 */
const dbSimpleStatement = (fExecute, fParams = undefined) => {
    return new Promise((resolve) => {
        mongoClient.connect(
            "mongodb://" + dbConnConf.connection.username + ":" +  dbConnConf.connection.password +
        "@" + dbConnConf.connection.base_url + "/" + dbConnConf.connection.database,
            { useNewUrlParser: true },
            async (err, db) => {
                let res;

                if (fParams != undefined) {
                    res = await fExecute(db, fParams);
                } else {
                    res = await fExecute(db);
                }
                resolve(res);
            });
    });
};

module.exports = {
    connect,
    dbConnectPipe,
    dbSimpleStatement
};
