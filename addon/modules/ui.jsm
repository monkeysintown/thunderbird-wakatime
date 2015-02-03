/* global Components, Services, $ */

EXPORTED_SYMBOLS = ['Ui'];

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

const KEYSET_ID = 'wakatime-keyset';
const KEY_ID = 'wakatime-key';

// global imports
Cu.import('resource://gre/modules/Services.jsm');

let Menu = {
    load: function(win) {
        // TODO: ideally no additional menus
    }
};

let Toolbar = {
    load: function(win) {
        // TODO: ideally no additional toolbar buttons
    }
};

let Shortcut = {
    load: function(win) {
        if (!win) return;

        let doc = win.document;

        let keyset = doc.createElementNS(NS_XUL, 'keyset');
        keyset.setAttribute('id', KEYSET_ID);

        let key = doc.createElementNS(NS_XUL, 'key');
        key.setAttribute('id', KEY_ID);
        key.setAttribute('key', Prefs.getPref('shortcut_key'));
        key.setAttribute('modifiers', Prefs.getPref('shortcut_modifiers'));
        key.setAttribute('oncommand', 'void(0);');
        key.addEventListener('command', function() {
            // TODO: implement this
            Log.info('Shortcut called');
        }, true);

        $(doc, Ui.app.baseKeyset).parentNode.appendChild(keyset).appendChild(key)
    }
};

let Ui = {
    init: function() {
        // module imports
        Cu.import('resource://wakatime/modules/util.jsm');

        this.app = {};

        switch(Services.appinfo.name) {
            case 'Thunderbird':
                this.app.winType = 'mail:3pane';
                this.app.baseKeyset = 'mailKeys';
                break;
            case 'Fennec':
                // ignore
                break;
            default:
                //Firefox, SeaMonkey
                this.app.winType = 'navigator:browser';
                this.app.baseKeyset = 'mainKeyset';
        }

        // TODO: load into windows
        this.eachWindow(Shortcut.load);
    },
    eachWindow: function (callback) {
        let enumerator = Services.wm.getEnumerator(this.app.winType);
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (win.document.readyState === 'complete') {
                callback(win);
            } else {
                runOnLoad(win, callback);
            }
        }
    },
    runOnLoad: function (window, callback) {
        window.addEventListener('load', function __listener() {
            window.removeEventListener('load', __listener, false);
            callback(window);
        }, false);
    },
    windowWatcher: function(subject, topic, callback) {
        if (topic === 'domwindowopened') {
            //this.runOnLoad(subject, this.loadIntoWindow);
            callback(subject);
        }
    }
};
