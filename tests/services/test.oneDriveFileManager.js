describe('OneDrive file manager', function () {

    var fileManager, $httpBackend, $q, $rootScope;
    var oneDriveUrl = 'https://api.onedrive.com/v1.0/drive/root/view.search?q=kdb&filter=file%20ne%20null';

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');

        var settings = {
            getAccessToken: function () {
                return $q.when('token');
            }
        };

        var $http = $injector.get('$http');
        fileManager = new OneDriveFileManager($http, $q, settings);
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('listDatabases', function () {

        it('should return an array of files', function (done) {
            $httpBackend.whenGET(oneDriveUrl).respond({
                value: [{
                    name: 'file1.kdb',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'http://url/to/file1.kdb'
                }, {
                    name: 'file2.kdbx',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'http://url/to/file2.kdbx'
                }]
            });

            fileManager.listDatabases().then(function (files) {
                files.should.eql([
                    { title: '/Documents/file1.kdb', url: 'http://url/to/file1.kdb' },
                    { title: '/Documents/file2.kdbx', url: 'http://url/to/file2.kdbx' }
                ]);
                done();
            });

            $rootScope.$digest();
            $httpBackend.flush();
        });

        it('should exclude non kdb or kdbx files', function (done) {
            $httpBackend.whenGET(oneDriveUrl).respond({
                value: [{
                    name: 'file1.kdb',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'http://url/to/file1.kdb'
                }, {
                    name: 'somefile.txt',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'http://url/to/somefile.txt'
                }, {
                    name: 'a file with .kdb or .kdbx in its name.txt',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'http://url/to/a file with .kdb or .kdbx in its name.txt'
                }, {
                    name: 'a file with a similar extension.kdby',
                    parentReference: { path: '/drive/root:/Documents' },
                    '@content.downloadUrl': 'a file with a similar extension.kdby'
                }]
            });

            fileManager.listDatabases().then(function (files) {
                files.should.eql([
                    { title: '/Documents/file1.kdb', url: 'http://url/to/file1.kdb' }
                ]);
                done();
            });

            $rootScope.$digest();
            $httpBackend.flush();
        });

        it('should still produce a proper title if there is no parentReference attribute from onedrive response', function (done) {
            $httpBackend.whenGET(oneDriveUrl).respond({
                value: [{
                    name: 'file1.kdb',
                    '@content.downloadUrl': 'http://url/to/file1.kdb'
                }]
            });

            fileManager.listDatabases().then(function (files) {
                files.should.eql([
                    { title: 'file1.kdb', url: 'http://url/to/file1.kdb' },
                ]);
                done();
            });

            $rootScope.$digest();
            $httpBackend.flush();
        });

        it('should still produce a proper title if the parentReference path from onedrive response is in an unexpected format', function (done) {
            $httpBackend.whenGET(oneDriveUrl).respond({
                value: [{
                    name: 'file1.kdb',
                    parentReference: { path: '/Documents' },
                    '@content.downloadUrl': 'http://url/to/file1.kdb'
                }]
            });

            fileManager.listDatabases().then(function (files) {
                files.should.eql([
                    { title: '/Documents/file1.kdb', url: 'http://url/to/file1.kdb' },
                ]);
                done();
            });

            $rootScope.$digest();
            $httpBackend.flush();
        });

        it('should produce a proper filepath if onedrive path already contains a trailing slash', function (done) {
            $httpBackend.whenGET(oneDriveUrl).respond({
                value: [{
                    name: 'file1.kdb',
                    parentReference: { path: '/drive/root:/Documents/' },
                    '@content.downloadUrl': 'http://url/to/file1.kdb'
                }]
            });

            fileManager.listDatabases().then(function (files) {
                files.should.eql([
                    { title: '/Documents/file1.kdb', url: 'http://url/to/file1.kdb' },
                ]);
                done();
            });

            $rootScope.$digest();
            $httpBackend.flush();
        });
    });
});
