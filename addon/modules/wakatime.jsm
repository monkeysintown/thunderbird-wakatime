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
        this.lastAction = Date.now();

        Services.wm.addListener(this.windowListener);

        Log.info('Wakatime: ready - ' + data.id + ' - ' + WakaTime.version);
    },
    destroy: function() {
        Services.wm.removeListener(this.windowListener);
        Log.info('Wakatime: destroyed');
    },
    sendHeartbeat: function(file, time, project, language, isWrite, lines) {
        let request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
        request.overrideMimeType('application/json');
        request.open('POST', API_URL, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', 'Basic ' + btoa(Prefs.getPref('api_key')));
        request.onload = function(e) {
            Log.info("Response Text: " + e.target.responseText);
        };
        request.onerror = function(aEvent) {
            Log.info("Error Status: " + aEvent.target.status);
        };
        request.send(JSON.stringify({
            time: time/1000,
            file: file,
            project: project,
            language: language,
            is_write: isWrite ? true : false,
            lines: lines,
            plugin: 'thunderbird-wakatime/' + WakaTime.version
        }));
    },
    enoughTimePassed: function() {
        return this.lastAction + 120000 < Date.now();
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
            // TODO: get document stats; improve this
            WakaTime.sendHeartbeat(title + '.eml', Date.now(), 'thunderbird-test', 'Email', true, 4);

            Log.info('window: ' + w + ' - title: ' + title);
        }
    }
};
