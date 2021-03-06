"use strict";
/*global jQuery:false */
/*global fromplug:false */
/*global Nodes:false */
/*global NodeIDs:false */
/*global Links:false */
/*global LinkIDs:false */
/*global document:false */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */

// global variable for sub-window reference
var newWindow;

// seed the help text. Done in a big lump here, so we could make a foreign language version someday.

var helptexts = {
    "link_target": 'Where should Weathermap get data for this link? This can either be an RRD file, or an HTML with special comments in it (normally from MRTG).',
    "link_width": 'How wide the link arrow will be drawn, in pixels.',
    "link_infourl":
        'If you are using the \'overlib\' HTML style then this is the URL that will be opened when you click on the link',
    "link_hover":
        'If you are using the \'overlib\' HTML style then this is the URL of the image that will be shown when you hover over the link',
    "link_bandwidth_in": "The bandwidth from the first node to the second node",
    "link_bandwidth_out": "The bandwidth from the second node to the first node (if that is different)",
    "link_commentin": "The text that will appear alongside the link",
    "link_commentout": "The text that will appear alongside the link",

    "node_infourl":
        'If you are using the \'overlib\' HTML style then this is the URL that will be opened when you click on the node',
    "node_hover":
        'If you are using the \'overlib\' HTML style then this is the URL of the image that will be shown when you hover over the node',
    "node_x": "How far from the left to position the node, in pixels",
    "node_y": "How far from the top to position the node, in pixels",
    "node_label": "The text that appears on the node",
    "node_new_name": "The name used for this node when defining links",

    "tb_newfile": 'Change to a different file, or start creating a new one.',
    "tb_addnode": 'Add a new node to the map',
    "tb_addlink": 'Add a new link to the map, by joining two nodes together.',

    "hover_tb_newfile": 'Select a different map to edit, or start a new one.',

// These are the default text - what appears when nothing more interesting
// is happening. One for each dialog/location.
    "link_default": 'This is where help appears for links',
    "map_default": 'This is where help appears for maps',
    "node_default": 'This is where help appears for nodes',
    "tb_default": 'or click a Node or Link to edit it\'s properties'
};



function hide_all_dialogs() {
    jQuery(".dlgProperties").hide();
}



// used by the Submit button on each of the properties dialogs
function do_submit() {
    document.frmMain.submit();
}

function openPickerWindow(url) {
    // make sure it isn't already opened
    if (!newWindow || newWindow.closed) {
        newWindow = window.open("", "openCactiPicker", "scrollbars=1,status=1,height=400,width=400,resizable=1");
    } else if (newWindow.focus) {
        // window is already open and focusable, so bring it to the front
        newWindow.focus();
    }

    newWindow.location = url;
}

function openCactiPicker() {
    openPickerWindow("cacti-pick.php?command=link_step1");
}


function openNodeCactiPicker() {
    openPickerWindow("cacti-pick.php?command=node_step1");
}

function show_context_help(itemid, targetid) {
    var helpbox, helpboxtext, message;

    message = "We'd show helptext for " + itemid + " in the'" + targetid + "' div";
    helpbox = document.getElementById(targetid);
    helpboxtext = helpbox.firstChild;
    helpboxtext.nodeValue = message;
}

function mapmode(m) {
    if (m === 'xy') {
        document.getElementById('debug').value = "xy";
        document.getElementById('xycapture').style.display = 'inline';
        document.getElementById('existingdata').style.display = 'none';
    } else if (m === 'existing') {
        document.getElementById('debug').value = "existing";
        document.getElementById('xycapture').style.display = 'none';
        document.getElementById('existingdata').style.display = 'inline';
    } else {
        alert('invalid mode');
    }
}



// used by the cancel button on each of the properties dialogs
function cancel_op() {
    hide_all_dialogs();
    jQuery("#action").val("");
}

function hide_dialog(dlg) {
    jQuery(document.getElementById(dlg)).hide();
    // reset the action. The use pressed Cancel, if this function was called
    // (that, or they're about to open a new Properties dialog, so the value is irrelevant)
    document.frmMain.action.value = '';
}

function show_dialog(dlg) {
    jQuery(document.getElementById(dlg)).show();
}


