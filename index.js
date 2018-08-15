

const DB = require('./database');
const ErrorHandling = require('./error-handling');
const AccessControl = require('./access-control');

module.exports = {
    database : DB,
    errorHandler : ErrorHandling,
    accessControl : AccessControl
};