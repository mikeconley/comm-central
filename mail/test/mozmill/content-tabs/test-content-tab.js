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
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mark Banner <mark@standard8.plus.com>
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

var MODULE_NAME = 'test-content-tab';

var RELATIVE_ROOT = '../shared-modules';
var MODULE_REQUIRES = ['folder-display-helpers', 'content-tab-helpers'];

var controller = {};
Components.utils.import('resource://mozmill/modules/controller.js', controller);
var mozmill = {};
Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);
var elementslib = {};
Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);
Components.utils.import('resource://gre/modules/Services.jsm');

// RELATIVE_ROOT messes with the collector, so we have to bring the path back
// so we get the right path for the resources.
// Note: this one adds to '' as we need to make sure that favicon.ico is in the
// root directory.
var url = collector.addHttpResource('../content-tabs/html', '');
var whatsUrl = url + "whatsnew.html";

var setupModule = function (module) {
  let fdh = collector.getModule('folder-display-helpers');
  fdh.installInto(module);
  let cth = collector.getModule('content-tab-helpers');
  cth.installInto(module);
  let dh = collector.getModule('dom-helpers');
  dh.installInto(module);
  let wh = collector.getModule('window-helpers');
  wh.installInto(module);
};

function test_content_tab_open() {
  // Set the pref so that what's new opens a local url
  Services.prefs.setCharPref("mailnews.start_page.override_url", whatsUrl);

  let tab = open_content_tab_with_click(mc.menus.helpMenu.whatsNew, whatsUrl);

  assert_tab_has_title(tab, "What's New Content Test");
  // Check the location of the what's new image, this is via the link element
  // and therefore should be set and not favicon.png.
  assert_content_tab_has_favicon(tab, url + "whatsnew.png");

  // Check that window.content is set up correctly wrt content-primary and
  // content-targetable.
  if (mc.window.content.location != whatsUrl)
    throw new Error("window.content is not set to the url loaded, incorrect type=\"...\"?");

}

/**
 * Just make sure that the context menu does what we expect in content tabs wrt.
 * spell checking options.
 */
function test_spellcheck_in_content_tabs() {
  let tabmail = mc.tabmail;
  let w = tabmail.selectedTab.browser.contentWindow;
  let textarea = w.document.getElementsByTagName("textarea")[0];
  let eidMailContext = mc.eid("mailContext");

  // Test a few random items
  mc.click(new elementslib.Elem(textarea));
  // Bug 364914 causes textareas to not be spell checked until they have been
  // focused at last once, so give the event loop a chance to spin.
  mc.sleep(0);
  mc.rightClick(new elementslib.Elem(textarea));
  assert_element_visible("mailContext-spell-dictionaries");
  assert_element_visible("mailContext-spell-check-enabled");
  assert_element_not_visible("mailContext-replySender"); // we're in a content tab!
  close_popup(mc, eidMailContext);

  // Different test
  mc.rightClick(new elementslib.Elem(w.document.body.firstElementChild));
  assert_element_not_visible("mailContext-spell-dictionaries");
  assert_element_not_visible("mailContext-spell-check-enabled");
  close_popup(mc, eidMailContext);

  // Right-click on "zombocom" and add to dictionary
  EventUtils.synthesizeMouse(textarea, 5, 5,
                             {type: "contextmenu", button: 2}, w);
  let suggestions = mc.window.document.getElementsByClassName("spell-suggestion");
  assert_true(suggestions.length > 0, "What, is zombocom a registered word now?");
  mc.click(mc.eid("mailContext-spell-add-to-dictionary"));
  close_popup(mc, eidMailContext);

  // Now check we don't have any suggestionss
  EventUtils.synthesizeMouse(textarea, 5, 5,
                             {type: "contextmenu", button: 2}, w);
  let suggestions = mc.window.document.getElementsByClassName("spell-suggestion");
  assert_true(suggestions.length == 0, "But I just taught you this word!");
  close_popup(mc, eidMailContext);
}
// XXX Currently the spellcheck test has focus issues on non-Mac
test_spellcheck_in_content_tabs.EXCLUDED_PLATFORMS = ['winnt', 'linux'];

function test_content_tab_open_same() {
  let preCount = mc.tabmail.tabContainer.childNodes.length;

  mc.click(new elementslib.Elem(mc.menus.helpMenu.whatsNew));

  controller.sleep(0);

  if (mc.tabmail.tabContainer.childNodes.length != preCount)
    throw new Error("A new content tab was opened when it shouldn't have been");

  // Double-check browser is still the same.
  if (mc.window.content.location != whatsUrl)
    throw new Error("window.content is not set to the url loaded, incorrect type=\"...\"?");
}

function test_content_tab_default_favicon() {
  const whatsUrl1 = url + "whatsnew1.html";

  // Set the pref so that what's new opens a local url
  Services.prefs.setCharPref("mailnews.start_page.override_url", whatsUrl1);

  let tab = open_content_tab_with_click(mc.menus.helpMenu.whatsNew, whatsUrl1);

  assert_tab_has_title(tab, "What's New Content Test 1");
  // Check the location of the favicon, this should be the site favicon in this
  // test.
  assert_content_tab_has_favicon(tab, url + "favicon.ico");
}

function test_content_tab_onbeforeunload() {
  let count = mc.tabmail.tabContainer.childNodes.length;
  let tab = mc.tabmail.tabInfo[count-1];
  tab.browser.contentWindow.addEventListener("beforeunload", function (event) {
    event.returnValue = "Green llama in your car";
  }, false);

  plan_for_modal_dialog("commonDialog", function (controller) {
    controller.window.document.documentElement.getButton("accept").doCommand();
  });
  mc.tabmail.closeTab(tab);
  wait_for_modal_dialog();
}

// XXX todo
// - test find bar
// - window.close within tab
// - zoom?
