module.exports = function(r) {
    return {
        createDirsFromParent: require('./create-dir')(r),
        deleteDirsAndFilesInDirectoryFromProject: require('./delete')(r),
        addFileToDirectoryInProject: require('./file-upload')(r),
    };
};