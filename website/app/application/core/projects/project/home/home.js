Application.Controllers.controller('projectHome',
    ["$scope", "project", "ui", projectHome]);

function projectHome($scope, project, ui) {

    $scope.column1 = [
        "reviews",
        "files"
    ];

    $scope.column2 = [
        "sideboard",
        "samples",
        "notes",
        "processes"
    ];

    $scope.onDropColumn1 = function(target, source) {
        console.log("onDropColumn1:", target, source);
        var index = _.indexOf($scope.column1, function(panel) {
            return panel == source;
        });

        if (index !== -1) {
            // Moving in same column so remove the original entry
            $scope.column1.splice(index, 1);
        } else {
            // Moving across columns. So remove from column2.
            index = _.indexOf($scope.column2, function(panel) {
                return panel == source;
            });
            $scope.column2.splice(index, 1);
        }

        $scope.column1.splice(target, 0, source);
    };

    $scope.onDropColumn2 = function(target, source) {
        console.log("onDropColumn2:", target, source);
        var index = _.indexOf($scope.column2, function(panel) {
            return panel == source;
        });

        if (index !== -1) {
            // Moving in same column so remove the original entry
            $scope.column2.splice(index, 1);
        } else {
            // Moving across columns. So remove from column1.
            index = _.indexOf($scope.column1, function(panel) {
                return panel == source;
            });
            $scope.column1.splice(index, 1);
        }

        $scope.column2.splice(target, 0, source);
    };

    $scope.showPanel = function(what) {
        return ui.showPanel(what, project.id);
    };

    $scope.isMinimized = function(panel) {
        return !ui.showPanel(panel, project.id);
    };

    $scope.openPanel = function(panel) {
        ui.togglePanelState(panel, project.id);
    };

    $scope.isExpandedInColumn = function (what) {
        var anyExpanded = false;
        what.forEach(function (entry) {
            if (ui.isExpanded(project.id, entry)) {
                anyExpanded = true;
            }
        });
        return anyExpanded;
    };

    $scope.isColumnActive = function(column){
        return ui.getColumn(column,  $scope.project.id);
    };

    $scope.isEmptySplitBoard = function(){
        return ui.getEmptySplitStatus($scope.project.id);
    };

    $scope.project = project;
}
