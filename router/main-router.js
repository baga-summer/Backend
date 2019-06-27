const func = require("../src/primaryFunctions.js");

const express = require("express");
const router = new express.Router();

// Initial index route - only a template
router.get("/", (req, res) => {
    const data = func.indexExampleData();

    res.json(data);
});

module.exports = router;
