/* global Components, Services, Prefs, Log */

'use strict';

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

// global imports
Cu.import('resource://gre/modules/Services.jsm');

// module imports
Cu.import('resource://wakatime/modules/util.jsm');
Cu.import('resource://wakatime/modules/wakatime.jsm');

let projects = ['one', 'two', 'three', 'four', 'five'];
let index = 0;

function onLoad() {
    // TODO: maybe load the projects
    display();
}

function onUnload() {
    // TODO
}

function start() {
    index = 0;
}

function end() {
    index = projects.length - 1;
}

function next() {
    index++;
    if(index>=projects.length) {
        start();
    }

    display();
}

function previous() {
    index--;
    if(index<0) {
        end();
    }

    display();
}

function edit() {
    console.log('edit');
    // TODO: show input field
}

function escape() {
    window.close();
}

function select() {
    // TODO: set the preference with the current project
    escape();
}

function display() {
    document.getElementById('wt-project').innerHTML = projects[index];
}
