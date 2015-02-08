/* global Components, Services, $ */

EXPORTED_SYMBOLS = ['Ui', 'Headup'];

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

const NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';

const KEYSET_ID = 'wakatime-keyset';
const KEY_ID = 'wakatime-key';

// global imports
Cu.import('resource://gre/modules/Services.jsm');

let Css = {
    stylesheets: [
        'chrome://wakatime/skin/overlay.css'
    ],
    init: function() {
        let styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

        for( let i=0; i<Css.stylesheets.length; i++ ) {
            let styleSheetURI = Services.io.newURI(Css.stylesheets[i], null, null);

            styleSheetService.loadAndRegisterSheet(styleSheetURI, styleSheetService.AUTHOR_SHEET);
            Log.info(styleSheetURI);
        }
    },
    destroy: function() {
        let styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);

        for( let i=0; i<Css.stylesheets.length; i++ ) {
            let styleSheetURI = Services.io.newURI(Css.stylesheets[i], null, null);

            if (styleSheetService.sheetRegistered(styleSheetURI, styleSheetService.AUTHOR_SHEET)) {
                styleSheetService.unregisterSheet(styleSheetURI, styleSheetService.AUTHOR_SHEET);
            }
        }
    }
};

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

let Statusbar = {
    init: function() {
        function Observer() {
            this.register();
        }

        Observer.prototype = {
            observe: function(subject, topic, data) {
                Log.info('Statusbar - s: ' + subject + ' t: ' + topic + ' d: ' + data);
            },
            register: function() {
                var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
                //observerService.addObserver(this, '*', false); // NOTE: just for debugging, very verbose
                observerService.addObserver(this, 'wt-event', false);
            },
            unregister: function() {
                var observerService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
                //observerService.removeObserver(this, '*');
                observerService.removeObserver(this, 'wt-event');
            }
        };

        this.observer = new Observer();
    },
    destroy: function() {
        // TODO: anything to be done here?
    },
    load: function(win) {
        if (!win) return;

        let doc = win.document;

        doc.loadOverlay('chrome://wakatime/content/statusbar.xul', this.observer);
    }
};

let Headup = {
    init: function() {
    },
    observer: {
        observe: function(subject, topic, data) {
            Log.info('Headup - s: ' + subject + ' t: ' + topic + ' d: ' + data);
        }
    },
    show: function() {
        // NOTE: this functions blocks until dialog is closed (modal)
        //Ui.win().openDialog('chrome://wakatime/content/' + name + '.xul', '', 'chrome,centerscreen', timeout);
        //Ui.win().openDialog('chrome://wakatime/content/' + name + '.xul', '', 'dialog,centerscreen', timeout);
        //let AlertService = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
        //AlertService.showAlertNotification('chrome://wakatime/skin/logo.png', 'Wakatime', 'This is a message from Wakatime', true, '', Headup.observer, '');
        try {
            Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService).showAlertNotification(null, 'Wakatime', 'This is a message from Wakatime', false, '', Headup.observer);
        } catch(e) {
            // prevents runtime error on platforms that don't implement nsIAlertsService
            Log.info(e);
        }
    }
};

let Shortcut = {
    load: function(win) {
        Log.info('Shortcut....');
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
            //Headup.show('project', 1000);
            Headup.show();
            Log.info('Shortcut done.');
        }, true);

        let node = $(doc, Ui.app.baseKeyset);

        // http://code.metager.de/source/xref/mozilla/thunderbird/suite/mailnews/compose/messengercompose.xul
        if(!node) {
            node  = $(doc, 'tasksKeys');
        }

        if(node && node.parentNode) {
            Log.info('Shortcut append....');
            node.parentNode.appendChild(keyset).appendChild(key);
        } else {
            Log.info('Shortcut fail!');
        }
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

        // init
        //Css.init();
        Statusbar.init();

        Services.ww.registerNotification(this.windowWatcher);

        // add features to existing windows
        this.eachWindow(function(win) {
            Ui.load(win);
        });
    },
    destroy: function() {
        Statusbar.destroy();
        //Css.destroy();
        Services.ww.unregisterNotification(this.windowWatcher);
    },
    load: function(win) {
        // load into windows
        Shortcut.load(win);
        Statusbar.load(win);
    },
    eachWindow: function (callback) {
        let enumerator = Services.wm.getEnumerator(this.app.winType);
        while (enumerator.hasMoreElements()) {
            let win = enumerator.getNext();
            if (win.document.readyState === 'complete') {
                callback(win);
            } else {
                Ui.runOnLoad(win, callback);
            }
        }
    },
    runOnLoad: function (win, callback) {
        win.addEventListener('load', function __listener() {
            win.removeEventListener('load', __listener, false);

            let winType = win.document.documentElement.getAttribute("windowtype");

            if(winType === Ui.app.winType || winType === 'msgcompose') {
                callback(win);
            } else {
                Log.info('Win Type: ' + winType); // TODO: remove before release
            }
        }, false);
    },
    windowWatcher: function(subject, topic) {
        if(topic === 'domwindowopened') {
            Ui.runOnLoad(subject, Ui.load);
        } else {
            Log.info('Watcher - t: ' + topic);
        }
    },
    win: function() {
        var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
        return wm.getMostRecentWindow(null);
    },
    setTimeout: function(callback, timeout) {
        var timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
        timer.initWithCallback(callback, timeout, Ci.nsITimer.TYPE_ONE_SHOT);
    }
};
