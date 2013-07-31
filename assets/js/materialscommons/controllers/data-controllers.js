function DataEditController($scope, $routeParams, $window, $http, User) {

//    $scope.mcdb = Mcdb.db();
//    $scope.doc = Mcdb.db().getDoc($routeParams.id);

    $http.jsonp(mcurljsonpu2('/data', $routeParams.id, User))
        .success(function(data) {
           $scope.doc = data;
        });

    $scope.tagchoices = new Array();
    $http.jsonp(mcurljsonp('/tags'))
        .success(function(data) {
            data.forEach(function(item) {
                $scope.tagchoices.push(item.id);
            })
        })
//    $scope.mcdb.query("materialscommons-app", "tags_by_count", {group_level: 1}).success(function (data) {
//        data.rows.forEach(function (kv) {
//            $scope.tagchoices.push(kv.key[0]);
//        });
//    });

    $scope.removeTag = function (index) {
        $scope.doc.tags.splice(index, 1);
    }

    $scope.createNewTag = function (term) {
        console.log("createNewTag called:" + term);
    }

    $scope.addTag = function () {
        if (!$scope.doc.tags) {
            $scope.doc.tags = new Array();
        }

        if (!_.contains($scope.doc.tags, $scope.tag_to_add)) {
            $scope.doc.tags.push($scope.tag_to_add);
        }
    }

    $scope.saveData = function () {
        console.log("Sending a post request");
        //$http.put(mcurlu2('/data/update', $scope.doc.id, User), $scope.doc)
        $http.put('http://localhost:5000/materialscommons/api/v1.0/abc', $scope.doc)
            .success(function(data, status) {
                console.dir(data);
                console.dir(status);
            }).error(function(data, status, headers, config) {
                console.log("Post error");
                console.dir(data);
                console.dir(status);
                console.dir(headers);
                console.dir(config);
            });
//        $scope.doc.save().error(function (data, status) {
//            // Do something here.
//            alert("Unable to save");
//        });
        $window.history.back();
    }

    $scope.cancel = function () {
        $window.history.back();
    }

    $scope.keypressCallback = function (event) {
        if (!_.contains($scope.tagchoices, $scope.new_tag)) {
            $scope.tagchoices.push($scope.new_tag);
        }

        $scope.tag_to_add = $scope.new_tag;
        $scope.addTag();
        $scope.new_tag = "";
    }
}

function MyDataController($scope, $http, User, $location) {
    $http.jsonp(mcurljsonpu('/data', User))
        .success(function (data, status) {
            $scope.data_by_user = data;
        });

    $scope.dgroupid = ""

    $scope.editData = function (id) {
        $location.path("/data/edit/" + id);
    }

    $scope.getDatagroup = function (datagroupId) {
        if ($scope.dgroupid != datagroupId) {
            var url = mcurljsonpu2('/datagroup', datagroupId, User);
            $http.jsonp(url)
                .success(function (data, status) {
                    $scope.dgroup = data;
                    $scope.dgroupid = data.id;
                });
        }
    }
}
