var Joi = require('joi');
const ApiError = function(req) {
    Error.call(this, 'An error occured on path: '+this.path);
    if(req) {
        this.path = req.path;
        this.req = req;
    }


};
ApiError.prototype = Object.create(Error.prototype);
ApiError.prototype.constructor = ApiError;
ApiError.prototype.invalidate = function (obj, schema, next) {
    var e = Joi.validate(obj, schema);

    if(e && e.error) {
        this.e = e.error;
        this.message = this.e.name+": "+this.e.details.map(item => item.message).join(', ');
        next(this);
    }
    return  e && e.error !== null;
};
ApiError.prototype.missingEntity = function (next) {
    this.message = "Entity not found";
    this.e = {
        name: "NotFoundError",
        details: []
    };
    next(this);
};
ApiError.prototype.duplicateEntity = function (error, next) {
    this.message = "Entity already exist, target entity cannot be saved because another entity already contain unique fields with the same value.";
    this.e = {
        name: "AlreadyExistingError",
        details: error.message
    };
    next(this);
};

ApiError.prototype.setUpError = function (message, type, details) {
    this.message = message;
    this.e = {
        name: type,
        details: details
    }

};

ApiError.prototype.toString = function () {
    try {
        return JSON.stringify(this.toJSON());
    } catch (e) {
        return "ApiError: Error can't be displayed";
    }
};

ApiError.prototype.toJSON = function () {
    return {
        path: this.path,
        message: this.message,
        type: this.e.name,
        details: this.e.details

    };
};

const AuthError = function(req) {
    Error.call(this, 'An error occured on path: '+this.path);
    if(req) {
        this.path = req.path;
    }


};
AuthError.prototype = Object.create(Error.prototype);
AuthError.prototype.constructor = AuthError;
AuthError.prototype.toJSON = ApiError.prototype.toJSON;
AuthError.prototype.toString = ApiError.prototype.toString;
AuthError.prototype.setUpError = ApiError.prototype.setUpError;

var authHandleError = (error, req, res, next) => {


    if(error instanceof AuthError) {
        if(currentConf.debug) {
            console.warn(new Date(), "AuthError: ", error);
        } else {
            delete error.stack;
        }

        let code = 400;
        let e = error.toJSON();

        if(e.type === "AuthenticationError") {
            res.setHeader("WWW-Authenticate", "Basic");
            code = 401;
        }
        if(e.type === "AccessError") {
            code = 403;
        }


        return res.status(code).json({
            error: "AuthError",
            message: error.message,
            statusCode: code,
            originalError: e
        });
    }

    next(error);
};


var apiHandleError = (error, req, res, next) => {


    if(error instanceof ApiError) {
        if(currentConf.debug) {
            console.warn(new Date(), "ApiError: ", error.toJSON());
        } else {
            delete error.stack;
        }
        let code = 503;
        let e = error.toJSON();
        if(e.type === 'ValidationError') {
            code = 400;
        }
        if(e.type === 'NotFoundError') {
            code = 404;
        }
        if(e.type === 'AlreadyExistingError') {
            code = 409;
        }

        return res.status(code).json({
            error: "ApiError",
            message: error.message,
            statusCode: code,
            originalError: e
        });
    }

    next(error);
};

var mongoHandleError = (error, req, res, next) => {


    if(error instanceof DatabaseError) {
        if(currentConf.debug) {
            console.warn(new Date(), "DatabaseError: ", error);
        } else {
            delete error.stack;
        }
        return res.status(400).json({
            error: "DatabaseError",
            message: error.message,
            originalError: error
        });
    }

    next(error);
};


var anyHandleError = (error, req, res, next) => {

    if(currentConf.debug) {
        console.warn(new Date(), "Error: ", error);
    } else {
        delete error.stack;
    }
    return res.status(500).json({
        error: "UnknownError",
        message: error.message,
        originalError: error
    });


};

var defaultHandleError = (req, res) => {
    if(currentConf.debug) {
        console.warn(new Date(), "NotFoundError: ", req.path);
    }
    return res.status(404).json({
        error: "Path Not Found",
        message: "path "+req.path+" is not found",
        statusCode: 404
    });
};

var Errors = {
    ApiError: ApiError,
    AuthError: AuthError
};
var DatabaseError;
var currentConf;

module.exports = {
    setErrorHandler: (app) => {
        let db = require('./database')(app.get('cfg').database);
        currentConf = app.get('cfg');
        Errors.DatabaseError = db.errorType;

        DatabaseError = Errors.DatabaseError;

        app.use(authHandleError);
        app.use(apiHandleError);
        app.use(mongoHandleError);
        app.use(defaultHandleError);
        app.use(anyHandleError);

    },

    Errors: Errors

};