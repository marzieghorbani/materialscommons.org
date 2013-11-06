function CreateUserGroupController($scope, User, mcapi, $location, alertService) {
    $scope.create_usergroup = function () {
        var u_group = {};
        u_group.access = $scope.access;
        u_group.description = $scope.desc;
        u_group.id = $scope.name;
        u_group.name = $scope.name;
        u_group.users = [User.u()];
        u_group.owner = User.u();
        mcapi('/usergroups/new', User.u())
            .success(function (data) {
                $scope.msg = "UserGroup has been created successfully"
                alertService.sendMessage($scope.msg);
                $location.path('/usergroups/my_usergroups');
            })
            .error(function (errorMsg) {
                alertService.sendMessage(errorMsg);
            }).post(u_group);
    }
}

function ListUserGroupController($scope, mcapi, User) {
    mcapi('/user/%/usergroups', User.u())
        .success(function (data) {
            $scope.user_groups = data;
        }).jsonp();
}

function ListUserController($scope, mcapi, $routeParams, $dialog, User, alertService) {
    mcapi('/users')
        .success(function (data) {
            $scope.all_users = data;
        })
        .error(function () {
        }).jsonp();

    $scope.lab_name = $routeParams.usergroup_name;
    mcapi('/usergroup/%', $scope.lab_name)
        .success(function (data) {
            $scope.user_group = data;
            $scope.owner = $scope.user_group.owner
            $scope.signed_in_user = User.u();
        }).jsonp();

    mcapi('/usergroup/%/users', $scope.lab_name)
        .success(function (data) {
            $scope.users_by_usergroup = data.users;
        })
        .error(function () {
        }).jsonp();

    $scope.add_user_to_usergroup = function () {
        var title = '';
        var msg = 'Do you want to add  ' + $scope.user_name + ' to ' + $scope.lab_name + '?';
        var btns = [
            {result: 'no', label: 'no'},
            {result: 'yes', label: 'yes', cssClass: 'btn-primary'}
        ];
        $dialog.messageBox(title, msg, btns)
            .open()
            .then(function (result) {
                if (result == 'yes') {
                    mcapi('/usergroup/%/selected_name/%', $scope.lab_name, $scope.user_name)
                        .success(function (data) {
                            $scope.users_by_usergroup.push(data.id);
                        }).error(function (data) {
                            alertService.sendMessage(data.error);
                        }).put();
                }
            })
    }

    $scope.delete_user_from_usergroup = function (index) {
        var title = '';
        var msg = 'Do you want to delete ' + $scope.users_by_usergroup[index] + ' from ' + $scope.lab_name + '?';
        var btns = [
            {result: 'no', label: 'no'},
            {result: 'yes', label: 'yes', cssClass: 'btn-primary'}
        ];

        $dialog.messageBox(title, msg, btns)
            .open()
            .then(function (result) {
                if (result == 'yes') {
                    mcapi('/usergroup/%/selected_name/%/remove', $scope.lab_name, $scope.users_by_usergroup[index])
                        .success(function (data) {
                            $scope.users_by_usergroup = data;
                        }).error(function () {
                        }).put();
                }
            })
    }
}

