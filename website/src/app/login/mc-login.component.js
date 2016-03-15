angular.module('materialscommons')
    .component('mcLogin', {
        templateUrl: 'app/login/mc-login.html',
        controller: MCLoginController
    });

function MCLoginController($state, User, toastr, mcapi, Restangular) {
    'ngInject';

    var ctrl = this;

    ctrl.message = "MCLoginController";
    ctrl.userLogin = "";
    ctrl.password = "";
    ctrl.cancel = cancel;
    ctrl.login = login;

    ////////////////////

    function login() {
        mcapi('/user/%/apikey', ctrl.userLogin, ctrl.password)
            .success(function(u) {
                User.setAuthenticated(true, u);
                Restangular.setDefaultRequestParams({apikey: User.apikey()});
                $state.go('projects.list');
            })
            .error(function(reason) {
                ctrl.message = "Incorrect Password/Username!";
                toastr.error(reason.error, 'Error', {
                    closeButton: true
                });
            }).put({password: ctrl.password});
    }

    function cancel() {
        ctrl.userLogin = "";
        ctrl.password = "";
    }
}

