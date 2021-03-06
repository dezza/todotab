addon.port.emit("onload");

function add_tab(tab) {
       tab.title = tab.title.substring(0,27); // truncate 29 first 27 2nd try
       // tablist ul/li
       var ul = document.getElementById('tablist');
       var li = document.createElement('li');
       // append <a>
       var a = document.createElement('a');
       a.setAttribute('class', 'todotab');
       a.setAttribute('href', tab.url);
       a.innerHTML = tab.title; 
       li.appendChild(a);
       // append favicon
       var img_favicon = document.createElement('img');
       img_favicon.setAttribute('alt','');
       img_favicon.setAttribute('class','favicon');
       img_favicon.setAttribute('src',tab.favicon);
       img_favicon.innerHTML = tab.title;

       a.insertBefore(img_favicon, a.firstChild); // Inserts beefore a.innerHTML (so favicon is first)
       // append input checkbox
       var input_checkbox = document.createElement('input');
       input_checkbox.setAttribute('class','checkbox');
       input_checkbox.setAttribute('type','checkbox');
       li.appendChild(input_checkbox);
       // append close button
       var input_close_button = document.createElement('span');
       input_close_button.setAttribute('class','close');
       input_close_button.setAttribute('href',"#");
       input_close_button.innerHTML = "&#10006;";

       li.appendChild(input_close_button);

       ul.appendChild(li);
}

addon.port.on("load_todotabs", function(tabs) {
    console.error("LOADING ...");

    for (var i in tabs) {
        add_tab(tabs[i]);
        console.error("adding: "+tabs[i].url);
    }

    // Event Listeners
    var close_buttons = document.getElementsByClassName('close');
    for (var i=0;i<close_buttons.length;i++) {
        close_buttons[i].addEventListener('click',function() {
            ///alert("deleting: "+this.parentNode.firstChild.href);
            var yes = confirm("Are you sure?");
            if(yes) {
                addon.port.emit("delete_tab",this.parentNode.firstChild.href);
                this.parentNode.parentNode.removeChild(this.parentNode);
                console.error("DELETING FROM CLOSEBUTTON!!!");
            }
        });
    }
    var delete_button = document.getElementById('delete');
    delete_button.addEventListener('click', function() {
        var yes = confirm("Are you sure? Delete all checkboxes.");
        if(yes) {
            var checkboxes = document.getElementsByClassName('checkbox');
            var checkboxes_length = checkboxes.length;

            for (var i=0;i<checkboxes_length;i++) { // TODO Refactor, should be a pop??
                //alert(i+" "+"length:"+checkboxes_length);
                if(checkboxes[i].checked) {
                  console.error("CHECKBOX CHECKED:"+checkboxes[i].checked+" DELETED");
                  console.error("CHECKBOX:"+i+" DELETED");
                  console.error("CHECKBOX PARENT"+checkboxes[i].parentNode);
                  addon.port.emit("delete_tab",checkboxes[i].parentNode.firstChild.href); // check
                  checkboxes[i].parentNode.parentNode.removeChild(checkboxes[i].parentNode);
                }
            }
        }
    })
    // Event Listeners [end]
});

addon.port.on("add_todotab", function(tab) {
       console.error("adding todotab "+tab.title);
       add_tab(tab);
});
