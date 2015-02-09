/* global Components, Services, Prefs, Log */

'use strict';

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

// global imports
Cu.import('resource://gre/modules/Services.jsm');

// module imports
Cu.import('resource://wakatime/modules/ui.jsm');
Cu.import('resource://wakatime/modules/util.jsm');
Cu.import('resource://wakatime/modules/wakatime.jsm');

let projects = [];
let index = 0;

function onLoad() {
    refresh();
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

function pause() {
    Prefs.setPref('paused', !Prefs.getPref('paused'));

    if(Prefs.getPref('paused')) {
        setLabels('', 'paused');
    } else {
        setLabels('', 'resumed');
    }

    Ui.setTimeout(function() {
        escape();
    }, 1500);
}

function select() {
    Prefs.setPref('project', projects[index].name);
    escape();
}

function display() {
    if(Prefs.getPref('paused')) {
        setLabels('', 'paused');
    } else {
        setLabels(projects[index].digital, projects[index].name);
    }
}

function setLabels(time, project) {
    document.getElementById('wt-time').innerHTML = time;
    document.getElementById('wt-project').innerHTML = project;
}

function refresh() {
    WakaTime.getSummary(function(data) {
        var tmp = {};
        for(var i=0; i<data.data.length; i++) {
            for(var j=0; j<data.data[i].projects.length; j++) {
                var name = data.data[i].projects[j].name;
                // only once
                if(!tmp[name]) {
                    tmp[name] = true;
                    projects.push(data.data[i].projects[j]);
                }
            }
        }
        tmp = undefined;
        display();
        //Notification.show('WakaTime', 'Project list up to date.');
    });
}
