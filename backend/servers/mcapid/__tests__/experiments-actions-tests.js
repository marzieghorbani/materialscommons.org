const ActionHero = require('actionhero');
const actionhero = new ActionHero.Process();
const uuid = require('uuid/v4');
const r = require('@lib/test-utils/r');
const tutil = require('@lib/test-utils')(r);

describe('createExperimentInProject action tests', () => {
    let api;
    beforeAll(async() => api = await actionhero.start());
    afterAll(async() => {
        await actionhero.stop();
    });

    test('It should ', () => {

    });
});

describe('getExperiment action tests', () => {
    let api;
    beforeAll(async() => api = await actionhero.start());
    afterAll(async() => {
        await actionhero.stop();
    });

    test('It should ', () => {

    });
});

describe('renameExperimentInProject action tests', () => {
    let api;
    beforeAll(async() => api = await actionhero.start());
    afterAll(async() => {
        await actionhero.stop();
    });

    test('It should ', () => {

    });
});

describe('deleteExperimentInProject action tests', () => {
    let api;
    beforeAll(async () => api = await actionhero.start());
    afterAll(async () => {
        await actionhero.stop();
    });

    test('It should ', () => {

    });
});