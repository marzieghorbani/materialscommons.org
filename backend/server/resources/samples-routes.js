module.exports = function(model, schema) {
    'use strict';
    let router = require('koa-router')();
    let samples = require('./samples')(model, schema);
    router.post('/samples', samples.create);
    router.put('/samples/:id', samples.update);
    return router;
};