function show_itemtext(itemtype, name) {
    mapmode('existing');

    hide_all_dialogs();

    jQuery('textarea#item_configtext').val('');

    if (itemtype === 'node') {
        jQuery('#action').val('set_node_config');
    }

    if (itemtype === 'link') {
        jQuery('#action').val('set_link_config');
    }
    show_dialog('dlgTextEdit');

    jQuery.ajax({ type: "GET",
        url: 'editor.php',
        data: {action: 'fetch_config',
            item_type: itemtype,
            item_name: name,
            mapname: document.frmMain.mapname.value},
        success: function (text) {
            jQuery('#item_configtext').val(text);
            document.getElementById('item_configtext').focus();
        }
        });
}

function show_node(name) {
    var fields, index, mynode;
    mapmode('existing');

    hide_all_dialogs();

    mynode = Nodes[name];

    if (mynode) {
        fields = [
            ['#node_target', mynode.target],
            ['#node_name', mynode.name],
            ['#node_newname', mynode.name],
            ['#node_label', mynode.label],
            ['#node_bandwidth_out', mynode.bw_out],
            ['#node_infourl', mynode.infourl],
            ['#node_hover', mynode.overliburl],
            ['#node_nodex', mynode.x],
            ['#node_nodey', mynode.y],
            ['#node_iconfilename', mynode.iconfile],

            ['#param', mynode.name],
            ['#action', "set_node_properties"]
        ];

        for (index = 0; index < fields.length; ++index) {
            jQuery(fields[index][0]).val(fields[index][1]);
        }
        if (mynode.iconfile !== '') {
            if (mynode.iconfile.substring(0, 2) === '::') {
                document.frmMain.node_iconfilename.value = '--AICON--';
            }
        } else {
            document.frmMain.node_iconfilename.value = '--NONE--';
        }

        if (mynode.relative_to !== '') {
            document.frmMain.node_lock_to.value = mynode.relative_to;
        } else {
            document.frmMain.node_lock_to.value = "-- NONE --";
        }

        show_dialog('dlgNodeProperties');
        document.getElementById('node_new_name').focus();
    }
}

function show_link(name) {
    var fields, index, mylink;

    mapmode('existing');

    hide_all_dialogs();

    mylink = Links[name];

    if (mylink) {
        fields = [
            ['#link_target', mylink.target],
            ['#link_width', mylink.width],
            ['#link_name', mylink.name],
            ['#link_bandwidth_in', mylink.bw_in],
            ['#link_bandwidth_out', mylink.bw_out],
            ['#link_infourl', mylink.infourl],
            ['#link_hover', mylink.overliburl],
            ['#link_commentin', mylink.commentin],
            ['#link_commentout', mylink.commentout],
            ['#link_commentinpos', mylink.commentposin],
            ['#link_commentoutpos', mylink.commentposout],

            ['#param', mylink.name],
            ['#action', "set_link_properties"]
        ];

        for (index = 0; index < fields.length; ++index) {
            jQuery(fields[index][0]).val(fields[index][1]);
        }

        if (mylink.bw_in === mylink.bw_out) {
            document.frmMain.link_bandwidth_out.value = '';
            document.frmMain.link_bandwidth_out_cb.checked = 1;
        } else {
            document.frmMain.link_bandwidth_out_cb.checked = 0;
        }

        // if that didn't "stick", then we need to add the special value
        if (jQuery('#link_commentposout').val() !== mylink.commentposout) {
            jQuery('#link_commentposout').prepend("<option selected value='" + mylink.commentposout + "'>" + mylink.commentposout + "%</option>");
        }

        if (jQuery('#link_commentposin').val() !== mylink.commentposin) {
            jQuery('#link_commentposin').prepend("<option selected value='" + mylink.commentposin + "'>" + mylink.commentposin + "%</option>");
        }

        document.getElementById('link_nodename1').firstChild.nodeValue = mylink.a;
        document.getElementById('link_nodename1a').firstChild.nodeValue = mylink.a;
        document.getElementById('link_nodename1b').firstChild.nodeValue = mylink.a;
        document.getElementById('link_nodename2').firstChild.nodeValue = mylink.b;

        show_dialog('dlgLinkProperties');
        jQuery('#link_bandwidth_in').focus();
    }
}

function manage_colours() {
    mapmode('existing');

    hide_all_dialogs();
    document.getElementById('action').value = "set_map_colours";
    show_dialog('dlgColours');
}

function manage_images() {
    mapmode('existing');

    hide_all_dialogs();
    document.getElementById('action').value = "set_image";
    show_dialog('dlgImages');
}

function prefs() {
    hide_all_dialogs();
    document.getElementById('action').value = "editor_settings";
    show_dialog('dlgEditorSettings');
}


