const jwt = require('jsonwebtoken');

/**
* Create JSON Web Token
* Creates a token for a user to auth aganist the API
* @param {object} user the user object
* @return {string} returns jwt token
*/
const createToken = (user) => {
    //Crete a time object for expiery date
    let exp = new Date();

    //Add six days
    exp.setTime(new Date(exp.getTime() + 6*24*60*60));
    //Add expiery to JWT object
    user.exp = exp.getTime();
    user.iat = Date.now();
    //Return JWT
    return jwt.sign(user, global.jwtSecret);
};

/**
* Verify a token
* @param {string} token - a JSON web token
* @return {bool} true if success, false if not
*/
const verify = (token) => {
    let verifiedTokenResult = jwt.verify(token, global.jwtSecret, (err, decoded) => {
        //check for decode error in jwt
        if (err != null) {
            return false;
        }
        //get current date
        let currentTime = Date.now();

        //check if token is expired
        if (token.exp > currentTime) {
            return false;
        }
        //If the token was issued more than a day ago, renew it
        if (currentTime - token.iat > 60*60*24) {
            decoded = createToken(decoded);
        }
        //All checks passed, return token.
        return decoded;
    });

    return verifiedTokenResult;
};

module.exports = {
    createToken,
    verify
};
