function AccessController (cfg) {
    //get access control config
    const roles = cfg;

    //check if reqest path is under access control
    let checkPath = req => {

        let access = roles[req.method.toUpperCase()+req.route.path];
        return typeof access !== "undefined" && access !== null;
    };

    //check if given user can access the request
    let checkRole = (req, user) => {
        //retriev access definition with request methode and path
        let access = roles[req.method.toUpperCase()+req.route.path];

        //list roles
        let r = Object.keys(access);

        //check if the access is by ownership and verify ownership if required
        let getAccessRight = a => {
            if(typeof access[a] === 'boolean') {
                return true;
            } else {
                let pk = Object.keys(access[a]);
                for(let p in pk) {
                    if(req.params[pk[p]] === user[access[a][pk[p]]]) {
                        return true;
                    }
                }
            }
            return false;
        };

        //check if the user have the proper access
        for (let a in r) {
            if(r[a] === ROLE_KEY.AUTENTICATED) {
                if(getAccessRight(r[a]))  return true;
            } else if(r[a] === ROLE_KEY.ACTIVE && user.active === true) {
                if(getAccessRight(r[a]))  return true;
            } else if(r[a] in (user.roles || []) && user.active === true) {
                if(getAccessRight(r[a]))  return true;
            }
        }
        return false;
    };
    this.checkAccesses = checkRole;
    this.checkPath = checkPath;
};

//declare some specific keys to use as access control like roles but more generals (cf: access control for any authenticated user, or for any authenticated and active user)
const ROLE_KEY = {
    AUTENTICATED: "$authenticated",
    ACTIVE: "$active"
};


AccessController.prototype.ROLE_KEY = ROLE_KEY;


module.exports = (cfg) => new AccessController(cfg);
