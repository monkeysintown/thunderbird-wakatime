/* global Components, Services, AddonManager, Format, JSON */

EXPORTED_SYMBOLS = ['WakaTime'];

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

const API_URL = 'https://wakatime.com/api/v1';
const API_ACTIONS_URL = API_URL + '/actions';
const API_SUMMARY_DAILY_URL = API_URL + '/summary/daily';

const ONE_DAY = 86400000;

// global imports
Cu.import('resource://gre/modules/Services.jsm');

let WakaTime = {

    init: function(data) {

        // module imports
        Cu.import('resource://wakatime/modules/util.jsm');

        this.version = data.version;

        this.getSummary();

        Services.wm.addListener(this.windowListener);
    },
    destroy: function() {
        Services.wm.removeListener(this.windowListener);
    },
    sendHeartbeat: function(file, time, project, language, isWrite, lines) {
        if(this.enoughTimePassed()) {
            Http.send(API_ACTIONS_URL, {
                method: 'POST',
                mimeType: 'application/json',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(Prefs.getPref('api_key'))
                },
                onload: function(e) {
                    Log.info('Response Text: ' + e.target.responseText);
                },
                onerror: function(e) {
                    Log.info('Error Status: ' + e.target.status);
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
    getSummary: function(callback) {
        var lastUpdated = Prefs.getPref('summary_timestamp');

        Log.info('Summary last: ' + lastUpdated);

        if(lastUpdated+(ONE_DAY/1000) < Date.now()/1000) {
            var today = new Date();
            var yesterday = new Date(today.getTime()-ONE_DAY);

            var start = Format.date(yesterday);
            var end = Format.date(today);

            Http.send(API_SUMMARY_DAILY_URL + '?start=' + start + '&end=' + end, {
                method: 'GET',
                mimeType: 'application/json',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(Prefs.getPref('api_key'))
                },
                onload: function(e) {
                    // cache result
                    Prefs.setPref('summary', e.target.responseText);
                    Prefs.setPref('summary_timestamp', Date.now()/1000); // NOTE: prefs don't store milliseconds
                    if(callback) {
                        callback(JSON.parse(e.target.responseText));
                    }
                },
                onerror: function(e) {
                    Log.info('Error Status: ' + e.target.status);
                }
            });
        } else {
            // return cached values
            if(callback) {
                Log.info('Return cached summary values. ' + lastUpdated);
                callback(JSON.parse(Prefs.getPref('summary')));
            }
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
            project = project ? project : 'Email';
            WakaTime.sendHeartbeat(title + '.eml', Date.now(), project, 'Email', true, 4);
            Log.info('window: ' + w + ' - title: ' + title);
        }
    }
};
