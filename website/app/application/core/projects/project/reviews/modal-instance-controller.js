Application.Controllers.controller('ModalInstanceCtrl',
    ["$scope", "$log", "modal", "project", "mcfile", "modalInstance", ModalInstanceCtrl]);

function ModalInstanceCtrl($scope, $log, modal, project, mcfile, modalInstance) {
    $scope.modal = modal;
    $scope.project = project;
    $scope.selected = {
        item: $scope.modal.item
    };
    $scope.fileSrc = function (file) {
        var id;
        if ('df_id' in file) {
            id = file.df_id;
        } else if ('datafile_id' in file) {
            id = file.datafile_id;
        } else {
            id = file.id;
        }
        return mcfile.src(id);
    };

    $scope.ok = function () {
        $scope.modal.instance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $scope.modal.instance.dismiss('cancel');
    };

    $scope.modal.instance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;

    }, function () {
        $log.info('Modal dismissed at: ' + new Date());
    });

    $scope.downloadSrc = function (file) {
        return mcfile.downloadSrc(file.id);
    };

    $scope.openSample = function(sample){
        modalInstance.openModal(sample, 'sample', project);
    };

    $scope.openFile = function(file){
        modalInstance.openModal(file, 'datafile', project);
    };
}
