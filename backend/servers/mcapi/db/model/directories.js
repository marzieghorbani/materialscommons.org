const r = require('../r');
const path = require('path');
const dbExec = require('./run');
const db = require('./db');
const model = require('../../../shared/model');
const files = require('./files');
const projects = require('./projects');
const renameHelper = require('./directory-rename');
const getSingle = require('./get-single');

function* get(projectID, directoryID) {
    if (directoryID === "top") {
        return topLevelDir(projectID);
    } else {
        return directoryByID(directoryID);
    }
}

function getByName(projectID, name) {
    let indexKeys = [projectID, name];
    let rql = r.table('datadirs').getAll(indexKeys, {index: 'datadir_project_name'})
        .merge(function (ddir) {
            return {
                files: r.table('datadir2datafile').getAll(ddir('id'), {index: 'datadir_id'})
                    .eqJoin('datafile_id', r.table('datafiles')).zip()
                    .filter({current: true})
                    .coerceTo('array'),
                directories: r.table('datadirs').getAll(ddir('id'), {index: 'parent'}).coerceTo('array')
            }
        });
    return dbExec(rql).then(results => toDir(results[0]));
}

function* getAll(projectId) {
    return yield r.table('project2datadir')
        .getAll(projectId, {index: 'project_id'})
        .eqJoin('datadir_id', r.db('materialscommons').table('datadirs')).zip()
        .pluck('name', 'id').orderBy('name');
}

function topLevelDir(projectID) {
    let rql = r.table('projects').getAll(projectID)
        .eqJoin('name', r.table('datadirs'), {index: 'name'}).zip()
        .eqJoin('id', r.table('project2datadir'), {index: 'datadir_id'}).zip()
        .filter({'project_id': projectID})
        .merge(function(ddir) {
            return {
                files: r.table('datadir2datafile').getAll(ddir('datadir_id'), {index: 'datadir_id'})
                    .eqJoin('datafile_id', r.table('datafiles')).zip()
                    .filter({current: true})
                    .coerceTo('array'),
                directories: r.table('datadirs').getAll(ddir('datadir_id'), {index: 'parent'}).coerceTo('array')
            }
        });
    return dbExec(rql).then(results => toDir(results[0]));
}

function directoryByID(directoryID) {
    let rql = r.table('project2datadir').getAll(directoryID, {index: 'datadir_id'})
        .eqJoin('datadir_id', r.table('datadirs')).zip()
        .merge(function(ddir) {
            return {
                files: r.table('datadir2datafile').getAll(ddir('datadir_id'), {index: 'datadir_id'})
                    .eqJoin('datafile_id', r.table('datafiles')).zip()
                    .filter({current: true})
                    .coerceTo('array'),
                directories: r.table('datadirs').getAll(ddir('datadir_id'), {index: 'parent'}).coerceTo('array')
            }
        });
    return dbExec(rql).then(results => toDir(results[0]));
}

function toDir(results) {
    let dir = {
        otype: 'directory',
        id: results.datadir_id ? results.datadir_id : results.id,
        size: 0,
        name: path.basename(results.name),
        path: results.name,
        mtime: results.mtime,
        checksum: "",
        children: [],
        shortcut: results.shortcut,
    };

    dir.children = results.files.map(f => {
        return {
            otype: 'file',
            size: f.size,
            name: f.name,
            path: path.join(dir.path, f.name),
            mediatype: f.mediatype,
            checksum: f.checksum,
            mtime: f.mtime,
            id: f.id,
            usesid: f.usesid,
            shortcut: false,
        };
    });

    let childrenDirs = results.directories.map(d => {
        return {
            otype: 'directory',
            id: d.id,
            size: 0,
            mtime: d.mtime,
            name: path.basename(d.name),
            path: d.name,
            checksum: "",
            shortcut: d.shortcut
        };
    });

    dir.children = dir.children.concat(childrenDirs);

    return dir;
}

// create will create a directory path. It will create all children in the path, skipping
// any entries that exist. Starting paths can be specified in 3 different ways:
// from_dir is an id => start creating directories starting from id
// from_dir == '/' => start creating directories starting from project root
// from_dir == /path/of/directories' => start creating directories from leaf (must be valid)
function* create(projectID, projectName, dirArgs) {
    if (dirArgs.from_dir.startsWith('/')) {
        return yield createFromPath(projectID, projectName, dirArgs);
    } else {
        return yield createFromDirID(projectID, dirArgs);
    }
}

function* createFromDirID(projectID, dirArgs) {
    let startingDir = yield dirById(dirArgs.from_dir, projectID);
    if (!startingDir) {
        return {
            error: `directory id ${dirArgs.from_dir} not found`
        };
    }
    let created = yield createDirs(projectID, startingDir, dirSegments(dirArgs.path));
    return {
        val: created
    };
}

