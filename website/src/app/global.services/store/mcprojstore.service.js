import {MCStore, EVTYPE} from './mcstore';
import transformers from './transformers';

class MCProjStoreService {
    /*@ngInject*/
    constructor($timeout, $q) {
        this.mcstore = new MCStore("mcprojstore", {
            projects: {},
            currentProjectId: null,
            currentExperimentId: null,
            currentProcessId: null
        });

        this.$timeout = $timeout;
        this.$q = $q;
        this.EVADD = EVTYPE.EVADD;
        this.EVREMOVE = EVTYPE.EVREMOVE;
        this.EVUPDATE = EVTYPE.EVUPDATE;
        this.EVSET = EVTYPE.EVSET;
        this.OTPROJECT = 'OTPROJECT';
        this.OTEXPERIMENT = 'OTEXPERIMENT';
        this.OTPROCESS = 'OTPROCESS';
        this._knownOTypes = [this.OTPROJECT, this.OTEXPERIMENT, this.OTPROCESS];
    }

    ready() {
        return this._ngwrap(this.mcstore.storeReady());
    }

    reset() {
        return this._ngwrap(this.mcstore.reset({
            projects: {},
            currentProjectId: null,
            currentExperimentId: null,
            currentProcessId: null
        }));
    }

    remove() {
        return this._ngwrap(this.mcstore.removeStore());
    }

    get projects() {
        return _.values(this.mcstore.store.projects);
    }

    getProject(projectId) {
        this.mcstore.set(this.OTPROJECT, store => store.currentProjectId = projectId);
        let store = this.mcstore.getStore();
        return store.projects[projectId];
    }

    addProject(project) {
        return this._ngwrap(this.mcstore.add(this.OTPROJECT, store => {
            store.projects[project.id] = transformers.transformProject(project);
        }));
    }

    addProjects(...projects) {
        return this._ngwrap(this.mcstore.add(this.OTPROJECT, store => {
            projects.forEach(p => {
                store.projects[p.id] = transformers.transformProject(p);
            });
        }));
    }

    updateCurrentProject(fn) {
        return this._ngwrap(this.mcstore.update(this.OTPROJECT, store => {
            const currentProj = getCurrentProjectFromStore(store);
            store.projects[store.currentProjectId] = fn(currentProj, transformers);
        }));
    }

    removeCurrentProject() {
        return this._ngwrap(this.mcstore.remove(this.OTPROJECT, store => {
            delete store.projects[store.currentProjectId];
            store.currentProjectId = store.currentExperimentId = store.currentProcessId = null;
        }));
    }

    get currentProject() {
        return this._getCurrentProject();
    }

    set currentProject(proj) {
        this.mcstore.set(this.OTPROJECT, (store) => store.currentProjectId = proj.id);
    }

    _getCurrentProject() {
        let store = this.mcstore.getStore();
        return store.projects[store.currentProjectId];
    }

    addExperiment(experiment) {
        return this._ngwrap(this.mcstore.add(this.OTEXPERIMENT, store => {
            const currentProject = getCurrentProjectFromStore(store);
            currentProject.experiments[experiment.id] = transformers.transformExperiment(experiment);
        }));
    }

    updateCurrentExperiment(fn) {
        return this._ngwrap(this.mcstore.update(this.OTEXPERIMENT, store => {
            const currentExperiment = getCurrentExperimentFromStore(store);
            let updated = fn(currentExperiment);
            const currentProject = getCurrentProjectFromStore(store);
            currentProject.experiments[store.currentExperimentId] = updated;
        }));
    }

    removeCurrentExperiment() {
        return this._ngwrap(this.mcstore.remove(this.OTEXPERIMENT, store => {
            const currentProject = getCurrentProjectFromStore(store);
            delete currentProject.experiments[store.currentExperimentId];
            store.currentExperimentId = null;
        }));
    }

    removeExperiments(...experiments) {
        return this._ngwrap(this.mcstore.remove(this.OTEXPERIMENT, store => {
            const currentProject = getCurrentProjectFromStore(store);
            experiments.forEach(e => {
                delete currentProject.experiments[e.id];
            });
        }));
    }

    get currentExperiment() {
        return this._getCurrentExperiment();
    }

    set currentExperiment(e) {
        this.mcstore.set(this.OTEXPERIMENT, store => store.currentExperimentId = e.id);
    }

    getExperiment(experimentId) {
        this.mcstore.set(this.OTEXPERIMENT, store => store.currentExperimentId = experimentId);
        return this._getCurrentExperiment();
    }

    setCurrentExperiment(experimentId) {
        return this.mcstore.set(this.OTEXPERIMENT, store => store.currentExperimentId = experimentId);
    }

    _getCurrentExperiment() {
        const currentProject = this._getCurrentProject();
        let store = this.mcstore.getStore();
        return currentProject.experiments[store.currentExperimentId];
    }

