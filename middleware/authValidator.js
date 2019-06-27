const jwtAuth = require('../src/jwtAuthentication.js');

const checkToken = (req, res, next) => {
    let token = req.query.token;

    if (token == undefined) {
        res.json({
            "error": true,
            "info": "No token was supplied"
        });
        return false;
    }

    let tokenIsValid = jwtAuth.verify(token);

    if (tokenIsValid) {
        next();
        return true;
    }
    res.json({
        "error": true,
        "info": "token failed to validate"
    });
    return false;
};

module.exports = {
    checkToken
};
