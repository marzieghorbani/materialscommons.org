'use strict';


function LoginController($scope, $location, $timeout, cornercouch, User, $rootScope) {
    $scope.server = cornercouch();
    $scope.server.session();
    $scope.mcdb = $scope.server.getDB("materialscommons");
    $scope.alerts = [];
    $scope.failedLogin = false;
    $scope.successfulLogin = false;
    //$rootScope.me = User.get_username();
    //$rootScope.user_name = 'Login'

    $scope.login = function () {
        $scope.mcdb.query("materialscommons-app", "mcusers_by_email", {key: $scope.email})
            .success(function () {
                if ($scope.mcdb.rows.length > 0) {
                    console.log("Comparing passwords");
                    var db_password = $scope.mcdb.rows[0].value.password;
                    if (db_password == $scope.password) {
                        $rootScope.email_address = $scope.mcdb.rows[0].value.email;
                        User.setAuthenticated(true, $scope.email);
                        $scope.failedLogin = false;
                        $scope.successfulLogin = true;
                        $scope.connectError = false;
                        $location.path('/user_functions');
                        //$timeout(function() {
                        //  $location.path("#/partials/user_functions/");
                        //}, 2000);
                    } else {
                        $scope.failedLogin = true;
                    }
                } else {
                    $scope.failedLogin = true;
                }
            })
            .error(function () {
                $scope.connectError = true;
            });
    }

    $scope.cancel = function () {
        $location.path("/home");
    }

    $scope.closeAlert = function () {
        $scope.alerts.splice(0, 1);
    }

    $scope.get_user_name = function () {
        $scope.user = User.get_username;
        console.log($scope.user);

    }

}

function LogOutController($scope, $rootScope, User) {
    $rootScope.email_address = '';
    User.setAuthenticated(false, '');
}

function AccountController($scope, $rootScope, $routeParams, cornercouch, $location, flash) {
    $scope.server = cornercouch();
    $scope.server.session();
    $scope.mcdb = $scope.server.getDB("materialscommons");
    $scope.create_account = function () {
        //console.log($scope.user_name) ;
        $scope.new_account = $scope.mcdb.newDoc();
        $scope.new_account.password = $scope.password;
        //$scope.new_account.confirm_password =   $scope.confirm_password;
        $scope.new_account.email = $scope.email;
        //$scope.new_account.confirm_email = $scope.confirm_email;
        $scope.new_account.type = 'mcuser';
        $scope.mcdb.query("materialscommons-app", "mcusers_by_email", {key: $scope.email}).success(function () {
            if ($scope.mcdb.rows.length > 0) {
                alert('Account has already been created using ' + $scope.email);
                $location.path('/create-account');
            }
            else {
                if (($scope.password == $scope.confirm_password) && ($scope.email == $scope.confirm_email)) {
                    $scope.new_account.save();
                    flash("Account Created");
                    $location.path('/login');
                }
                else {
                    alert("Unable to Create Your Account. Confirmation is being entered incorrectly");
                    $location.path('/create-account');
                }

            }
        });
    }
}

function MessagesController($scope, $routeParams, cornercouch) {
    $scope.server = cornercouch();
    $scope.server.session();
    $scope.mcdb = $scope.server.getDB("materialscommons");
    $scope.mcdb.query("materialscommons-app", "recent_events");
}

function ChartController($scope, $routeParams, cornercouch) {
    $scope.server = cornercouch();
    $scope.server.session();
    $scope.mcdb = $scope.server.getDB("materialscommons");
    $scope.chart_data = $scope.mcdb.getDoc("942ecdf121a6f788cc86a10a7e3e8ab6");
}