function add_node() {
    document.getElementById('tb_help').innerText = 'Click on the map where you would like to add a new node.';
    document.getElementById('action').value = "add_node";
    mapmode('xy');
}

function delete_node() {
    if (confirm("This node (and any links it is part of) will be deleted permanently.")) {
        document.getElementById('action').value = "delete_node";
        document.frmMain.submit();
    }
}

function clone_node() {
    document.getElementById('action').value = "clone_node";
    document.frmMain.submit();
}

function edit_node() {
    document.getElementById('action').value = "edit_node";
    show_itemtext('node', document.frmMain.node_name.value);
}

function edit_link() {
    document.getElementById('action').value = "edit_link";
    show_itemtext('link', document.frmMain.link_name.value);
}

function move_node() {
    hide_dialog('dlgNodeProperties');
    document.getElementById('tb_help').innerText = 'Click on the map where you would like to move the node to.';
    document.getElementById('action').value = "move_node";
    mapmode('xy');
}

function via_link() {
    hide_dialog('dlgLinkProperties');
    document.getElementById('tb_help').innerText = 'Click on the map via which point you whant to redirect link.';
    document.getElementById('action').value = "via_link";
    mapmode('xy');
}

function add_link() {
    document.getElementById('tb_help').innerText = 'Click on the first node for one end of the link.';
    document.getElementById('action').value = "add_link";
    mapmode('existing');
}

function delete_link() {
    if (confirm("This link will be deleted permanently.")) {
        document.getElementById('action').value = "delete_link";
        document.frmMain.submit();
    }
}

function map_properties() {
    mapmode('existing');

    hide_all_dialogs();
    document.getElementById('action').value = "set_map_properties";
    show_dialog('dlgMapProperties');
    document.getElementById('map_title').focus();
}

function map_style() {
    mapmode('existing');

    hide_all_dialogs();
    document.getElementById('action').value = "set_map_style";
    show_dialog('dlgMapStyle');
    document.getElementById('mapstyle_linklabels').focus();
}

function position_timestamp() {
    document.getElementById('tb_help').innerText = 'Click on the map where you would like to put the timestamp.';
    document.getElementById('action').value = "place_stamp";
    mapmode('xy');
}

function real_position_legend(scalename) {
    document.getElementById('tb_help').innerText = 'Click on the map where you would like to put the legend.';
    document.getElementById('action').value = "place_legend";
    document.getElementById('param').value = scalename;
    mapmode('xy');
}

// called from clicking the toolbar
function position_first_legend() {
    real_position_legend('DEFAULT');
}

// called from clicking on the existing legends
function position_legend(e) {
    var el;
    var alt, objectname;

    if (window.event && window.event.srcElement) {
        el = window.event.srcElement;
    }

    if (e && e.target) {
        el = e.target;
    }

    if (!el) {
        return;
    }

    // we need to figure out WHICH legend, nowadays
    alt = el.id;

    objectname = alt.slice(7, alt.length);

    real_position_legend(objectname);
}






function ElementPosition(param) {
    var x = 0, y = 0;
    var obj = (typeof param === "string") ? document.getElementById(param) : param;

    if (obj) {
        x = obj.offsetLeft;
        y = obj.offsetTop;
        var body = document.getElementsByTagName('body')[0];
        while (obj.offsetParent && obj !== body) {
            x += obj.offsetParent.offsetLeft;
            y += obj.offsetParent.offsetTop;
            obj = obj.offsetParent;
        }
    }
    this.x = x;
    this.y = y;
}

function coord_update(event) {
    var cursorx = event.pageX;
    var cursory = event.pageY;

    // Adjust for coords relative to the image, not the document
    var p = new ElementPosition('xycapture');
    cursorx -= p.x;
    cursory -= p.y;
    cursory++; // fudge to make coords match results from imagemap (not sure why this is needed)

    jQuery('#tb_coords').html('Position<br />' + cursorx + ', ' + cursory);
}

function coord_release() {
    jQuery('#tb_coords').html('Position<br />---, ---');
}

function tidy_link() {
    document.getElementById('action').value = "link_tidy";
    document.frmMain.submit();
}



function help_handler(e) {

    var objectid = jQuery(this).attr('id');
    var section = objectid.slice(0, objectid.indexOf('_'));
    var target = section + '_help';
    var helptext = "undefined";

    if (helptexts[objectid]) {
        helptext = helptexts[objectid];
    }

    if ((e.type === 'blur') || (e.type === 'mouseout')) {

        helptext = helptexts[section + '_default'];

        if (helptext === 'undefined') {
            alert('OID is: ' + objectid + ' and target is:' + target + ' and section is: ' + section);
        }
    }

    if (helptext !== "undefined") {
        jQuery("#" + target).text(helptext);
    }

}


