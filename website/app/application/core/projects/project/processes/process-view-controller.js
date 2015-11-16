(function (module) {
    module.controller('projectViewProcess', projectViewProcess);
    projectViewProcess.$inject = ["project", "mcfile", "mcmodal", "$state", "process"];

    function projectViewProcess(project, mcfile, mcmodal, $state, process) {
        var ctrl = this;
        ctrl.openSample = openSample;
        ctrl.openFile = openFile;
        ctrl.editProvenance = editProvenance;
        ctrl.images = images;
        ctrl.fileSrc = fileSrc;
        ctrl.isSet = isSet;
        ctrl.setTab = setTab;

        ctrl.project = project;
        ctrl.tab = 'setup';
        ctrl.process = process;

        function setTab(tabId) {
            ctrl.tab = tabId;
        }

        function isSet(tabId) {
            return ctrl.tab === tabId;
        }

        function fileSrc(id) {
            return mcfile.src(id);
        }

        function openSample(sample) {
            mcmodal.openModal(sample, 'sample', ctrl.project);
        }

        function openFile(file) {
            mcmodal.openModal(file, 'datafile', ctrl.project);
        }

        function editProvenance() {
            $state.go('projects.project.processes.edit', {process_id: ctrl.process.id});
        }

        function images(files) {
            var images = [];
            if (files){
                files.forEach(function (f) {
                    if (isImage(f.mediatype.mime)) {
                        images.push(f);
                    }
                });
            }
            return images;
        }

    }
}(angular.module('materialscommons')));
