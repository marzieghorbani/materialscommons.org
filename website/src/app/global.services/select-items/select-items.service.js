export function selectItemsService($modal) {
    'ngInject';

    return {
        open: function() {
            var tabs = {
                processes: false,
                files: false,
                samples: false,
                reviews: false
            };

            let opts = {
                experimentId: ''
            };

            if (arguments.length === 0) {
                throw "Invalid arguments to service selectItems:open()";
            }

            for (var i = 0; i < arguments.length; i++) {
                if ((arguments[i] in tabs)) {
                    tabs[arguments[i]] = true;
                } else if (_.isObject(arguments[i])) {
                    opts.experimentId = arguments[i].experimentId;
                }
            }

            var modal = $modal.open({
                size: 'lg',
                templateUrl: 'app/global.services/select-items/select-items.html',
                controller: SelectItemsServiceModalController,
                controllerAs: 'ctrl',
                resolve: {
                    showProcesses: function() {
                        return tabs.processes;
                    },

                    showFiles: function() {
                        return tabs.files;
                    },

                    showSamples: function() {
                        return tabs.samples;
                    },

                    showReviews: function() {
                        return tabs.reviews;
                    },

                    options: () => opts
                }
            });
            return modal.result;
        }
    };
}

/*@ngInject*/
function SelectItemsServiceModalController($modalInstance, showProcesses, showFiles, showSamples, options,
                                           showReviews, projectsService, $stateParams, project, experimentsService) {
    var ctrl = this;

    ctrl.project = project.get();
    ctrl.tabs = loadTabs();
    ctrl.activeTab = ctrl.tabs[0].name;
    ctrl.setActive = setActive;
    ctrl.isActive = isActive;
    ctrl.ok = ok;
    ctrl.cancel = cancel;
    ctrl.processes = [];
    ctrl.samples = [];

    /////////////////////////

    function setActive(tab) {
        ctrl.activeTab = tab;
    }

    function isActive(tab) {
        return ctrl.activeTab === tab;
    }

    function ok() {
        var selectedProcesses = ctrl.processes.filter(function(p) {
            return p.input || p.output;
        });

        var selectedSamples = ctrl.samples.filter(function(s) {
            return s.selected;
        });

        var selectedFiles = getSelectedFiles();

        $modalInstance.close({
            processes: selectedProcesses,
            samples: selectedSamples,
            files: selectedFiles
        });
    }

    function getSelectedFiles() {
        if (!showFiles) {
            return [];
        }
        var files = [],
            treeModel = new TreeModel(),
            root = treeModel.parse(project.get().files[0]);
        // Walk the tree looking for selected files and adding them to the
        // list of files. Also reset the selected flag so the next time
        // the popup for files is used it doesn't show previously selected
        // items.
        root.walk({strategy: 'pre'}, function(node) {
            if (node.model.data.selected) {
                node.model.data.selected = false;
                if (node.model.data._type === 'file') {
                    files.push(node.model.data);
                }
            }
        });
        return files;
    }

    function cancel() {
        $modalInstance.dismiss('cancel');
    }

    function loadTabs() {
        var tabs = [];
        if (showProcesses) {
            tabs.push(newTab('processes', 'fa-code-fork'));
            if (options.experimentId) {

            } else {
                projectsService.getProjectProcesses($stateParams.project_id).then(function(processes) {
                    ctrl.processes = processes;
                });
            }
        }

        if (showSamples) {
            tabs.push(newTab('samples', 'fa-cubes'));
            if (options.experimentId && options.experimentId !== '') {
                experimentsService.getSamplesForExperiment($stateParams.project_id, options.experimentId).then(
                    (samples) => {
                        ctrl.samples = samples;
                    }
                )
            } else {
                projectsService.getProjectSamples($stateParams.project_id).then(function(samples) {
                    ctrl.samples = samples;
                });
            }
        }

        if (showFiles) {
            tabs.push(newTab('files', 'fa-files-o'));
        }

        if (showReviews) {
            tabs.push(newTab('reviews', 'fa-comment'));
        }

        tabs.sort(function compareByName(t1, t2) {
            if (t1.name < t2.name) {
                return -1;
            }
            if (t1.name > t2.name) {
                return 1;
            }
            return 0;
        });

        return tabs;
    }

    function newTab(name, icon) {
        return {
            name: name,
            icon: icon
        };
    }
}

