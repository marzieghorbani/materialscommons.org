Application.Controllers.controller('toolbar', ["$scope", function ($scope) {
    $scope.showDrafts = true;

    $scope.isActiveStep = function (nav) {
        return $scope.activeStep === nav;
    };

    $scope.showStep = function (step) {
        $scope.activeStep = step;
    };
}]);









