Application.Controllers.controller('projectHome',
    ["$scope", "project", "User", "mcapi", "ui", projectHome]);

function projectHome($scope, project, User, mcapi, ui) {

    $scope.show = function(what) {
        var expanded = ui.anyExpandedExcept(project.id, what);
        // if expanded is true that means something is expanded
        // besides the requested entry, so return false to show
        // this entry. Otherwise if expanded is false, that means
        // nothing is expanded so return true.
        return !expanded;
    };

    $scope.isExpandedInColumn = function(what) {
        var anyExpanded = false;
        what.forEach(function(entry) {
            if (ui.isExpanded(project.id, entry)) {
                anyExpanded = true;
            }
        });
        return anyExpanded;
    };

    $scope.updateName = function () {
        mcapi('/users/%', $scope.mcuser.email)
            .success(function (u) {
                $scope.editFullName = false;
                User.save($scope.mcuser);
            }).put({fullname: $scope.mcuser.fullname});
    };

    $scope.project = project;
    $scope.mcuser = User.attr();
}
