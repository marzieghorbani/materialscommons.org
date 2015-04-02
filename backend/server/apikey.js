// apikey module validates the apikey argument used in the call. It
// caches the list of users to make lookups faster.
var httpStatus = require('http-status');
module.exports = function(users) {
    'use strict';
    let apikeyCache = require('./apikey-cache')(users);
    // validateAPIKey Looks up the apikey. If none is specified, or a
    // bad key is passed then abort the calls and send back an 401.
    return function *validateAPIKey(next) {
        if (this.unprotected) {
            yield next;
        } else {
            let UNAUTHORIZED = httpStatus.UNAUTHORIZED;
            let apikey = this.query.apikey || this.throw(UNAUTHORIZED, 'Not authorized');
            let user = yield apikeyCache.find(apikey);
            if (! user) {
                this.throw(UNAUTHORIZED, 'Not authorized');
            }
            this.reqctx = {
                user: user
            };
            yield next;
        }
    };
};
