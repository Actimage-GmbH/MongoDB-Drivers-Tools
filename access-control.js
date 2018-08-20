function AccessController (cfg) {
    const roles = cfg;

    let checkPath = req => {

        let access = roles[req.method.toUpperCase()+req.route.path];
        return typeof access !== "undefined" && access !== null;
    };

    let checkRole = (req, user) => {
        let access = roles[req.method.toUpperCase()+req.route.path];
        let r = Object.keys(access);

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
        for (let a in r) {
            if(r[a] === "$authenticated") {
                if(getAccessRight(r[a]))  return true;
            } else if(r[a] in (user.roles || [])) {
                if(getAccessRight(r[a]))  return true;
            }
        }
        return false;
    };
    this.checkAccesses = checkRole;
    this.checkPath = checkPath
};

module.exports = (cfg) => new AccessController(cfg);