function* dirByPath(projectID, dirPath) {
    let rql = r.table('datadirs').getAll(dirPath, {index: 'name'}).filter({project: projectID});
    let dirs = yield dbExec(rql);
    if (dirs.length) {
        return dirs[0];
    }
    return null;
}

function* dirById(dirID) {
    let dir = yield getSingle(r, 'datadirs', dirID);
    if (!dir) {
        return null;
    }
    return dir;
}

function* createFromPath(projectID, projectName, dirArgs) {
    let dirPath = dirArgs.from_dir === '/' ? projectName : projectName + dirArgs.from_dir;
    let startingDir = yield dirByPath(projectID, dirPath);
    if (!startingDir) {
        return {
            error: `invalid dir path ${dirArgs.from_dir}`
        }
    }

    let created = yield createDirs(projectID, startingDir, dirSegments(dirArgs.path));
    return {
        val: created
    };
}

function dirSegments(from) {
    let cleaned = trimStartingSlashes(from);
    return cleaned.split('/');
}

function trimStartingSlashes(from) {
    while (from.charAt(0) === '/') {
        from = from.substr(1);
    }
    return from;
}

function* createDirs(projectID, startingDir, dirSegments) {
    let existing = true;
    let dirPath = startingDir.name;
    let dirEntry = startingDir;
    let createdDirs = [];
    for (let pathEntry of dirSegments) {
        dirPath = dirPath + '/' + pathEntry;
        if (!existing) {
            // if we encountered an unknown dir then all dirs afterward are
            // unknown and can just be created.
            dirEntry = yield insertDir(projectID, dirEntry.id, dirEntry.owner, dirPath);
            createdDirs.push(dirEntry);
        } else {
            // Check if dir exists, if it does continue checking, if not
            // create it, set dirEntry to newly created (so we have a parent),
            // and set existing to false so that all subsequent loop iterations
            // will simply create the path.
            let newDirEntry = yield dirByPath(projectID, dirPath);
            if (!newDirEntry) {
                existing = false;
                dirEntry = yield insertDir(projectID, dirEntry.id, dirEntry.owner, dirPath);
                createdDirs.push(dirEntry);
            } else {
                dirEntry = newDirEntry;
                createdDirs.push(dirEntry);
            }
        }
    }
    return createdDirs;
}

function* insertDir(projectID, parentID, owner, dirPath) {
    let dir = new model.Directory(dirPath, owner, projectID, parentID);
    let newDir = yield db.insert('datadirs', dir);
    let proj2dir = new model.Project2DataDir(projectID, newDir.id);
    yield db.insert('project2datadir', proj2dir);
    return newDir;
}

function* update(projectID, directoryID, updateArgs) {
    let guard = yield isTopLevelDir(projectID, directoryID);
    if (guard) {
        return {
            error: "Can not move or rename top level directory"
        }
    }
    if (updateArgs.move) {
        return yield moveDirectory(projectID, directoryID, updateArgs.move);
    } else {
        return yield renameDirectory(directoryID, updateArgs.rename);
    }
}

function* updateShortcut(directoryId, shortcut) {
    yield r.table('datadirs').get(directoryId).update({shortcut: shortcut});
    return yield directoryByID(directoryId);
}

function* isTopLevelDir(projectID, directoryID) {
    let projectNameData = yield r.table('projects').get(projectID).pluck('name');
    let directoryNameData = yield r.table('datadirs').get(directoryID).pluck('name');
    return (projectNameData.name === directoryNameData.name);
}

function* moveDirectory(projectID, directoryID, moveArgs) {
    // Validate that the new directory is in the project
    let findDirRql = r.table('project2datadir')
        .getAll([projectID, moveArgs.new_directory_id], {index: 'project_datadir'});
    let matches = yield dbExec(findDirRql);
    if (!matches.length) {
        return {error: 'Directory not in project'};
    }

    let newDir = yield dbExec(r.table('datadirs').get(moveArgs.new_directory_id));
    let updateDir = yield dbExec(r.table('datadirs').get(directoryID));
    let currentPath = updateDir.name;

    let updateFields = {
        name: path.join(newDir.name, path.basename(updateDir.name)),
        parent: newDir.id
    };
    let newPath = updateFields.name;

    yield r.table('datadirs').get(directoryID).update(updateFields);

    let directoryList = yield r.table('datadirs').getAll(directoryID, {index: 'parent'});
    if (directoryList && directoryList.length > 0) {

        let directoryIdSet = new Set();

        for (let i = 0; i < directoryList.length; i++) {
            directoryIdSet.add(directoryList[i].id);
        }

        let size = directoryIdSet.size;
        let oldSize = 0;
        while (size !== oldSize) {
            oldSize = size;
            directoryList = yield r.table('datadirs').getAll(r.args([...directoryIdSet]), {index: 'parent'});
            for (let i = 0; i < directoryList.length; i++) {
                directoryIdSet.add(directoryList[i].id);
            }
            size = directoryIdSet.size;
        }

        directoryList = yield r.table('datadirs').getAll(r.args([...directoryIdSet]));
        for (let i = 0; i < directoryList.length; i++) {
            let directory = directoryList[i];
            directory.name = directory.name.replace(currentPath, newPath);
        }

        yield r.table('datadirs').insert(directoryList, {conflict: 'update'});
    }

    let rv = {};
    rv.val = yield directoryByID(directoryID);
    return rv;
}

