"use strict";

const fs = require('fs');
const path = require('path');

function readdir (path) { // Promise-based version of readdir.
    return new Promise((resolve, reject) => { // Wrap the underlying operation in a promise.
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(files);
            }
        });    
    });
};

function determineType (parentPath, childPath) { // Promise-based function to determine if the path is a file or directory.
    return new Promise((resolve, reject) => {
        fs.stat(path.join(parentPath, childPath), (err, stats) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ 
                    path: childPath,
                    type: stats.isDirectory() ? 'directory' : 'file' // Check if it's a directory or a file.
                }); 
            }
        });
    });
};

function determineTypes (parentPath, paths) { // Async function to determine if child paths are directories or files.

    return Promise.all(
            paths.map(
                childPath => determineType(parentPath, childPath) // Is the path a directory or a file?
            )
        );
};

function readdirTree (rootPath) {
    return readdir(rootPath) // Initial non-recursive directory read.
        .then(childPaths => determineTypes(rootPath, childPaths)) // Filter so we only have paths that are directories.
        .then(children => {
            return Promise.all(children
                .filter(child => child.type === 'directory') // We only care about directories.
                .map(child => {
                    return readdirTree(path.join(rootPath, child.path)) // It's a directory, recurse to the next level down.
                        .then(subTree => {
                            return {
                                path: child.path,
                                subTree: subTree,
                            };
                        });
                })
            );
        })
        .then(children => {
            const tree = {}; // Reorganise the list of directories into a tree.
            children.forEach(directory => {
                tree[directory.path] = directory.subTree;
            });
            return tree;
        });
};

readdirTree("c:\\temp")
    .then(tree => {
        console.log("tree:");
        console.log(tree);
    })
    .catch(err => {
        console.error("error:");
        console.error(err);
    });