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
 * The Original Code is Account Provisioner Code.
 *
 * The Initial Developer of the Original Code is
 * The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Blake Winton <bwinton@mozillamessaging.com>
 * Bryan Clark <clarkbw@mozillamessaging.com>
 * Jonathan Protzenko <jprotzenko@mozilla.com>
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

let Cu = Components.utils;
let Cc = Components.classes;
let Ci = Components.interfaces;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource:///modules/StringBundle.js");

let stringBundle = new StringBundle("chrome://messenger/locale/newmailaccount/accountProvisioner.properties");

let isOSX = ("nsILocalFileMac" in Ci);
let isWindows = ("@mozilla.org/windows-registry-key;1" in Cc);

function isAccel (event) (isOSX && event.metaKey || event.ctrlKey)

/**
 * Get the localstorage for this page in a way that works in chrome.
 *
 * Cribbed from
 *   mozilla/dom/tests/mochitest/localstorage/test_localStorageFromChrome.xhtml
 *
 * @param {String} page The page to get the localstorage for.
 * @return {nsIDOMStorage} The localstorage for this page.
 */
function getLocalStorage(page) {
  var url = "http://example.com/" + page;
  var ssm = Cc["@mozilla.org/scriptsecuritymanager;1"]
    .getService(Ci.nsIScriptSecurityManager);
  var dsm = Cc["@mozilla.org/dom/storagemanager;1"]
    .getService(Ci.nsIDOMStorageManager);

  var uri = Services.io.newURI(url, "", null);
  var principal = ssm.getCodebasePrincipal(uri);
  return dsm.getLocalStorageForPrincipal(principal, url);
}

/**
 * Save the state of this page to localstorage, so we can reconstitute it
 * later.
 */
function saveState() {
  var name = String.trim($("#name").val());
  var username = $("#username").val();
  var domain = $("#provider").find(":selected").attr("domain");

  storage.setItem("name", name);
  storage.setItem("username", username);
  storage.setItem("domain", domain);
}

/**
 * Get the default opensearch engine. Stolen from bug 677421.
 */
function getDefaultSearchEngine() {
  if (Services.search.defaultEngine != null)
    return Services.search.defaultEngine.name;
  return "Google";
}

/**
 * Get the current opensearch engine. Stolen from bug 677421.
 */
function getCurrentSearchEngine() {
  try {
    return Services.prefs.getCharPref("mail.websearch.engine");
  } catch (e) {
    return getDefaultSearchEngine();
  }
}

const MAX_SMALL_ADDRESSES = 2;

var storedData = {};
var providers = {};
var account = {};

/**
 * Expand the New or Existing account section.
 *
 * @param existing True if we’re expanding the existing account section.
 */
function expandSection(existing) {
  // Don't expand or contract twice.
  if ($("#existing").data("expanded") == existing)
    return;

  // Do this now, to avoid the scrollbar.
  if (existing) {
    $("#content .description").hide();
    $("#notifications").children().hide();
    $("#existing .header").show();
    $(".tinyheader .title").fadeOut("fast", function() {
      $(this).css({"opacity": "0.0", "display": "inline"});
    });
  }

  $("#existing").animate({"height": existing ? "300px" : "50px",
                          "font-size": existing ? "20pt" : "10pt"}, "fast",
    function() {
      if (!existing) {
        $("#content .description").fadeIn();
        $("#existing .header").hide();
        $(".tinyheader .title").css({"opacity": "1.0"}).fadeIn("fast");
      }
      $("#existing").data("expanded", existing);
    });
}

function splitName(str) {
  let i = str.lastIndexOf(" ");
  if (i >= 1)
    return [str.substring(0, i), str.substring(i+1)];
  else
    return [str, ""];
}

