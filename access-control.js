function AccessController (cfg) {
    // Get access control config
    const roles = cfg;
    
    
    let buildPath = req => req.method.toUpperCase() + (req.app.basePath || req.baseUrl || '') + req.route.path;
    
    // Check if reqest path is under access control
    let checkPath = req => {
        let access = roles[buildPath(req)];
        return typeof access !== "undefined" && access !== null;
    };
    
    // Check if given user can access the request
    let checkRole = (req, user) => {
        // Retrieve access definition with request method and path
        let access = roles[buildPath(req)];
        
        // List roles
        let r = Object.keys(access);
        
        // Check if the access is by ownership and verify ownership if required
        let getAccessRight = a => {
            if (typeof access[a] === 'boolean') {
                return true;
            } else {
                let pk = Object.keys(access[a]);
                for (let p in pk) {
                    if (req.params[pk[p]] === user[access[a][pk[p]]]) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Check if the user have the proper access
        for (let a in r) {
            if (r[a] === ROLE_KEY.AUTENTICATED) {
                if (getAccessRight(r[a]))  return true;
            } else if(r[a] === ROLE_KEY.ACTIVE && user.active === true) {
                if (getAccessRight(r[a]))  return true;
            } else if((user.roles || []).indexOf(r[a]) >= 0 && user.active === true) {
                if (getAccessRight(r[a]))  return true;
            }
        }
        return false;
    };
    this.checkAccesses = checkRole;
    this.checkPath = checkPath;
};

// Declare some specific keys to use as access control like roles but more general (cf: access control for any authenticated user, or for any authenticated and active user)
const ROLE_KEY = {
    AUTENTICATED: "$authenticated",
    ACTIVE: "$active"
};


AccessController.prototype.ROLE_KEY = ROLE_KEY;


module.exports = (cfg) => new AccessController(cfg);