// Any clicks in the imagemap end up here.
function click_handler(e) {

    var alt, objectname, objecttype, objectid;

    alt = jQuery(this).attr("id");

    objecttype = alt.slice(0, 4);
    objectname = alt.slice(5, alt.length);
    objectid = objectname.slice(0, objectname.length - 2);

    // if we're not in a mode yet...
    if (document.frmMain.action.value === '') {
        // if we're waiting for a node specifically (e.g. "make link") then ignore links here
        if (objecttype === 'NODE') {
            objectname = NodeIDs[objectid];
            show_node(objectname);
        }

        if (objecttype === 'LINK') {
            objectname = LinkIDs[objectid];
            show_link(objectname);
        }
    } else {
        // we've got a command queued, so do the appropriate thing
        if (objecttype === 'NODE' && document.getElementById('action').value === 'add_link') {
            document.getElementById('param').value = NodeIDs[objectid];
            document.frmMain.submit();
        } else if (objecttype === 'NODE' && document.getElementById('action').value === 'add_link2') {
            document.getElementById('param').value = NodeIDs[objectid];
            document.frmMain.submit();
        } else {
            // Halfway through one operation, the user has done something unexpected.
            // reset back to standard state, and see if we can oblige them
            document.frmMain.action.value = '';
            hide_all_dialogs();
            click_handler(e);
        }
    }
}


function attach_help_events() {
    // add an onblur/onfocus handler to all the visible <input> items

    jQuery("input").focus(help_handler).blur(help_handler);
}

function handleNewMap() {
    if (fromplug !== 1) {
        window.location = "?action=newfile";
    } else {
        window.location = "weathermap-cacti-plugin-mgmt.php";
    }
}

function attach_click_events() {

    var index,
        clicks = [
            ["#tb_newfile", handleNewMap],

            ["#tb_addnode", add_node],
            ["#tb_mapprops", map_properties],
            ["#tb_mapstyle", map_style],

            ["#tb_addlink", add_link],
            ["#tb_poslegend", position_first_legend],
            ["#tb_postime", position_timestamp],
            ["#tb_colours", manage_colours],

            ["#tb_manageimages", manage_images],
            ["#tb_prefs", prefs],

            ["#node_move", move_node],
            ["#node_delete", delete_node],
            ["#node_clone", clone_node],
            ["#node_edit", edit_node],

            ["#link_delete", delete_link],
            ["#link_edit", edit_link],

            ["#link_tidy", tidy_link],
            ["#link_via", via_link],

            ['.wm_submit', do_submit],
            ['.wm_cancel', cancel_op],
            ['#link_cactipick', openCactiPicker],
            ['#node_cactipick', openNodeCactiPicker],
            ['area[id^="LINK:"]', click_handler],
            ['area[id^="NODE:"]', click_handler],
            ['area[id^="TIMES"]', click_handler],
            ['area[id^="LEGEN"]', click_handler]
        ],
        fakelinks = [
            '#link_cactipick',
            '#node_cactipick',
            'area[id^="LINK:"]',
            'area[id^="NODE:"]',
            'area[id^="TIMES"]',
            'area[id^="LEGEN"]'
        ];

    for (index = 0; index < clicks.length; ++index) {
        jQuery(clicks[index][0]).click(clicks[index][1]);
    }

    for (index = 0; index < fakelinks.length; ++index) {
        jQuery(fakelinks[index][0]).attr('href', '#');
    }

    jQuery('#xycapture').mousemove(function (event) {coord_update(event); })
                        .mouseout(function (event) {coord_release(event); });
}

function initJS() {
    // check if DOM is available, if not, we'll stop here, leaving the warning showing
    if (!document.getElementById || !document.createTextNode || !document.getElementsByTagName) {
        // I'm pretty sure this is actually impossible now.
        return;
    }

    // check if there is a "No JavaScript" message
    jQuery("#nojs").hide();

    // so that's the warning hidden, now let's show the content

    // check if there is a "with JavaScript" div
    jQuery("#withjs").show();

    // if the xycapture element is there, then we are in the main edit screen
    if (document.getElementById('xycapture')) {
        attach_click_events();
        attach_help_events();
        show_context_help('node_label', 'node_help');

        // set the mapmode, so we know where we stand.
        mapmode('existing');
    }
}

jQuery(document).ready(initJS);
