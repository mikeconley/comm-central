/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mike Conley <mconley@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * Tests customization features of the tabs toolbar.
 */

var MODULE_NAME = "test-tabmail-customize";

var RELATIVE_ROOT = "../shared-modules";
var MODULE_REQUIRES = ['folder-display-helpers', 'mouse-event-helpers',
                       'window-helpers'];

function setupModule(module) {
  let fdh = collector.getModule('folder-display-helpers');
  fdh.installInto(module);
  let meh = collector.getModule('mouse-event-helpers');
  meh.installInto(module);
  let wh = collector.getModule('window-helpers');
  wh.installInto(module);
}

/* Test that we can access the customize context menu by right
 * clicking on the tabs toolbar.
 */
function test_open_context_menu() {
  // First, ensure that the context menu is closed.
  let contextPopup = mc.eid('toolbar-context-menu').getNode();
  assert_not_equals(contextPopup.state, "open");

  // Right click on the tab bar
  mc.rightClick(mc.eid("tabcontainer"));
  // Ensure that the popup opened
  assert_equals(contextPopup.state, "open");
}

/* Test that, when customizing the toolbars, if the user drags an item onto
 * the tab bar, they're redirected to the toolbar directly to the right of
 * the tab bar.
 */
function test_redirects_toolbarbutton_drops() {
  let tabbar = mc.eid("tabcontainer").getNode();
  let toolbar = mc.eid("tabbar-toolbar").getNode();

  // First, let's open up the customize toolbar window.
  mc.rightClick(mc.eid("tabcontainer"));
  mc.click(mc.eid("CustomizeMailToolbar"));

  let ctw = wait_for_existing_window("CustomizeToolbarWindow");

  // Let's grab some items from the customize window, and try dropping
  // them on the tab bar
  ["wrapper-button-replyall",
   "wrapper-button-replylist",
   "wrapper-button-forward",
   "wrapper-button-archive",
  ].forEach(function(aButtonId) {
    let button = ctw.eid(aButtonId).getNode();

    let dt = synthesize_drag_start(ctw.window, button, ctw.window);
    assert_true(dt, "Drag target was undefined");

    synthesize_drag_over(mc.window, tabbar, dt);
    synthesize_drop(mc.window, tabbar, dt);

    // Now let's check to make sure that this button is now the first
    // item in the tab bar toolbar.
    assert_equals(toolbar.firstChild.id, aButtonId,
                  "Button was not added as first child!");
  });

  // Ok, now let's try to grab some toolbar buttons from mail-bar3, and
  // make sure we can drop those on the tab bar too.
  ["button-getmsg",
   "button-newmsg",
   "button-address",
   "button-tag",
  ].forEach(function(aButtonId) {
    let button = mc.eid(aButtonId).getNode();

    let dt = synthesize_drag_start(mc.window, button, mc.window);
    assert_true(dt, "Drag target was undefined");

    synthesize_drag_over(mc.window, tabbar, dt);
    synthesize_drop(mc.window, tabbar, dt);

    // Now let's check to make sure that this button is now the first
    // item in the tab bar toolbar.
    assert_equals(toolbar.firstChild.id, "wrapper-" + aButtonId,
                  "Button was not added as first child!");
  });
}
