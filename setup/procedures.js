/**
  * Get Project info from all projects
  *
  * @returns {JSON} All projects
  *
  */
getAllProjects = {
    _id: "getAllProjects",
    value: function() {
        return db.Projects.find({}, {data: 0});
    }
};

/**
  * Get the entire project by id
  *
  * @param {string} Id
  * @returns {JSON} Project with id
  *
  */

getProject = {
    _id: "getProject",
    value: function(id) {
        if (id == undefined) {return "id not defined";}
        return db.Projects.findOne({_id: ObjectId(id)});
    }
};

/**
  * Get the project data by id (Data is saved objects on the map)
  *
  * @param {string} Id
  * @returns {JSON} Project with id
  *
  */

getProjectData = {
    _id: "getProjectData",
    value: function(id) {
        if (id == undefined) {return "id not defined";}
        return db.Projects.findOne({_id: ObjectId(id)}, {data: 1});
    }
};

/**
  * Get the basic information from a project by id (Data is not included)
  *
  * @param {string} Id
  * @returns {JSON} Project with id
  *
  */

getProjectBasic = {
    _id: "getProjectInfo",
    value: function(id) {
        if (id == undefined) {return "id not defined";}
        return db.Projects.findOne({_id: ObjectId(id)}, {data: 0});
    }
};

/**
  * Create a new project
  *
  * @param {string} Name of project
  * @param {number} Project version number
  * @returns {JSON} Insert results
  *
  */

insertProject = {
    _id: "insertProject",
    value: function(name, version) {
        if (name == undefined) {return "name not defined";}
        if (version == undefined) {return "version not defined";}
        return db.Projects.insertOne({"name": name, "version": version, "data": []});
    }
};

/**
  * Update basic project information (Data not included)
  *
  * @param {string} Id
  * @param {string} Change to project name
  * @param {number} Change version number
  * @returns {JSON} Insert results
  *
  */

updateProject = {
    _id: "updateProject",
    value: function(id, name, version) {
        if (id == undefined) {return "id not defined";}
        if (name == undefined) {return "name not defined";}
        if (version == undefined) {return "version not defined";}
        return db.Projects.updateOne({_id: ObjectId(id)},
            {$set: {"name": name, "version": version}});
    }
};

/**
  * Update project data (Save project)
  *
  * @param {string} id
  * @param {array} Object information
  * @returns {JSON} Update results
  *
  */

updateProjectData = {
    _id: "updateProjectData",
    value: function(id, data) {
        if (id == undefined) {return "id not defined";}
        if (version == undefined) {return "version not defined";}
        return db.Projects.updateOne({_id: ObjectId(id)}, {$set: {"data": data}});
    }
};

/**
  * Delete project by id
  *
  * @param {number} Id
  * @returns {JSON} Delete results
  *
  */

deleteProject = {
    _id: "deleteProject",
    value: function(id) {
        if (id == undefined) {return "id not defined";}
        return db.Projects.deleteOne({_id: ObjectId(id)});
    }
};

/**
  * Get all objects in database
  *
  * @returns {JSON} Objects
  *
  */

getAllObjects = {
    _id: "getAllObjects",
    value: function() {
        return db.Objects.find({});
    }
};

/**
  * Search for objects in database by name/type
  *
  * @param {string} Name to search for
  * @returns {JSON} Found objects
  *
  */

getAllObjectsByType = {
    _id: "getAllObjectsByType",
    value: function(type) {
        if (type == undefined) {return "Type is undefined";}
        return db.Objects.find({"Kategori": type});
    }
};

/**
  * Update Object. Existing values will be updated other values will be appended
  *
  * @param {string} Object id
  * @param {JSON} Values to update or append
  * @returns {JSON} Update results
  *
  */
updateObject = {
    _id: "updateObject",
    value: function(id, update) {
        if (id == undefined) {return "id not defined";}
        if (update == undefined) {return "update not defined";}
        db.Objects.updateOne({_id: ObjectId(id)}, {$set: update});
    }
};

/**
  * Delete object by id
  *
  * @param {string} Object id
  * @returns {JSON} Delete results
  *
  */
deleteObjectById = {
    _id: "deleteObjectById",
    value: function(id) {
        if (id == undefined) {return "id not defined";}
        db.Objects.deleteOne({_id: ObjectId(id)});
    }
};

/**
  * Get suggestions for pump by liter per second and height
  *
  * @param {number} Liter per second
  * @param {number} Height
  * @returns {JSON} Pump suggestions
  *
  */

pumpKurva = {
    _id: "getPumpFromValues",
    value: function(lps, height) {
        if (lps == undefined) {return "lps not defined";}
        if (height == undefined) {return "height not defined";}

        let pumpar = db.Objects.find({"Namn": "Pump"});
        let retPumpar = {"Pumpar": []};

        for (let i = 0; i < pumpar.length(); i++) {
            let kurva = pumpar[i].PumpKurva;
            let kurvaLps = kurva.lps;
            let kurvaHeight = kurva.lyft;

            for (let j = 0; j < kurva_lps.length; j++) {
                if (lps >= kurvaLps[j]) {
                    if (height <= kurvaHeight[j]) {
                        retPumpar.Pumpar.push(pumpar[i]);
                    }
                    break;
                }
            }
        }
        return retPumpar;
    }
};

/**
  * Get possible pumps from outer diameter of pipe (Outlet)
  *
  * @param {number} Outer diameter
  * @returns {JSON} Insert results
  *
  */

getPumpFromLedningInlopp = {
    _id: "getPumpFromPipeInlet",
    value: function(outerDiam) {
        if (outerDiam == undefined) {return "outerDiam not defined";}
        return db.Objects.find({"Namn": "Pumpstation", "Inlopp.O": outerDiam});
    }
};

/**
  * Get possible pumps from outer diameter of pipe (Inlet)
  *
  * @param {number} Outer diameter
  * @returns {JSON} Insert results
  *
  */
getPumpFromLedningUtlopp = {
    _id: "getPumpFromPipeOutlet",
    value: function(outerDiam) {
        if (outerDiam == undefined) {return "outer not defined";}
        return db.Objects.find({"Namn": "Pumpstation", "Utlopp.G": outerDiam});
    }
};


//save scripts
db.system.js.save(getAllProjects);
db.system.js.save(getProject);
db.system.js.save(getProjectData);
db.system.js.save(getProjectBasic);
db.system.js.save(getAllObjects);
db.system.js.save(getAllObjectsByType);
db.system.js.save(insertProject);
db.system.js.save(updateProjectData);
db.system.js.save(deleteProject);
db.system.js.save(updateProject);
db.system.js.save(deleteObjectById);
db.system.js.save(updateObject);
db.system.js.save(pumpKurva);
db.system.js.save(getPumpFromLedningUtlopp);
db.system.js.save(getPumpFromLedningInlopp);

//load scripts
db.loadServerScripts();
