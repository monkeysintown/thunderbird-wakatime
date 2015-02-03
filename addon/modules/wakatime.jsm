/* global Components, Services, AddonManager */

EXPORTED_SYMBOLS = ['WakaTime'];

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

const API_URL = 'https://wakatime.com/api/v1/actions';

// global imports
Cu.import('resource://gre/modules/Services.jsm');

let WakaTime = {

    init: function(data) {

        // module imports
        Cu.import('resource://wakatime/modules/util.jsm');

        this.version = data.version;

        Services.wm.addListener(this.windowListener);
    },
    destroy: function() {
        Services.wm.removeListener(this.windowListener);
        Log.info('Wakatime: destroyed');
    },
    sendHeartbeat: function(file, time, project, language, isWrite, lines) {
        if(this.enoughTimePassed()) {
            Http.send(API_URL, {
                method: 'POST',
                mimeType: 'application/json',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(Prefs.getPref('api_key'))
                },
                onload: function(e) {
                    Log.info("Response Text: " + e.target.responseText);
                },
                onerror: function(e) {
                    Log.info("Error Status: " + e.target.status);
                },
                data: JSON.stringify({
                    time: time/1000,
                    file: file,
                    project: project,
                    language: language,
                    is_write: isWrite ? true : false,
                    lines: lines,
                    plugin: 'thunderbird-wakatime/' + WakaTime.version
                })
            });

            this.lastAction = Date.now();
        }
    },
    enoughTimePassed: function() {
        if(!this.lastAction) {
            this.lastAction = Date.now();
            return true;
        } else {
            return this.lastAction + 120000 < Date.now();
        }
    },
    promptForApiKey: function() {
        // TODO: implement this
        //win.openDialog("chrome://enigmail/content/project.xul", "", "dialog,modal,centerscreen", inputObj, resultObj);
    },
    windowListener: {
        onOpenWindow: function (w) {
            // Wait for the window to finish loading
            let domWindow = w.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
            function _listener() {
                domWindow.removeEventListener('load', _listener, false); //this removes this load function from the window
                //window has now loaded now do stuff to it
                Log.info('window: ' + w + ' - loaded');
            }
            domWindow.addEventListener('load', _listener, false);
        },
        onCloseWindow: function (w) {
            Log.info('window: ' + w + ' - closed');
        },
        onWindowTitleChange: function (w, title) {
            var project = Prefs.getPref('project');
            project = project ? project : 'thunderbird-test';
            WakaTime.sendHeartbeat(title + '.eml', Date.now(), project, 'Email', true, 4);
            Log.info('window: ' + w + ' - title: ' + title);
        }
    }
};
