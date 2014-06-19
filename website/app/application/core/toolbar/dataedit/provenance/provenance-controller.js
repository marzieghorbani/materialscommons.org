Application.Controllers.controller('toolbarDataEditProvenance',
    ["$scope", "mcapi", "User", "$state", "$stateParams", "$filter",
        function ($scope, mcapi, User, $state, $stateParams, $filter) {

            $scope.showProvDetails = function (item, category) {
                if (category == 'input') {
                    switch (item.type) {
                        case "id":
                            mcapi('/objects/%', item.id)
                                .success(function (data) {
                                    $scope.sample = data
                                }).jsonp();
                            break;
                        case "condition":
                            //$scope.settings = $scope.process.inputs.
                            break;
                        case "file":
                            $state.go('toolbar.dataedit.provenance', ({'id': item.id}));
                            break;
                    }
                }
                else {
                    console.log(item)
                    switch (item.type) {

                        case "id":
                            mcapi('/objects/%', item.id)
                                .success(function (data) {
                                    $scope.sample = data
                                }).jsonp();
                            break;
                        case "condition":
                            //$scope.settings = $scope.process.inputs.
                            break;
                        case "file":
                            $state.go('toolbar.dataedit.provenance', ({'id': item.id}));
                            break;
                    }
                }
            }
            $scope.init = function () {
                $scope.id = $stateParams.id;
                $scope.ip_conditions = [];
                $scope.op_conditions = [];
                $scope.output_process = [];
                $scope.input_process = [];
//                mcapi('/processes/output/datafile/%', $scope.id)
//                    .success(function (data) {
//                        $scope.output_process = data;
//                    }).jsonp();
//
//                mcapi('/processes/input/datafile/%', $scope.id)
//                    .success(function (data) {
//                        $scope.input_processes = data;
//                    }).jsonp();
                mcapi('/processes/%', 'ee8fe4b4-4847-46a9-978f-59f6137b9250')
                    .success(function (data) {
                        $scope.process = data;
                        $scope.inputs = $filter('slice')($scope.process.inputs)
                        $scope.outputs = $filter('slice')($scope.process.outputs)
                    }).jsonp();
                mcapi('/processes/file/%', $stateParams.id)
                    .success(function (data2) {
                       console.log(data2)
                    }).jsonp();

            };
            $scope.init();
        }
    ])
;
