/* global Components, Services, Prefs */

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
    Log.info('next');
    if(index<projects.length) {
        index++;
    } else {
        start();
    }

    display();
}

function previous() {
    Log.info('prev');
    if(index>=0) {
        index--;
    } else {
        end();
    }

    display();
}

function edit() {
    Log.info('edit');
    // TODO: show input field
}

function select() {
    Log.info('select');
    // TODO: set the preference with the current project
    document.close();
}

function display() {
    document.getElementById('wt-project').innerHTML = projects[index];
}