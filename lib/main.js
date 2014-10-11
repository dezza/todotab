var window = require("sdk/window/utils").getMostRecentBrowserWindow();
var data = require('sdk/self').data; // resource:// uri generation
// IDEAS
// TODO duplicate add puts tab first in list (needs ordering)
// TODO about:newtab
// TODO backup file?
// empty favicons fuck up!

// main object (url dictionary)
var todo_tabs = [];
var DEBUG = false;
                    
var { env } = require('sdk/system/environment');
var filename_save = env.HOME+"/todotabs_backup";

/* utility functions */
function readFile(filename) {
  var fileIO = require("sdk/io/file");
  var text = null;
  if (fileIO.exists(filename)) {
    var TextReader = fileIO.open(filename, "r");
    if (!TextReader.closed) {
      text = TextReader.read();
      TextReader.close();
    }
  }
  return text;
}

function writeFile(text, filename) {
  var fileIO = require("sdk/io/file");
  var TextWriter = fileIO.open(filename, "w");
  if (!TextWriter.closed) {
    TextWriter.write(text);
    TextWriter.close();
  }
}
/* utility functions [end] */

/*
 * Todotabs CRUD & utility
 */
function newTodotab(title, url, icon) {
  var dict = {"url": url, "title": title, "favicon": icon}
  todo_tabs[todo_tabs.length] = dict;

  // write the file for safety & backup
  writeFile(JSON.stringify(todo_tabs), filename_save);
}
function deleteTodotab(url) {
  var target = findTabNumByURL(url); 
  if(target) {
    todo_tabs.splice(target, 1); // remove 1 from index (target)
  }
  writeFile(JSON.stringify(todo_tabs), filename_save);
}

function findTabNumByURL(url) {
  for (var i in todo_tabs) {
    if(todo_tabs[i].url == url) {
      return i;
    }
  }
  return false;
}
function duplicate(url) {
  if(findTabNumByURL(url))
    return true;
  return false;
}
function printTodotabs() {
  text = "";
  for(var i in todo_tabs) {
    // TODO check for "undefined" title or url
    text = text+todo_tabs[i].title+" : "+todo_tabs[i].url+"\n"
      //console.error(text);
  }
  return text;
}
/* todotabs [end] */


/* port workers (communicate between sidebar.js / main.js) */
var workers = [];

function attachWorker(worker) {
  workers.push(worker);
}
function detachWorker(worker) {
  var index = workers.indexOf(worker);
  if(index != -1) {
    workers.splice(index, 1);
  }
}
/* port workers [end] */

// sidebar and events
var sidebar = require("sdk/ui/sidebar").Sidebar({
  id: 'todotabbar',
    title: 'todotab sidebar',
    contentScriptFile: data.url("sidebar.js"),
    url: require("sdk/self").data.url("sidebar.html"),

    onDetach: detachWorker,
    
    // Events
    onAttach: function (worker) {
      worker.port.on("onload", function() { // we send a signal from sidebar.js to signal load done, and send signal back to load tabs.
        /* recover saved file when loading */
        saved_tabs = JSON.parse(readFile(env.HOME+"/bollerogkakao"));
        if (saved_tabs) {
          todo_tabs = saved_tabs; 
        }

        worker.port.emit("load_todotabs", todo_tabs);
        //worker.port.emit("pong");
      });
      worker.port.on("delete_tab", function(url) {
        console.error("DELETING (not implemented): "+url);
        deleteTodotab(url);
      });
      attachWorker(worker);
    }
});


//var workers_main = [];
//
//function attachWorker_main(worker) {
//  workers.push(worker);
//}
//function detachWorker_main(worker) {
//  var index = workers.indexOf(worker);
//  if(index != -1) {
//    workers_main.splice(index, 1);
//  }
//}
//
//var pagemod = require("sdk/page-mod").PageMod({
//    contentScriptFile: data.url("pagemod.js"),
//    include: require("sdk/self").data.url("index.html"),
//
//    onDetach: detachWorker,
//    
//    // Events
//    onAttach: function (worker) {
//      worker.port.on("onload_main", function() { // we send a signal from pagemod.js to signal load done, and send signal back to load tabs.
//        /* recover saved file when loading */
//        saved_tabs = JSON.parse(readFile(env.HOME+"/bollerogkakao"));
//        if (saved_tabs) {
//          todo_tabs = saved_tabs; 
//        }
//
//        worker.port.emit("load_todotabs_main", todo_tabs);
//        //worker.port.emit("pong");
//      });
//      worker.port.on("delete_tab_main", function(url) {
//        console.error("DELETING (not implemented): "+url);
//        deleteTodotab(url);
//        // TODO: remove from todo_tabs collection (add function) 
//      });
//      attachWorker(worker);
//    }
//});



exports.main = function (options, callbacks) {
  // hide and show to avoid corruption for now //FIXME try what works best TODO
  sidebar.hide();
  sidebar.show();

  console.error("TODOTAB STARTED");

  // require window/utils
  let menu = window.document.getElementById("tabContextMenu");
  let right_click_tab_context = window.document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","menuitem");
  right_click_tab_context.setAttribute("id", "contexttab-right_click_tab_context");
  right_click_tab_context.setAttribute("label", "Todotab");
  right_click_tab_context.setAttribute("accesskey", "T");

  // addEventListener on tabContextMenu apparently works. so it must do for all other objects in browser.xul as well
  right_click_tab_context.addEventListener('command', function() {
    var selected_tab = window.gBrowser.mContextTab;
    var selected_tab_url = window.gBrowser.mContextTab.linkedBrowser.currentURI.spec;
    var selected_tab_favicon = window.gBrowser.mContextTab.linkedBrowser.mIconURL;
    var selected_tab_title = window.gBrowser.mContextTab.label;
    //console.error("REACHED ADD TAB HANDLER !!!!!!!!!");
    //console.error(selected_tab_url); // TODO URL to save in list in sidebar.html/js
    workers.forEach(worker => {
      if(duplicate(selected_tab_url) == false) {
        worker.port.emit("add_todotab", {'url': selected_tab_url, 'title': selected_tab_title, 'favicon': selected_tab_favicon}) //window.gBrowser.todotab); // works, test method
        newTodotab(selected_tab_title, selected_tab_url, selected_tab_favicon);
      if(!DEBUG) // don't delete if we're not the dev, we might loose something, haha.
      window.gBrowser.removeTab(selected_tab);
  // close tab TODO
      } else {
        console.error("!! duplicate tab !!");
      }
      //console.error(todo_tabs);
      printTodotabs();
    })
  });
  menu.insertBefore(right_click_tab_context, menu.firstChild); // put "todotab"
  //   }
}

exports.onUnload = function (reason) {
  // reason uninstall,disable,shutdown,upgrade,downgrade
  let menu = window.document.getElementById("tabContextMenu");
  let right_click_tab_context = window.document.getElementById("contexttab-right_click_tab_context");
  menu.removeChild(right_click_tab_context);
  //console.debug("HEY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("TODOTAB UNLOADED");
  // remove
};
