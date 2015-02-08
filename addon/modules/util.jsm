/* global Components, Services, PREF_STRING, PREF_INT, PREF_BOOL, PREF_INVALID */

EXPORTED_SYMBOLS = ['Log', 'Prefs', 'File', 'Exec', 'Http', '$'];

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

const Application = Cc['@mozilla.org/steel/application;1'].getService(Ci.steelIApplication);

Cu.import('resource://gre/modules/osfile.jsm');

let Log = {
    info: function(msg) {
        Application.console.log(msg);
    }
};

let Exec = {
    run: function(exe, args) {
        // create an nsIFile for the executable
        var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
        file.initWithPath(exe);

        // create an nsIProcess
        var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
        process.init(file);

        // Run the process.
        // If first param is true, calling thread will be blocked until
        // called process terminates.
        // Second and third params are used to pass command-line arguments
        // to the process.
        process.run(false, args, args.length);
    }
};

let File = {
    init: function () {
        //this.decoder = new TextDecoder();
    },
    read: function(file) {
        return OS.File.read(file, { encoding: 'utf-8' });
    }
};

let Prefs = {
    prefs: null,
    init: function()
    {
        Prefs.prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('extensions.wakatime.');

        if(!Prefs.hasPref('config_file')) {
            Prefs.setPref('config_file', OS.Constants.Path.homeDir + '/.wakatime.cfg');
        }

        if(!Prefs.hasPref('api_key')) {
            File.read(Prefs.getPref('config_file')).then(function(text) {
                var config = Prefs.map(text);
                for (var property in config) {
                    if (config.hasOwnProperty(property)) {
                        Prefs.setPref(property, config[property]);
                    }
                }
            });
        }

        if(!Prefs.hasPref('shortcut_key')) {
            Prefs.setPref('shortcut_key', 'w');
        }
        if(!Prefs.hasPref('shortcut_modifiers')) {
            Prefs.setPref('shortcut_modifiers', 'alt');
        }
    },
    hasPref: function(key) {
        if(Prefs.prefs.getPrefType(key)) {
            return true;
        } else {
            return false;
        }
    },
    getPref: function(key) {
        var type = Prefs.prefs.getPrefType(key);

        switch(type) {
            case Ci.nsIPrefBranch.PREF_STRING:
                return this.prefs.getCharPref(key);
            case Ci.nsIPrefBranch.PREF_INT:
                return this.prefs.getIntPref(key);
            case Ci.nsIPrefBranch.PREF_BOOL:
                return this.prefs.getBoolPref(key);
            default :
                return null;
        }
    },
    setPref: function(key, value) {
        var type = Prefs.prefs.getPrefType(key);

        switch(type) {
            case Ci.nsIPrefBranch.PREF_STRING:
                this.prefs.setCharPref(key, value);
                break;
            case Ci.nsIPrefBranch.PREF_INT:
                this.prefs.setIntPref(key, value);
                break;
            case Ci.nsIPrefBranch.PREF_BOOL:
                this.prefs.setBoolPref(key, value);
                break;
        }
    },
    map: function(text) {
        var lines = text.replace(/\r/g, '').split('\n');
        var regex = /([a-z_]*)\s*=\s*([a-z0-9\-]*)/g;

        var result = {};

        // skip first line
        for(var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            if(line.indexOf('[')===-1) {
                var pair = regex.exec(line);
                if(pair) {
                    result[pair[1]] = pair[2];
                }
            }
        }

        return result;
    }
};

let Http = {
    send: function(url, options) {
        if(!options) {
            options = {};
        }
        let request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance(Ci.nsIXMLHttpRequest);
        if(options.mimeType) {
            request.overrideMimeType(options.mimeType);
        }
        request.open(options.method ? options.method : 'GET', url, true);
        if(options.headers) {
            for(var property in options.headers) {
                if (options.headers.hasOwnProperty(property)) {
                    request.setRequestHeader(property, options.headers[property]);
                }
            }
        }
        if(options.onload) {
            request.onload = options.onload;
        }
        if(options.onerror) {
            request.onerror = options.onerror;
        }
        request.send(options.data);
    }
};

function $(node, childId) {
    if (node.getElementById) {
        return node.getElementById(childId);
    } else {
        return node.querySelector("#" + childId);
    }
}