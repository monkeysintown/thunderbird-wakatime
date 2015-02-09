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
        Statusbar.observer.register();
    },
    observer: {
        register: function() {
            Prefs.register(Statusbar.observer);
        },
        unregister: function() {
            Prefs.unregister(Statusbar.observer);
        },
        observe: function(subject, topic, data) {
            switch (data) {
                case 'project':
                    Statusbar.setLabel(Prefs.getPref('project'));
                    break;
                case 'paused':
                    if(Prefs.getPref('paused')) {
                        Statusbar.setLabel('Paused!');
                    } else {
                        Statusbar.setLabel(Prefs.getPref('project'));
                    }
                    break;
            }
        }
    },
    destroy: function(win) {
        if (!win) return;

        let doc = win.document;

        let statusbar = $(doc, 'status-bar');
        let s = $(doc, 'wt-statusbar');
        statusbar.removeChild(s);
    },
    load: function(win) {
        if (!win) return;

        let doc = win.document;

        doc.loadOverlay('chrome://wakatime/content/statusbar.xul', null);
    },
    setLabel: function(text) {
        Ui.eachWindow(function(win) {
            if (!win) return;

            let doc = win.document;

            let panel = $(doc, 'wt-statusbar-panel-label');

            panel.setAttribute('label', Prefs.getPref('project'));
        });
    }
};

let Notification = {
    show: function(title, message, image) {
        if(!image) {
            image = 'chrome://wakatime/skin/logo.png';
        }
        // more infos here: https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Alerts_and_Notifications
        Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService).showAlertNotification(image, title, message, false, '', null);
    }
};

let Headup = {
    init: function() {
    },
    show: function() {
        try {
            // NOTE: openDialog is more reliable in multi-screen environments (centerscreen)
            /**
            Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher).openWindow(
                null,
                //'chrome://global/content/alerts/alert.xul',
                'chrome://wakatime/content/headup.xul',
                '_blank',
                'chrome=1, centerscreen, titlebar=0, popup=0',
                null);
             */
            Ui.win().openDialog('chrome://wakatime/content/headup.xul', '', 'centerscreen,titlebar=0');
        } catch(e) {
            // prevents runtime error on platforms that don't implement nsIAlertsService
            Log.info(e);
        }
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
            Headup.show();
        }, true);

        // NOTE: this is the best way to find the window elements
        // http://code.metager.de/source/xref/mozilla/thunderbird/suite/mailnews/compose/messengercompose.xul
        let node = $(doc, Ui.app.baseKeyset);

        // msgcompose window
        if(!node) {
            node  = $(doc, 'tasksKeys');
        }

        if(node && node.parentNode) {
            node.parentNode.appendChild(keyset).appendChild(key);
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
        this.eachWindow(function(win) {
            Statusbar.destroy(win);
        });
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
            }
        }, false);
    },
    windowWatcher: function(subject, topic) {
        if(topic === 'domwindowopened') {
            Ui.runOnLoad(subject, Ui.load);
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
