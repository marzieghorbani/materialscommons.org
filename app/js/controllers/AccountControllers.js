function LoginController($scope, $location, User, alertService, decodeAlerts, mcapi) {
    $scope.alerts = [];

    $scope.login = function () {
        mcapi('/user/%/%/apikey', $scope.email, $scope.password)
            .success(function (apikey, status) {
                User.setAuthenticated(true, apikey.apikey, $scope.email);
                $scope.msg = "Logged in Successfully";
                alertService.prepForBroadcast($scope.msg);
                $location.path('/my-tools');
            })
            .error(function (data) {
                $scope.msg = decodeAlerts.get_alert_msg(data.error);
                alertService.prepForBroadcast($scope.msg);
            }).jsonp();
    }

    $scope.cancel = function () {
        $location.path("/home");
    }
}

function LogOutController($scope, $rootScope, $location, $cookieStore, User) {
    $rootScope.email_address = '';
    User.setAuthenticated(false, '', '');
    $location.path('/home');
    $cookieStore.remove('mcuser');
}

function CreateAccountController($scope, mcapi, $location, alertService, decodeAlerts) {

    $scope.create_account = function () {
        if ($scope.password != $scope.confirm_password) {
            //alert("Passwords don't match");
            $scope.msg = "Passwords do not match!"
            alertService.prepForBroadcast($scope.msg);
        }
        else {
            var acc = {};
            acc.email = $scope.email;
            acc.password = $scope.password;
            mcapi('/newuser')
                .success(function (data) {
                    $scope.msg = "Account has been created successfully"
                    alertService.prepForBroadcast($scope.msg);
                    $location.path('/account/login');
                })
                .error(function (data) {
                    console.log('here is ' + data.error);
                    $scope.msg = decodeAlerts.get_alert_msg(data.error);
                    alertService.prepForBroadcast($scope.msg);
                }).post(acc);
        }
    }
}

function AccountDetailsController($scope, mcapi, User) {
    $scope.new_password = undefined;
    $scope.verify_new_password = undefined;

    mcapi('/user/%', User.u())
        .success(function (data) {
            $scope.account = data;
        }).jsonp();

    $scope.saveChanges = function () {
        if ($scope.new_password) {
            if ($scope.new_password == $scope.verify_new_password) {
                mcapi('/user/%/password/%', User.u(), $scope.new_password)
                    .success(function (data) {
                        console.log("password changed!");
                    }).error(function () {
                        console.log("Failed to change password");
                    }).put();
            } else {
                console.log("new passwords don't match");
            }
        }
    }

}

function ApiKeyController($scope, User) {
    $scope.apikey = User.apikey();
}

function ApiKeyResetController($scope, mcapi, User, $cookieStore) {
    mcapi('/user/%/apikey/reset', User.u())
        .success(function (data) {
            $scope.new_apikey = data;
            User.reset_apikey($scope.new_apikey['apikey']);
            var mcuser = $cookieStore.get('mcuser');
            mcuser.apikey = $scope.new_apikey;
            $cookieStore.put('mcuser');
        }).error(function () {
            //console.log("error");
        }).put();

}

