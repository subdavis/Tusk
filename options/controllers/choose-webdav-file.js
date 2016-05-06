function ChooseWebdavFileController($scope, webdavFileManager) {
    'use strict';

    $scope.form = {
        url: '',
        user: '',
        pass: ''
    };
    $scope.state = webdavFileManager.state;

    $scope.listFiles = function () {
        $scope.busy = true;
        webdavFileManager.listDatabases().then(function (files) {
            $scope.$apply(function () {
                $scope.files = files;
                $scope.busy = false;
            })
        }).catch(function (err) {
            $scope.$apply(function () {
                $scope.busy = false;
            });
        });
    };

    $scope.login = function () {
        webdavFileManager.login($scope).then(function () {
            $scope.listFiles();
        })
    };

    $scope.logout = function () {
        webdavFileManager.logout().then(function () {
            $scope.listFiles();
        });
    };

    $scope.selectFile = function (file) {
        // empty
    };

    $scope.listFiles();
}
