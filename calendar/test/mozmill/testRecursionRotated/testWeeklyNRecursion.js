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
 * The Original Code is Mozilla Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Merike Sell.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Merike Sell <merikes@gmail.com>
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

var calUtils = require("../shared-modules/calendar-utils");
var modalDialog = require("../shared-modules/modal-dialog");
var utils = require("../shared-modules/utils");

const sleep = 500;
var calendar = "Mozmill";
var hour = 8;
var eventPath = '/{"tooltip":"itemTooltip","calendar":"' + calendar.toLowerCase() + '"}';

var setupModule = function(module) {
  controller = mozmill.getMail3PaneController();
  calUtils.createCalendar(controller, calendar);
}

var testWeeklyNRecursion = function () {
  controller.click(new elementslib.ID(controller.window.document, "calendar-tab-button"));
  calUtils.switchToView(controller, "day");
  calUtils.goToDate(controller, 2009, 1, 5);
  
  // rotate view
  controller.mainMenu.click("#ltnViewRotated");
  controller.waitFor(function() {
    let view = (new elementslib.ID(controller.window.document, "day-view")).getNode();
    return view.orient == "horizontal"});
  
  // create weekly recurring event
  controller.doubleClick(new elementslib.Lookup(controller.window.document,
    calUtils.getEventBoxPath(controller, "day", calUtils.CANVAS_BOX, undefined, 1, hour)), 1, 1);
  controller.waitFor(function() {return mozmill.utils.getWindows("Calendar:EventDialog").length > 0}, sleep);
  let event = new mozmill.controller.MozMillController(mozmill.utils.getWindows("Calendar:EventDialog")[0]);
  
  let md = new modalDialog.modalDialog(event.window);
  md.start(setRecurrence);
  event.waitForElement(new elementslib.ID(event.window.document, "item-repeat"));
  event.select(new elementslib.ID(event.window.document, "item-repeat"), undefined, undefined, "custom");
  
  event.click(new elementslib.ID(event.window.document, "button-save"));
  
  
  // check day view
  let box = calUtils.getEventBoxPath(controller, "day", calUtils.EVENT_BOX, undefined, 1, hour)
    + eventPath;
  
  // Monday, Tuesday, Wednesday, Thursday
  for(let i = 0; i < 4; i++){
    controller.assertNode(new elementslib.Lookup(controller.window.document, box));
    calUtils.forward(controller, 1);
  }
  
  // Saturday
  calUtils.forward(controller, 1);
  controller.assertNodeNotExist(new elementslib.Lookup(controller.window.document, box));
  
  // check week view
  calUtils.switchToView(controller, "week");
  
  // Monday, Tuesday, Wednesday, Thursday
  for(let i = 2; i < 6; i++){
    box = calUtils.getEventBoxPath(controller, "week", calUtils.EVENT_BOX, undefined, i, hour)
      + eventPath;
    controller.waitForElement(new elementslib.Lookup(controller.window.document, box));
  }
  
  // Saturday
  box = calUtils.getEventBoxPath(controller, "week", calUtils.EVENT_BOX, undefined, 7, hour)
    + eventPath;
  controller.assertNodeNotExist(new elementslib.Lookup(controller.window.document, box));
  
  // check multiweek view
  calUtils.switchToView(controller, "multiweek");
  checkMultiWeekView("multiweek");
  
  // check month view
  calUtils.switchToView(controller, "month");
  checkMultiWeekView("month");
  
  // delete event
  box = calUtils.getEventBoxPath(controller, "month", calUtils.EVENT_BOX, 2, 2, hour)
    + eventPath;
  controller.click(new elementslib.Lookup(controller.window.document, box));
  calUtils.handleParentDeletion(false);
  controller.keypress(new elementslib.ID(controller.window.document, "month-view"),
    "VK_DELETE", {});
  controller.waitForElementNotPresent(new elementslib.Lookup(controller.window.document, box));
  
  // reset view
  calUtils.switchToView(controller, "day");
  controller.mainMenu.click("#ltnViewRotated");
  controller.waitFor(function() {
    let view = (new elementslib.ID(controller.window.document, "day-view")).getNode();
    return view.orient == "vertical"});
}

