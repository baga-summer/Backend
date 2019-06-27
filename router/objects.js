/*
* Objects
* Router for getting all static objects from the database
*/

// Load dependencies
const express       = require("express");
const router        = new express.Router();
const dbHandler     = require('../src/dbWrapper.js');
const objectInfo    = require('../src/getObjectInformation.js');
const projectInfo    = require('../src/handleProjects.js');
const validate      = require('../middleware/validateInput.js');
const jwtAuth       = require('../src/jwtAuthentication.js');


// get all objects
router.get("/all", async (req, res) => {
    let data = await dbHandler.dbConnectPipe(objectInfo.getAllObjects);

    res.json(data);
});
//get all objects in project
router.get("/all/local/:projectId", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    let projectData = await dbHandler.dbConnectPipe(projectInfo.getProjectInfo,
        [req.params.projectId, user._id]);

    let data = {"error": true, "info": "No project found"};

    if (projectData.length > 0) {
        data = await dbHandler.dbConnectPipe(objectInfo.getAllLocalObjects,
            [projectData[0], user._id]);
    }



    res.json(data);
});

//Request object to be approved by an admin
router.post("/approve/:objectId/:rApprove", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);
    let data = await dbHandler.dbConnectPipe(objectInfo.setObjectRequestApprove,
        [req.params.rApprove, req.params.objectId, user._id]);

    res.json(data);
});

// get data for a specific object
router.get("/type/:objectType", validate.filter, async (req, res) => {
    let data = await dbHandler.dbConnectPipe(objectInfo.getObjectsByType,
        [req.params.objectType]);

    res.json(data);
});

// get your created objects
router.get("/created", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);
    let data = await dbHandler.dbConnectPipe(objectInfo.getCreatedObjects,
        [user._id]);

    res.json(data);
});

// get specific object with id
router.get("/id/:objectId", async (req, res) => {
    let data = await dbHandler.dbConnectPipe(objectInfo.getObjectById,
        [req.params.objectId, "hidden"]);

    res.json(data);
});

// delete object by id
router.post("/delete/:objectId", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    //Get object category
    let category = await dbHandler.dbConnectPipe(objectInfo.getObjectById,
        [req.params.objectId]);

    //Delete object
    let data = await dbHandler.dbConnectPipe(objectInfo.deleteObjects,
        [req.params.objectId, user._id]);

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

    res.json(data);
});

// insert new object
router.post("/insert", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    if (req.body['Kategori'] == "undefined") {
        return {"error": true, "info": "Not valid category name"};
    }


    let data = await dbHandler.dbConnectPipe(objectInfo.insertObject,
        [req.body, user._id]);

    res.json(data);
});

// update object with id
router.post("/update/:objectId", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);

    let obj = await dbHandler.dbConnectPipe(objectInfo.getObjectById,
        [req.params.objectId, ""]);

    obj = obj[0];
    let data = await dbHandler.dbConnectPipe(objectInfo.updateObjects,
        [req.body, req.params.objectId, user._id, obj]);

    res.json(data);
});

//Disable object
//This will not permanently delete the object
//Only hide it
router.post("/disable/:objectId", async (req, res) => {
    let user = jwtAuth.verify(req.query.token);
    let data = await dbHandler.dbConnectPipe(objectInfo.setObjectDisabled,
        [req.body, req.params.objectId, user._id]);

    res.json(data);
});

//list all categories
router.get("/categories", async (req, res) => {
    let data = await dbHandler.dbSimpleStatement(objectInfo.listCategories);

    res.json(data);
});

//get icons for category by name
router.get("/categories/icon/type/:category", async (req, res) => {
    let data = await dbHandler.dbConnectPipe(objectInfo.getCategoryIcon,
        [req.params.category]);

    res.json(data);
});

//get all icons for categories
router.get("/categories/icon/all", async (req, res) => {
    let data = await dbHandler.dbConnectPipe(objectInfo.getAllCategoryIcons);

    res.json(data);
});

//insert a new icon for a category
router.post("/categories/icon/insert", async (req, res) => {
    let nameCheck = await dbHandler.dbSimpleStatement(objectInfo.listCategories);

    if (req.body['Kategori'] == "undefined") {
        return {"error": true, "info": "Not valid category name"};
    }

    for (let i = 0; i < nameCheck.length; i++) {
        if (req.body.Kategori == nameCheck[i]) {
            return {"error": true, "info": "Category is already in use"};
        }
    }

    let data = await dbHandler.dbConnectPipe(objectInfo.insertCategoryIcon,
        [req.body]);

    res.json(data);
});

module.exports = router;