$(function() {
  // Snarf the things I need out of the window arguments.
  let NewMailAccount = window.arguments[0].NewMailAccount;
  let NewComposeMessage = window.arguments[0].NewComposeMessage;
  let openAddonsMgr = window.arguments[0].openAddonsMgr;
  let msgWindow = window.arguments[0].msgWindow;
  let okCallback = window.arguments[0].okCallback;

  window.storage = getLocalStorage("accountProvisioner");
  let opener = Cc["@mozilla.org/uriloader/external-protocol-service;1"]
                         .getService(Ci.nsIExternalProtocolService);

  $(".external").live("click", function (e) {
    e.preventDefault();
    opener.loadUrl(Services.io.newURI($(e.target).attr("href"), "UTF-8", null));
  });

  let prefs = Services.prefs;
  let providerList = prefs.getCharPref("mail.provider.providerList");
  let suggestFromName = prefs.getCharPref("mail.provider.suggestFromName");

  let commentary = $(".commentary")
    .append($("<span>"+stringBundle.get("disclaimer")+"</span>"));
  let placeholder = commentary.find(".placeholder");
  $.getJSON(providerList, function(data) {
    providers = {};
    for each (let [i, provider] in Iterator(data)) {
      providers[provider.id] = provider;
      // Update the terms of service and privacy policy links.
      let sep = "";
      if (i == data.length - 1)
        ;
      else if (i == data.length - 2)
        sep = stringBundle.get("sepAnd");
      else
        sep = stringBundle.get("sepComma");
      placeholder
        .append($("<span />").text(provider.label + " ("))
        .append($("<a />")
          .attr("href", provider.privacy_url)
          .text(stringBundle.get("privacyPolicy"))
          .addClass("privacy").addClass("external").addClass(provider.id)
        )
        .append($("<span />").text(", "))
        .append($("<a />")
          .attr("href", provider.tos_url)
          .text(stringBundle.get("tos"))
          .addClass("tos").addClass("external").addClass(provider.id)
        )
        .append($("<span />").text(")"+sep));
    };
  });
  let name = storage.getItem("name") || $("#name").text();
  let username = storage.getItem("username");
  let domain = storage.getItem("domain");
  $("#name").val(name);
  saveState();

  let metaKey = false;

  $("#window").css("height", window.innerHeight - 1);
  $("#content").focusin(function() {
    expandSection(false);
  }).click(function() {
    expandSection(false);
  });

  $("button.existing").click(function() {
    saveState();
    NewMailAccount(msgWindow, okCallback, window.arguments[0]);
    // Set the callback to null, so that we don't call it.
    okCallback = null;
    window.close();
  });

  $("#existing").focusin(function(event) {
    // Don't expand the section if the click originates from the button
    // (otherwise the button moves from under the cursor).
    if (!$(event.target).hasClass("existing"))
      expandSection(true);
  }).click(function(event) {
    if (!$(event.target).hasClass("existing"))
      expandSection(true);
  });

  $(".tinyheader .title").fadeOut(0, function() {
    $(this).css({"opacity": "0.0", "display": "inline"});
  });

  $(window).unload(function() {
    if (okCallback)
      okCallback();
  });

  $(window).keypress(function(event) {
    if (event.which == "119" && isAccel(event)) {
      // Handle Ctrl-W.
      window.close();
    }
  });

  $(".search").click(function() {
    $(".search").attr("disabled", "disabled");
    $("#notifications").children().hide();
    saveState();
    let name = String.trim($("#name").val());
    if (name.length <= 0) {
      $("#name").select().focus();
      $(".search").removeAttr("disabled");
      return;
    }
    $("#notifications .spinner").show();
    let [firstname, lastname] = splitName(name);
    $.getJSON(suggestFromName,
              {"first_name": firstname, "last_name": lastname},
              function(data) {
      let results = $("#results").empty();
      $(".search").removeAttr("disabled");
      let searchingFailed = true;
      let userLanguages = // "fr-FR, fr"; // for testing
        Services.prefs.getCharPref("intl.accept_languages").split(",");

      let foundUserLang = 0;
      if (data && data.length) {
        for each (let [i, provider] in Iterator(data)) {
          if (!provider.succeeded || provider.addresses.length <= 0 || !(provider.provider in providers))
            continue;
          searchingFailed = false;
          let group = $("<div class='resultsGroup'></div>");
          let header = $("#resultsHeader").clone().removeClass("displayNone");
          header.children(".provider").text(providers[provider.provider].label);
          if (provider.price)
            header.children(".price").text("$"+provider.price);
          else
            header.children(".price").text("Free");
          group.append(header);
          for each (let [j, address] in Iterator(provider.addresses)) {
            let tmplData = {
              address: address,
              priceStr: stringBundle.get("price", [provider.price]),
            };
            let result = $("#result_tmpl").render(tmplData).appendTo(group);
            if (j >= MAX_SMALL_ADDRESSES)
              result.addClass("extra").hide();
          }
          if (provider.addresses.length > MAX_SMALL_ADDRESSES) {
            let more = provider.addresses.length - MAX_SMALL_ADDRESSES;
            let last = group.children(".row:nth-child("+(MAX_SMALL_ADDRESSES+1)+")");
            let tmplData = {
              moreStr: stringBundle.get("more", [more]),
            };
            $("#more_results_tmpl").render(tmplData).appendTo(last);
          }
          group.find("button.create").data("provider", provider.provider);
          group.append($("#resultsFooter").clone().removeClass("displayNone"));

          let supportsSomeUserLang =
            providers[provider.provider].languages
              .some(function (x) userLanguages.indexOf(x) >= 0);
          if (supportsSomeUserLang) {
            foundUserLang++;
          } else {
            group.addClass("noUserLang");
          }

          results.append(group);
        }
        if (foundUserLang == 0) {
          // CSS will take care of un-hiding the right providers thanks to the
          // noUserLang class.
          $("#results").addClass("showAll");
          $(".noProvidersForLang").show();
        } else if (foundUserLang < data.length) {
          $(".showMoreProviders").show();
        }

        $("#notifications").children().hide();
        $("#notifications .success").show();
        ;
        for each (let [i, provider] in Iterator(data)) {
          delete provider.succeeded
          delete provider.addresses
          delete provider.price
          storedData[provider.provider] = provider;
        }
      }
      if (searchingFailed) {
        // Figure out what to do if it failed.
        $("#notifications").children().hide();
        $("#notifications .error").fadeIn();
      }
    });
  });

  $("#notifications").delegate("button.create", "click", function() {
    let provider = providers[$(this).data("provider")];

    // Replace the variables in the url.
    let url = provider.api;
    let [firstName, lastName] = splitName(String.trim($("#name").val()));
    let email = $(this).attr("address");
    url = url.replace("{firstname}", firstName);
    url = url.replace("{lastname}", lastName);
    url = url.replace("{email}", email);

    // And add the extra data.
    let data = storedData[provider.id];
    delete data.provider;
    for (let name in data) {
      url += (url.indexOf("?") == -1 ? "?" : "&") +
              name + "=" + encodeURIComponent(data[name]);
    }

    // Then open a content tab.
    let mail3Pane = Cc["@mozilla.org/appshell/window-mediator;1"]
          .getService(Ci.nsIWindowMediator)
          .getMostRecentWindow("mail:3pane");
    let tabmail = mail3Pane.document.getElementById("tabmail");
    tabmail.openTab("contentTab", {
      contentPage: url,
      onLoad: function (event, aBrowser) {
        // We're passing the value of search_engine to the listener so that when
        // we reopen that window, we don't have to wait for the re-parsing of
        // the provider list to figure out what is the search engine name for
        // that provider.
        let progressListener = new mail3Pane.AccountProvisionerListener(
          aBrowser, {
            realName: firstName + " " + lastName,
            email: email,
            searchEngine: provider.search_engine,
          });
        aBrowser.webProgress.addProgressListener(
          progressListener, Ci.nsIWebProgress.NOTIFY_ALL);
        window.close();
      },
    });
    // Wait for the handler to close us.
    $("#notifications").children().hide();
    $("#notifications .spinner").show();
  });

  // The code is smart enough to work for both selectors.
  $("#results").delegate("div.more, div.address", "click", function() {
    let self = $(this);
    let resultsGroup = self.closest(".resultsGroup");

    // Return if we're already expanded
    if (resultsGroup.hasClass("expanded"))
      return;
    resultsGroup.siblings().removeClass("expanded");
    resultsGroup.addClass("expanded");

    // Hide the other boxes.
    resultsGroup.siblings().children(".extra").slideUp();
    resultsGroup.siblings().find(".more").show();
    resultsGroup.siblings().find(".pricing").fadeOut("fast");
    resultsGroup.siblings().find(".price").fadeIn("fast");

    // And show this box.
    resultsGroup.find(".more").hide();
    resultsGroup.children().find(".pricing").fadeIn("fast");
    self.parent().siblings(".extra").slideDown();
    self.parent().siblings().find(".price").fadeOut("fast");
  });

  $("#back").click(function() {
    $("#name").val($("#account\\.first_name").val() + " " + $("#account\\.last_name").val());
    $("#window").css("height", window.innerHeight - 1);
    $("#content .description").show();
    $("button.create").show();
    $("span.create").hide();
    $("#window, #existing").show();
    $("#provision_form .error").text("");
    $(".header, .success .title, #existing").slideDown();
    $("#results > .row, #search").removeClass("selected").show();
  });

  $("a.optional").click(function() {
    $.scrollTo($("#existing .message"), 1000, {onAfter: function(){
      $("#existing .message").effect("highlight", {}, 3000);
    } } );
  });

  if (window.arguments[0].search_engine) {
    let engine = window.arguments[0].search_engine;
    $("#window").hide();
    $("#search_engine_next").click(function () {
      if ($("#search_engine_check").prop("checked")) {
        Services.prefs.setCharPref("mail.websearch.engine", engine);
      }
      $("#search_engine_page").hide();
      $("#successful_account").show();
    });

    if (getCurrentSearchEngine() == engine) {
      // Skip this page if the search engine is already the right one.
      $("#successful_account").show();
    } else {
      // Otherwise, proceed with the dialog.
      let isChecked = (getCurrentSearchEngine() == getDefaultSearchEngine());
      $("#search_engine_check").prop("checked", isChecked);
      $("#search_engine_desc").html(stringBundle.get("searchDesc", [engine]));
      $("#search_engine_page").show();
    }
  } else if (window.arguments[0].success) {
    $("#window").hide();
    $("#successful_account").show();
  }

  $("#success-compose").click(function() {
    NewComposeMessage(Components.interfaces.nsIMsgCompType.New);
    window.close();
  });

  $("#success-addons").click(function() {
    openAddonsMgr();
    window.close();
  });

  $("#success-signature").click(function() {
    var existingAccountManager =
      Services.wm.getMostRecentWindow("mailnews:accountmanager");

    if (existingAccountManager)
      existingAccountManager.focus();
    else
      window.openDialog("chrome://messenger/content/AccountManager.xul",
                        "AccountManager", "chrome,centerscreen,modal,titlebar",
                        {server: account.incomingServer});
  });

  $("button.close").click(function() {
    window.close();
  });
});
