Application.Directives.directive('actionCreateNote', actionCreateNoteDirective);

function actionCreateNoteDirective() {
    return {
        controller: "actionCreateNoteController",
        restrict: "A",
        templateUrl: "application/core/projects/directives/action-stack-create-note.html"
    };
}

Application.Controllers.controller('actionCreateNoteController',
    ["$scope", "model.projects", "$stateParams", "User", "dateGenerate", "toaster", actionCreateNoteController]);

function actionCreateNoteController($scope, Projects, $stateParams, User, dateGenerate, toaster) {

    $scope.add_notes = function () {
        if ($scope.model.new_note!==''){
            $scope.project.notes.push({'message': $scope.model.new_note, 'who': User.u(), 'date': dateGenerate.new_date()});
            $scope.saveData();
            $scope.model.new_note = "";
            toaster.pop('success', "Note:", "Notes has been saved", 3000);
        }else{
            toaster.pop('warning', "Note:", "Empty note", 3000);
        }

    };

    $scope.saveData = function () {
        $scope.project.put(User.keyparam()).then(function() {
//            $scope.toggleStackAction('create-note');
        });
    };

    function init() {
        $scope.project_id = $stateParams.id;
        Projects.get($scope.project_id).then(function(project) {
            $scope.project = project;
        });

        $scope.model = {
            new_note: ""
        };
    }

    init();
}