function setRecurrence(recurrence){
  // weekly
  recurrence.waitForElement(new elementslib.ID(recurrence.window.document, "period-list"));
  recurrence.select(new elementslib.ID(recurrence.window.document, "period-list"), undefined, undefined, "1");
  recurrence.sleep(sleep);
  
  let mon = utils.getProperty("chrome://calendar/locale/dateFormat.properties", "day.2.Mmm");
  let tue = utils.getProperty("chrome://calendar/locale/dateFormat.properties", "day.3.Mmm");
  let wed = utils.getProperty("chrome://calendar/locale/dateFormat.properties", "day.4.Mmm");
  let thu = utils.getProperty("chrome://calendar/locale/dateFormat.properties", "day.5.Mmm");
  let sat = utils.getProperty("chrome://calendar/locale/dateFormat.properties", "day.7.Mmm");
  
  let days = '/id("calendar-event-dialog-recurrence")/id("recurrence-pattern-groupbox")/'
    + 'id("recurrence-pattern-grid")/id("recurrence-pattern-rows")/id("recurrence-pattern-period-row")/'
    + 'id("period-deck")/id("period-deck-weekly-box")/[1]/id("daypicker-weekday")/anon({"anonid":"mainbox"})/';
  
  // starting from Monday so it should be checked
  recurrence.assertChecked(new elementslib.Lookup(recurrence.window.document, days + '{"label":"' + mon + '"}'));
  // check Tuesday, Wednesday, Thursday and Saturday too
  recurrence.click(new elementslib.Lookup(recurrence.window.document, days + '{"label":"' + tue + '"}'));
  recurrence.click(new elementslib.Lookup(recurrence.window.document, days + '{"label":"' + wed + '"}'));
  recurrence.click(new elementslib.Lookup(recurrence.window.document, days + '{"label":"' + thu + '"}'));
  recurrence.click(new elementslib.Lookup(recurrence.window.document, days + '{"label":"' + sat + '"}'));
  
  // set number of occurrences
  recurrence.click(new elementslib.ID(recurrence.window.document, "recurrence-range-for"));
  let input = '/id("calendar-event-dialog-recurrence")/id("recurrence-range-groupbox")/[1]/'
    + 'id("recurrence-duration")/id("recurrence-range-count-box")/id("repeat-ntimes-count")/'
    + 'anon({"class":"textbox-input-box numberbox-input-box"})/anon({"anonid":"input"})';
  // replace previous number
  recurrence.keypress(new elementslib.Lookup(recurrence.window.document, input), "a", {ctrlKey:true});
  recurrence.type(new elementslib.Lookup(recurrence.window.document, input), "4");
    
  // close dialog
  recurrence.click(new elementslib.Lookup(recurrence.window.document, '/id("calendar-event-dialog-recurrence")/'
    + 'anon({"anonid":"buttons"})/{"dlgtype":"accept"}'));
}

function checkMultiWeekView(view){
  let week = 1;
  
  // in month view event starts from 2nd row
  if(view == "month") week++;

  // Monday, Tuesday, Wednesday, Thursday
  for(let i = 2; i < 6; i++){
    let box = calUtils.getEventBoxPath(controller, view, calUtils.EVENT_BOX, week, i, undefined)
      + eventPath;
    controller.assertNode(new elementslib.Lookup(controller.window.document, box));
  }
  
  // Saturday
  let box = calUtils.getEventBoxPath(controller, view, calUtils.EVENT_BOX, week, 7, undefined)
    + eventPath;
  controller.assertNodeNotExist(new elementslib.Lookup(controller.window.document, box));
}

var teardownTest = function(module) {
  calUtils.deleteCalendars(controller, calendar);
}
