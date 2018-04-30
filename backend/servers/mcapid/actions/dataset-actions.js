const {Action} = require('actionhero');
const dal = require('../lib/dal');
const datasets = require('../lib/dal/datasets');
const _ = require('lodash');
const validators = require('../lib/validators');
const check = require('../lib/dal/check');

module.exports.ListDatasetsAction = class ListDatasetsAction extends Action {
    constructor() {
        super();
        this.name = 'listDatasets';
        this.description = 'Retrieve a list of all datasets for a project';
        this.inputs = {
            project_id: {
                required: true,
            }
        }
    }

    async run({response, params}) {
        const dsets = await dal.tryCatch(async () => await datasets.getDatasetsForProject(params.project_id));
        if (!dsets) {
            throw new Error(`Unable to get datasets for project ${params.project_id}`);
        }

        response.data = dsets;
    }
};

module.exports.GetDatasetAction = class GetDatasetAction extends Action {
    constructor() {
        super();
        this.name = "getDataset";
        this.description = "Get dataset";
        this.inputs = {
            project_id: {
                required: true,
            },

            dataset_id: {
                required: true,
            },
        }
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const ds = await dal.tryCatch(async () => await datasets.getDataset(params.dataset_id));
        if (!ds) {
            throw new Error(`Unable to retrieve dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.CreateDatasetAction = class CreateDatasetAction extends Action {
    constructor() {
        super();
        this.name = 'createDataset';
        this.description = 'Create a new dataset';
        this.inputs = {
            title: {
                required: true,
                validator: (param) => {
                    if (!validators.validString(param, 1)) {
                        throw new Error(`title is invalid ${param}`)
                    }
                }
            },

            project_id: {
                required: true,
            },

            description: {
                default: "",
                validator: (param) => {
                    if (!_.isString(param)) {
                        throw new Error('description must be a string');
                    }
                }
            },

            samples: {
                default: [],
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error('samples must be an array');
                    }
                }
            }
        }
    }

    async run({response, params, user}) {
        const dsParams = {
            title: params.title,
            description: params.description,
            samples: params.samples,
        };

        if (params.samples.length) {
            const allInProject = await dal.tryCatch(async () => check.allSamplesInProject(params.project_id, params.samples));
            if (!allInProject) {
                throw new Error(`Invalid samples ${param.samples} for project ${param.project_id}`);
            }
        }

        const ds = await dal.tryCatch(async () => await datasets.createDataset(dsParams, user.id, params.project_id));
        if (!ds) {
            throw new Error(`Unable to create dataset ${dsParams.title}`);
        }

        response.data = ds;
    }
};

module.exports.DeleteDatasetAction = class DeleteDatasetAction extends Action {
    constructor() {
        super();
        this.name = 'deleteDataset';
        this.description = 'Deletes a dataset';
        this.inputs = {
            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        }
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const success = await dal.tryCatch(async () => await datasets.deleteDataset(params.dataset_id));
        if (!success) {
            throw new Error(`unable to delete dataset ${params.dataset_id}`);
        }
    }
};

module.exports.AddDatasetFilesAction = class AddDatasetFilesAction extends Action {
    constructor() {
        super();
        this.name = 'addDatasetFiles';
        this.description = 'Adds files to a dataset';
        this.inputs = {
            files: {
                required: true,
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error(`files must be an array of file ids ${param}`);
                    }
                }
            },

            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        };
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const allInProject = await dal.tryCatch(async () => check.allFilesInProject(params.project_id, params.files));
        if (!allInProject) {
            throw new Error(`Invalid files ${param.files} for project ${param.project_id}`);
        }

        const ds = await dal.tryCatch(async () => datasets.addFilesToDataset(params.dataset_id, params.files));
        if (!ds) {
            throw new Error(`Unable to add files ${params.files} to dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.DeleteDatasetFilesAction = class DeleteDatasetFilesAction extends Action {
    constructor() {
        super();
        this.name = 'deleteDatasetFiles';
        this.description = 'Delete files from a dataset';
        this.inputs = {
            files: {
                required: true,
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error(`files must be an array of file ids ${param}`);
                    }
                }
            },

            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        };
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const ds = await dal.tryCatch(async () => datasets.deleteFilesFromDataset(params.dataset_id, params.files));
        if (!ds) {
            throw new Error(`Unable to delete files ${params.files} from dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.AddDatasetSamplesAction = class AddDatasetSamplesAction extends Action {
    constructor() {
        super();
        this.name = 'addDatasetSamples';
        this.description = 'Add samples to a dataset';
        this.inputs = {
            samples: {
                required: true,
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error(`samples must be an array of sample ids ${param}`);
                    }
                }
            },

            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        };
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const allInProject = await dal.tryCatch(async () => check.allSamplesInProject(params.project_id, params.samples));
        if (!allInProject) {
            throw new Error(`Invalid samples ${param.samples} for project ${param.project_id}`);
        }

        const ds = await dal.tryCatch(async () => datasets.addSamplesToDataset(params.dataset_id, params.samples));
        if (!ds) {
            throw new Error(`Unable to add samples ${params.samples} to dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.DeleteDatasetSamplesAction = class DeleteDatasetSamplesAction extends Action {
    constructor() {
        super();
        this.name = 'deleteDatasetSamples';
        this.description = 'Delete samples from a dataset';
        this.inputs = {
            samples: {
                required: true,
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error(`samples must be an array of file ids ${param}`);
                    }
                }
            },

            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        };
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const ds = await dal.tryCatch(async () => datasets.deleteSamplesFromDataset(params.dataset_id, params.samples));
        if (!ds) {
            throw new Error(`Unable to delete samples ${params.samples} from dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.DeleteProcessesFromDatasetSampleAction = class DeleteProcessesFromDatasetSampleAction extends Action {
    constructor() {
        super();
        this.name = 'deleteProcessesFromDatasetSampleAction';
        this.description = 'Delete processes from a sample in dataset';
        this.inputs = {
            processes: {
                required: true,
                validator: (param) => {
                    if (!_.isArray(param)) {
                        throw new Error(`processes must be an array of file ids ${param}`);
                    }
                }
            },

            dataset_id: {
                required: true,
            },

            project_id: {
                required: true,
            }
        };
    }

    async run({response, params}) {
        const inProject = await dal.tryCatch(async () => await check.datasetInProject(params.dataset_id, params.project_id));
        if (!inProject) {
            throw new Error(`Dataset ${params.dataset_id} not in project ${params.project_id}`);
        }

        const ds = await dal.tryCatch(async () => datasets.deleteProcessesFromDataset(params.dataset_id, params.processes));
        if (!ds) {
            throw new Error(`Unable to delete processes ${params.processes} from dataset ${params.dataset_id}`);
        }

        response.data = ds;
    }
};

module.exports.PublishDatasetAction = class PublishDatasetAction extends Action {
    constructor() {
        super();
        this.name = 'publishDataset';
        this.description = 'Publish a dataset';
    }

    async run({response, params}) {

    }
};

module.exports.UnpublishDatasetAction = class UnpublishDatasetAction extends Action {
    constructor() {
        super();
        this.name = 'unpublishDataset';
        this.description = 'Unpublish an already published dataset';
    }

    async run({response, params}) {
    }
};