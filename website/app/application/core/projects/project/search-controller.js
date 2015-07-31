Application.Controllers.controller('searchController',
    ["mcapi", "project", "$stateParams", "mcfile", "$state", "projectFiles", searchController]);

function searchController(mcapi, project, $stateParams, mcfile, $state, projectFiles) {
    var ctrl = this;
    ctrl.isImage = isImage;
    ctrl.fileSrc = fileSrc;
    ctrl.openFile = openFile;

    init();

    //////////////////////////////

    function init() {
        mcapi("/search/project/%/files", project.id)
            .success(function (results) {
                ctrl.results = results;
            })
            .post({query_string: $stateParams.query});
    }

    function fileSrc(id) {
        return mcfile.src(id);
    }

    function openFile(f) {
        projectFiles.setActiveFile(f);
        $state.go('projects.project.files.edit', {file_id: f.id, file_type: f._type});
    }
}