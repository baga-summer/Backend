/*
* admin.js
* Router for handling admin actions, it is important that only admins can preform these actions
*/

const express               = require("express");
const router                = new express.Router();
const bodyParser            = require("body-parser");
const urlencodedParser      = bodyParser.urlencoded({ extended: false });
const dbHandler             = require('../src/dbWrapper.js');
const loginHandler          = require('../src/loginHandler.js');
const adminFunctions        = require('../src/adminFunctions.js');
const jwtAuth               = require('../src/jwtAuthentication.js');
const objectInfo			= require('../src/getObjectInformation.js');

/**
* checkAdmin is a middleware function to check that the token belongs to an admin
* @param {object} req express http request object
* @param {object} res express response object
* @param {object} next continues the express stack
*/
const checkAdmin = (req, res, next) => {
    let user = jwtAuth.verify(req.query.token);

    if (user == false) {
        res.json({
            "error": true,
            "info": "token failed to validate"
        });
        return false;
    }

    if (user.isAdmin == false || user.isAdmin == null || user.isAdmin == undefined) {
        res.json({
            "error": true,
            "info": "user is not admin"
        });
        return false;
    }
    next();
    return true;
};

// GET /user shows user data from the token.
router.get("/user", checkAdmin, async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    res.json({
        "user": {
            "id": user._id,
            "username": user.username,
            "isAdmin": user.isAdmin
        }
    });
});

// Creates a new account for a new user
//Takes a POST request with  x-www-form-urlencoded with an email for the new user
router.post("/createaccount", checkAdmin, urlencodedParser, async (req, res) => {
    let tryCreateAccount = await dbHandler.dbSimpleStatement(
        loginHandler.adminCreateAccountForUser,
        [{
            "username": req.body.username,
            "isAdmin": req.body.isAdmin
        }]
    );

    if (tryCreateAccount.error == false) {
        res.json({"info": "User successfully crated!", "error": false});
    } else {
        if (tryCreateAccount.info == undefined) {
            tryCreateAccount.info = "Failed to create user!";
        }
        res.json(tryCreateAccount);
        // res.json({"info": "failed to create user!", "error": true});
    }
});

//Remove account
router.post("/remove/user/:userId", checkAdmin, urlencodedParser, async (req, res) => {
    let tryRemoveAccount = await dbHandler.dbSimpleStatement(
        loginHandler.adminRemoveAccount,
        [req.params.userId]
    );

    if (tryRemoveAccount.error == false) {
        res.json({"info": "User successfully removed!", "error": false});
    } else {
        if (tryRemoveAccount.info == undefined) {
            tryRemoveAccount.info = "Failed to remove user!";
        }
        res.json(tryRemoveAccount);
    }
});


//Admin list all projects
router.get("/allprojects", checkAdmin, async (req, res) => {
    let projects = await dbHandler.dbConnectPipe(adminFunctions.getAllProjects);

    res.json(projects);
});

//Admin list all objects
router.get("/obj/all", checkAdmin, async (req, res) => {
    let projects = await dbHandler.dbConnectPipe(adminFunctions.getAllObjects);

    res.json(projects);
});

//Get all objects requesting approve
router.get("/obj/approve", checkAdmin, async (req, res) => {
    let data = await dbHandler.dbConnectPipe(adminFunctions.getRequestApproveObjects);

    res.json(data);
});

//Approve object request
router.post("/obj/approve/:objectId/:acceptGlobal", checkAdmin, async (req, res) => {
    let data = await dbHandler.dbConnectPipe(adminFunctions.setObjectRequest,
        [req.params.acceptGlobal, req.params.objectId]);

    res.json(data);
});

//Disable global object
router.post("/obj/disable/:objectId/:enabled", checkAdmin, async (req, res) => {
    let data = await dbHandler.dbConnectPipe(adminFunctions.disableObject,
        [req.params.objectId, req.params.enabled]);

    res.json(data);
});

//Delete global object
router.post("/obj/delete/:objectId", checkAdmin, async (req, res) => {
    //Get object category
    let category = await dbHandler.dbConnectPipe(objectInfo.getObjectById,
        [req.params.objectId]);

    await dbHandler.dbConnectPipe(adminFunctions.deleteObject,
        [req.params.objectId]);

    //Get all available categoies in object table
    category = category[0]['Kategori'];

    let categories = await dbHandler.dbSimpleStatement(objectInfo.listCategories);

    //Check if categori is in list
    let removeCat = true;

    for (let i = 0; i < categories.length; i++) {
        if (category === categories[i]) {
            removeCat = false;
            break;
        }
    }

    //remove icon if not in list
    if (removeCat) {
        await dbHandler.dbConnectPipe(objectInfo.removeCategoryIcon,
            [category]);
    }

    let allObj = await dbHandler.dbConnectPipe(adminFunctions.getAllObjects);

    res.json(allObj);
});

module.exports = router;
