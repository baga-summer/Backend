/*
* user.js
* Router for handling user actions, such as getting user information
*/

const express               = require("express");
const router                = new express.Router();
const dbHandler             = require('../src/dbWrapper.js');
const userHandler           = require('../src/userHandler.js');
const jwtAuth               = require('../src/jwtAuthentication.js');

// GET /user/all shows all users in the system.
router.get("/all", async (req, res) => {
    let data = await dbHandler.dbConnectPipe(userHandler.getAllUsers);
    let users = [];
    let user = {};

    //filter user data and only return id and username
    for (user in data) {
        users.push({
            "id": data[user]._id,
            "username": data[user].username
        });
    }
    res.json(users);
});

//GET /user/verify verifies a token and sends back error true/false
router.get("/verify", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    if (user == false) {
        res.json({
            "error": true,
            "info": "token failed to validate"
        });
    } else {
        res.json({
            "error": false,
            "info": "token is valid"
        });
    }
});


module.exports = router;
