/*
 *  Filter - Filters user input to not contain anything bad
 *  Looks att all URL parameters and filters all that are deemed bad
 *  This filter function calls other functions that validate for different things
*/

/**
 * Check string for any illegal characters
 *
 * @param {string} String to check for illegal characters
 * @return {bool} If string has illegal characters or not
 */
const checkIllegalChars = (string) => {
    if (
        string.includes("'") ||
		string.includes('"') ||
		string.includes("´") ||
		string.includes("{") ||
		string.includes("}") ||
		string.includes("\\")||
		string.includes("$") ||
		string.includes("<") ||
		string.includes(">") ||
		string.includes("\x00")
    ) {
        console.log("Bad string: " + string);
        return true;
    }
    return false;
};

/**
 * Check if variable is anything but string, number, array and json
 * String will also check for illegal characters
 *
 * @param {any} Variable to check variable type
 * @return {bool} If variable has illegal variables or not
 */
const isInvalidVariable = (variable) => {
    //Check if string, int, float, array and json
    if (variable.constructor) { return false; }
    let con = variable.constructor;

    //check for string
    if (con === "".constructor) {
        //check if string has illegal characters
        return checkIllegalChars(variable);
    }

    //check for number
    if (!isNaN(variable)) {
        return false;
    }

    //check for arrayString
    if (con === [].constructor) {
        for (let i = 0; i < variable.length; i++) {
            //check array values for type
            if (isInvalidVariable(variable[i])) {
                return true;
            }
        }
        return false;
    }

    //Check for JSON object
    if (con === {}.constructor) {
        let keys = Object.keys(variable);

        for (let i = 0; i < keys.length; i++) {
            //check JSON object values for type
            if (isInvalidVariable(variable[keys[i]])) {
                return true;
            }
        }
        return false;
    }

    return true;
};

/**
 * Looks at all input variables and filters out the bad ones.
 *
 * @param {Request object} req request object from router
 * @param {Response object} res is the response object that is forwarded
 * @param {function} next express function that will step to the next segment of the router
 * @return {void} Breaks if it is invalid, this causes the route to not load
 */
const filter = (req, res, next) => {
    //remove "_id" if it's in the actual id location
    if (req.body['_id'] != undefined) {
        delete req.body['_id'];
    }
    // This filters the request parameters in the url
    if (req.body  != undefined) {
        // Itterate all parameters
        for (let value in req.body) {
            //perform check for illegal variable types
            if (isInvalidVariable(req.body[value]) ||
				isInvalidVariable(value)) {
                console.log("Bad variable detected, halting request.");
                // Return an error to the user
                return res.json({"Error": "bad input data"});
            }
        }
    }

    // This filters the query parameters
    if (req.query != undefined) {
        // Itterate all parameters
        for (let value in req.query) {
            //perform check for illegal variable types
            if (isInvalidVariable(req.query[value]) ||
				isInvalidVariable(value)) {
                console.log("Bad variable detected, halting request.");
                // Return an error to the user
                return res.json({"Error": "bad input data"});
            }
        }
    }
    // Continue forward
    next();
};


module.exports = {
    filter
};