function* renameDirectory(directoryID, renameArgs) {
    let newName = renameArgs.new_name;
    yield renameHelper.renameDirectory(directoryID, newName);

    let rv = {};
    rv.val = yield directoryByID(directoryID);
    return rv;
}

function findInProject(projectID, _key, dir) {
    if (dir.startsWith('/')) {
        return dbExec(r.table('datadirs').getAll(dir, {index: 'name'}))
            .then(function(d) {
                return dbExec(r.table('project2datadir').getAll([projectID, d.id], {index: 'project_datadir'}));
            });
    } else {
        return r.table('project2datadir').getAll([projectID, dir], {index: 'project_datadir'}).run();
    }
}

function subdirExists(dirID, subdirName) {
    let rql = r.table('datadirs').getAll(dirID, {index: 'parent'}).filter({name: subdirName});
    return dbExec(rql);
}

function peerDirectories(dirID) {
    let rql = r.table('datadirs').get(dirID).merge(function(dir) {
        return {
            peer_directories: r.table('datadirs').getAll(dir('id'), {index: 'parent'}).coerceTo('array')
        }
    });
    return dbExec(rql);
}

function* ingestSingleLocalFile(projectId, directoryId, userId, args) {
    let filename = args.name;
    let checksum = args.checksum;
    //let mediatype = args.mediatype;
    //let filesize = args.filesize;
    //let filePath = args.filepath;

    let file = yield fileInDirectoryByName(directoryId, filename);

    if (!file || !(file.checksum === checksum)) {
        args.parent = file;
        file = yield files.fetchOrCreateFileFromLocalPath(userId, args);

        yield addFileToDirectory(directoryId, file.id);
        yield projects.addFileToProject(projectId, file.id);
    } else {
        yield files.clearUploadedFileByLocalPath(args);
    }

    return file;
}

function* addFileToDirectory(dirID, fileID) {
    let link = new model.DataDir2DataFile(dirID, fileID);
    yield r.table('datadir2datafile').insert(link);
}

function* fileInDirectoryByName(dirId, filename) {
    let matches = yield r.table('datadir2datafile')
        .getAll(dirId, {index: 'datadir_id'})
        .eqJoin('datafile_id', r.table('datafiles'))
        .without({left: "id", left: "datafile_id", left: "datadir_id"})
        .zip().filter({name: filename, current: true});
    if (matches) return matches[0];
    else return {}
}

function* isEmpty(dirID) {
    let childrenDirs = yield dbExec(r.table('datadirs').getAll(dirID, {index: 'parent'}));
    if (childrenDirs.length) {
        return false;
    }

    let childrenFiles = yield dbExec(r.table('datadir2datafile').getAll(dirID, {index: 'datadir_id'})
        .eqJoin('datafile_id', r.table('datafiles')).zip().filter({current: true}));
    return childrenFiles.length === 0;
}

function* remove(projectID, dirID) {
    let guard = yield isTopLevelDir(projectID, dirID);
    if (guard) {
        return {
            error: "Can not delete top level directory"
        }
    }
    let rv = yield r.table('datadirs').get(dirID).delete();
    if (!rv || !rv.deleted) {
        return {error: 'Unable to delete'};
    }

    rv = yield r.table('project2datadir').getAll([projectID, dirID], {index: 'project_datadir'}).delete();
    if (!rv || !rv.deleted) {
        return {error: 'Unable to delete'};
    }

    return {val: true};
}

module.exports = {
    get,
    getAll,
    getByName,
    create,
    update,
    findInProject,
    subdirExists,
    peerDirectories,
    ingestSingleLocalFile,
    addFileToDirectory,
    fileInDirectoryByName,
    isEmpty,
    remove,
    updateShortcut,
};
