/* global Components, Services, Log, Exec, WakaTime */

'use strict';

const {interfaces: Ci, utils: Cu, classes: Cc} = Components;

// global imports
Cu.import('resource://gre/modules/Services.jsm');

function install(data, reason) {

}

function uninstall(data, reason) {

}

function startup(data, reason) {
    // this is need for bootstrapped extensions; resource directive in chrome.manifest not allowed
    let res = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
    res.setSubstitution("wakatime", data.resourceURI);

    // Add our chrome registration
    Components.manager.addBootstrappedManifestLocation(data.installPath);

    // module imports
    Cu.import("resource://wakatime/modules/util.jsm");
    Cu.import("resource://wakatime/modules/wakatime.jsm");

    File.init();
    Prefs.init();
    WakaTime.init(data);

    //var eventListenerService = Cc["@mozilla.org/eventlistenerservice;1"].getService(Ci.nsIEventListenerService);
    //eventListenerService.addSystemEventListener(handleEvent)
}

function shutdown(data, reason) {
    WakaTime.destroy();

    Components.manager.removeBootstrappedManifestLocation(data.installPath);
    //Services.prompt.alert(null, 'Wakatime', 'Bye, bye World!');
}
