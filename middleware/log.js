/*
 * Logs incomming requests to console. Shows route and method
 */
const logToConsole = (req, res, next) => {
    console.info(`Got request on ${req.path} (${req.method})`);
    next();
};

module.exports = {
    logToConsole
};