function FrontPageController($scope, $location) {
    $scope.messages = [];
    $scope.sent = 0;
    $scope.search_key = function () {
        $location.path("/searchindex/search_key/" + $scope.keyword);
    }


//    $scope.server = cornercouch();
//    $scope.server.session();
//    $scope.server.login("testuser", "testing").success(function () {
//        console.log("success");
//    }).error(function () {
//            console.log("in error");
//        });

//    users.create('testuser', 'testing', {roles: ['example']}, function (err) {
//        if (err) {
//            console.log("Error adding user");
//            console.dir(err);
//        }
//    });


//    users.list(function (err, list) {
//        if (err) {
//            console.log("Error retrieving users");
//        }
//        else {
//            console.log("Users: ");
//            console.dir(list);
//        }
//    });

//    $scope.client = ngstomp('http://localhost:15674/stomp');
//    $scope.client.connect("guest", "guest", function(){
//        $scope.client.subscribe("/topic/test", function(message) {
//            $scope.messages.push(message.body);
//            if ($scope.sent == 0) {
//                $scope.client.send("/topic/test", {}, "from AngularStomp");
//                $scope.sent = 1;
//            }
//        });
//    }, function(){}, '/');

}

function HomeController($scope, $http) {
    var hostname = document.location.hostname;
    $scope.news = $http.jsonp(mcurljsonp('/public/news'))
        .success(function (data, status) {
            $scope.news = data;
        }).error(function (data, status, headers, config) {
        });
//    $scope.mcdb = Mcdb.db();
//    $scope.mcdb.query("materialscommons-app", "news_by_date", {descending: true});
}


function DataSearchController($scope, Mcdb, $routeParams, $location) {
    // Nothing to do yet
    $scope.mcdb = Mcdb.db();
    $scope.imageSource = 'assets/img/BrightField.jpg';

    $scope.get_full_data_with_id = function (id) {
        $location.path("/data/data/" + id);

    }
    $scope.get_utc_obj = function (utc_in_sec) {
        var d = new Date(utc_in_sec * 1000);
        return d;
    }

    if ($routeParams.id) {
        $scope.full_data = $scope.mcdb.getDoc($routeParams.id);
    }
}

function ModelsSearchController($scope, $routeParams) {
    // Nothing to do yet
}

function ExploreController($scope, $http) {
    $scope.pageDescription = "Explore";
    $scope.model = [
        {
            name: 'Item 1 Name',
            children: [
                {
                    name: 'Item 2 Name'
                },
                {
                    name: 'Item 3 Name'
                }
            ]
        }
    ];
}

function AboutController($scope) {
    $scope.pageDescription = "About";


}

function ContactController($scope, $routeParams) {
    $scope.pageDescription = "Contact";

}

function HelpController($scope, $routeParams) {
    $scope.pageDescription = "Help";
}

/*
 function UploadFileController($scope,uploadService, $rootScope ){
 $scope.clicked="false";
 $scope.count = 0;
 $scope.addButtonClicked = function(){
 $scope.count = $scope.count + 1;

 alert('in function');
 //var numFiles = $scope.fileList.length;
 //$scope.fileList.push({name: ('fileName' + numFiles)});
 }


 // 'files' is an array of JavaScript 'File' objects.
 $scope.files = [];
 $scope.$watch('files', function (newValue, oldValue) {
 // Only act when our property has changed.
 if (newValue != oldValue) {
 console.log('Controller: $scope.files changed. Start upload.');
 for (var i = 0, length = $scope.files.length; i < length; i++) {
 // Hand file off to uploadService.
 uploadService.send($scope.files[i]);
 }
 }
 }, true);

 $rootScope.$on('upload:loadstart', function () {
 console.log('Controller: on `loadstart`');
 });

 $rootScope.$on('upload:error', function () {
 console.log('Controller: on `error`');
 });


 }
 */

function FileUploadCtrl($scope, $rootScope, uploadManager) {
    $scope.files = [];
    $scope.percentage = 0;

    $scope.upload = function () {
        uploadManager.upload();
        $scope.files = [];
    };

    $rootScope.$on('fileAdded', function (e, call) {
        $scope.files.push(call);
        $scope.$apply();
    });

    $rootScope.$on('uploadProgress', function (e, call) {
        $scope.percentage = call;
        $scope.$apply();
    });

}

function GlobalTagCloudController($scope, $http, User) {
    $http.jsonp(mcurljsonp('/tags/count'))
        .success(function (data) {
            $scope.word_list = [];
            angular.forEach(data, function (tag) {
                $scope.word_list.push({text: tag.name, weight: tag.count, link: "#/tags/data/bytag/" + tag.name + '/' + User.get_username()});
            });
        });
}