    addProcess(p) {
        return this._ngwrap(this.mcstore.add(this.OTPROCESS, store => {
            const currentExperiment = getCurrentExperimentFromStore(store);
            currentExperiment.processes[p.id] = p;
        }));
    }

    updateCurrentProcess(fn) {
        return this._ngwrap(this.mcstore.update(this.OTPROCESS, store => {
            const currentProcess = getCurrentProcessFromStore(store);
            let updated = fn(currentProcess);
            const currentExperiment = getCurrentExperimentFromStore(store);
            currentExperiment.processes[store.currentProcessId] = updated;
        }));
    }

    removeCurrentProcess() {
        return this._ngwrap(this.mcstore.remove(this.OTPROCESS, store => {
            const currentExperiment = getCurrentExperimentFromStore(store);
            delete currentExperiment.processes[store.currentProcessId];
            store.currentProcessId = null;
        }));
    }

    removeProcessById(processId) {
        return this._ngwrap(this.mcstore.remove(this.OTPROCESS, store => {
            const currentExperiment = getCurrentExperimentFromStore(store);
            delete currentExperiment.processes[processId];
            if (store.currentProcessId === processId) {
                store.currentProcessId = null;
            }
        }));
    }

    get currentProcess() {
        return this._getCurrentProcess();
    }

    set currentProcess(p) {
        this.mcstore.set(this.OTPROCESS, store => store.currentProcessId = p.id);
    }

    getProcess(processId) {
        this.setCurrentProcess(processId);
        return this._getCurrentProcess();
    }

    setCurrentProcess(processId) {
        return this.mcstore.set(this.OTPROCESS, store => store.currentProcessId = processId);
    }

    _getCurrentProcess() {
        let store = this.mcstore.getStore();
        return this._getCurrentExperiment().processes[store.currentProcessId];
    }

    _ngwrap(promise) {
        let deferred = this.$q.defer();
        promise.then(() => deferred.resolve());
        return deferred.promise;
    }

    multisubscribe(otype, fn, ...events) {
        let unsubscribes = events.map(e => this.subscribe(otype, e, fn));
        return () => {
            unsubscribes.forEach(f => f())
        };
    }

    subscribe(otype, event, fn) {
        if (!this._knownOType(otype)) {
            throw new Error(`Unknown Object Type ${otype}`);
        }
        return this._subscribe(event, otype, fn);
    }

    _knownOType(otype) {
        return this._knownOTypes.indexOf(otype) !== -1;
    }

    _subscribe(event, myotype, fn) {
        return this.mcstore.subscribe(event, (otype, store) => {
            if (myotype === otype) {
                this.$timeout(() => this._fnFire(otype, event, store, fn));
            }
        });
    }

    _fnFire(otype, event, store, fn) {
        switch (otype) {
            case this.OTPROJECT:
                return this._fnFireProject(event, store, fn);
            case this.OTEXPERIMENT:
                return this._fnFireExperiment(event, store, fn);
            case this.OTPROCESS:
                return this._fnFireProcess(event, store, fn);
            default:
                return;
        }
    }

    _fnFireProject(event, store, fn) {
        if (event === this.EVUPDATE || event === this.EVSET) {
            const currentProj = getCurrentProjectFromStore(store);
            fn(currentProj);
        } else {
            fn(store.projects);
        }
    }

    _fnFireExperiment(event, store, fn) {
        if (event === this.EVUPDATE || event === this.EVSET) {
            const currentExperiment = getCurrentExperimentFromStore(store);
            fn(currentExperiment);
        } else {
            const currentProject = getCurrentProjectFromStore(store);
            fn(currentProject.experiments);
        }

        // Force subscriptions on projects to fire by generating an update to current project that doesn't do anything.
        //this.updateCurrentProject(() => null);
    }

    _fnFireProcess(event, store, fn) {
        if (event === this.EVUPDATE || event === this.EVSET) {
            const currentProcess = getCurrentProcessFromStore(store);
            fn(currentProcess);
        } else {
            const currentExperiment = getCurrentExperimentFromStore(store);
            fn(currentExperiment.processes);
        }

        // Force subscription on experiments to fire by generating an update to current experiment that doesn't do anything.
        //this.updateCurrentExperiment(() => null);
    }
}

angular.module('materialscommons').service('mcprojstore', MCProjStoreService);

function getCurrentProjectFromStore(store) {
    return store.projects[store.currentProjectId];
}

function getCurrentExperimentFromStore(store) {
    const currentProj = getCurrentProjectFromStore(store);
    return currentProj.experiments[store.currentExperimentId];
}

function getCurrentProcessFromStore(store) {
    const currentExperiment = getCurrentExperimentFromStore(store);
    return currentExperiment.processes[store.currentProcessId];
}

