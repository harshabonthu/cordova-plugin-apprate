/*
  *
  * Licensed to the Apache Software Foundation (ASF) under one
  * or more contributor license agreements. See the NOTICE file
  * distributed with this work for additional information
  * regarding copyright ownership. The ASF licenses this file
  * to you under the Apache License, Version 2.0 (the
  * "License"); you may not use this file except in compliance
  * with the License. You may obtain a copy of the License at
  *
  * http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing,
  * software distributed under the License is distributed on an
  * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  * KIND, either express or implied. See the License for the
  * specific language governing permissions and limitations
  * under the License.
  *
  */;
var AppRate, Locales, localeObj, exec;

Locales = require('./locales');

exec = require('cordova/exec');

AppRate = (function() {
  var FLAG_NATIVE_CODE_SUPPORTED, LOCAL_STORAGE_COUNTER, PREF_STORE_URL_FORMAT_IOS, counter, getAppTitle, getAppVersion, localStorageParam, promptForRatingWindowButtonClickHandler, showDialog, updateCounter;

  function AppRate() {}

  LOCAL_STORAGE_COUNTER = 'counter';

  FLAG_NATIVE_CODE_SUPPORTED = /(iPhone|iPod|iPad|Android)/i.test(navigator.userAgent.toLowerCase());

  PREF_STORE_URL_FORMAT_IOS9 = "itms-apps://itunes.apple.com/app/viewContentsUserReviews/id";
  PREF_STORE_URL_FORMAT_IOS8 = "http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?pageNumber=0&sortOrdering=1&type=Purple+Software&mt=8&id=";

  counter = {
    applicationVersion: void 0,
    countdown: 0
  };

  promptForAppRatingWindowButtonClickHandler = function (buttonIndex) {
    var _base, currentBtn = null;
    switch (buttonIndex) {
      case 0:
        updateCounter('reset');
        break;
      case 1:
        currentBtn = localeObj.noButtonLabel;
        navigator.notification.confirm(localeObj.feedbackPromptMessage, promptForFeedbackWindowButtonClickHandler, localeObj.feedbackPromptTitle, [localeObj.noButtonLabel, localeObj.yesButtonLabel]);
        break;
      case 2:
        currentBtn = localeObj.yesButtonLabel;
        navigator.notification.confirm(localeObj.message, promptForStoreRatingWindowButtonClickHandler, localeObj.title, [localeObj.cancelButtonLabel, localeObj.laterButtonLabel, localeObj.rateButtonLabel])
        break;
    }
    return typeof (_base = AppRate.preferences.callbacks).onButtonClicked === "function" ? _base.onButtonClicked(buttonIndex, currentBtn, "AppRatingPrompt") : void 0;
  };

  promptForStoreRatingWindowButtonClickHandler = function(buttonIndex) {
    var _base, currentBtn = null;
    switch (buttonIndex) {
      case 0:
        updateCounter('reset');
        break;
      case 1:
        currentBtn = localeObj.cancelButtonLabel;
        updateCounter('stop');
        AppRate.navigateToAppStore();
        break;
      case 2:
        currentBtn = localeObj.laterButtonLabel;
        updateCounter('reset');
        break;
      case 3:
        currentBtn = localeObj.rateButtonLabel;
        updateCounter('stop');
        break;
    }
    //This is called only in case the user clicked on a button
    typeof (_base = AppRate.preferences.callbacks).onButtonClicked === "function" ? _base.onButtonClicked(buttonIndex, currentBtn, "StoreRatingPrompt") : void 0;
    //This one is called anyway once the process is done
    return typeof (base = AppRate.preferences.callbacks).done === "function" ? base.done() : void 0;
  };

  promptForFeedbackWindowButtonClickHandler = function(buttonIndex) {
    var _base, currentBtn = null;
    switch (buttonIndex) {
      case 1:
        currentBtn = localeObj.noButtonLabel;
        updateCounter('stop');
        break;
      case 2:
        currentBtn = localeObj.yesButtonLabel;
        updateCounter('stop');
        window.open(AppRate.preferences.appFeedbackURL);
        break;
    }
    return typeof(_base = AppRate.preferences.callbacks).onButtonClicked === "function" ? _base.onButtonClicked(buttonIndex, currentBtn, "FeedbackPrompt") : void 0;
  };

  updateCounter = function(action) {
    if (action == null) {
      action = 'increment';
    }
    switch (action) {
      case 'increment':
        if (counter.countdown <= AppRate.preferences.usesUntilPrompt) {
          counter.countdown++;
        }
        break;
      case 'reset':
        counter.countdown = 0;
        break;
      case 'stop':
        counter.countdown = AppRate.preferences.usesUntilPrompt + 1;
    }
    localStorageParam(LOCAL_STORAGE_COUNTER, JSON.stringify(counter));
    return counter;
  };

  showDialog = function(immediately) {
    var _base;
    if (counter.countdown === AppRate.preferences.usesUntilPrompt || immediately) {
      if (!AppRate.preferences.useCustomRateDialog) {
        localeObj = AppRate.preferences.customLocale || Locales.getLocale(AppRate.preferences.useLanguage, AppRate.preferences.displayAppName);
        if(AppRate.preferences.isAdvancedMode) {
          navigator.notification.confirm(localeObj.appRatePromptMessage, promptForAppRatingWindowButtonClickHandler, localeObj.appRatePromptTitle, [localeObj.noButtonLabel, localeObj.yesButtonLabel]);
        } else {
          navigator.notification.confirm(localeObj.message, promptForStoreRatingWindowButtonClickHandler, localeObj.title, [localeObj.cancelButtonLabel, localeObj.laterButtonLabel, localeObj.rateButtonLabel]);
        }
      }
      if (typeof (base = AppRate.preferences.callbacks).onRateDialogShow === "function") {
        _base.onRateDialogShow(promptForStoreRatingWindowButtonClickHandler);
      }
    }else{
      typeof (_base = AppRate.preferences.callbacks).done === "function" ? _base.done() : void 0;
    }
    return AppRate;
  };

  localStorageParam = function(itemName, itemValue, action) {
    if (itemValue == null) {
      itemValue = null;
    }
    if (action == null) {
      action = false;
    }
    if (itemValue !== null) {
      action = true;
    }
    switch (action) {
      case true:
        localStorage.setItem(itemName, itemValue);
        break;
      case false:
        return localStorage.getItem(itemName);
      case null:
        localStorage.removeItem(itemName);
    }
    return this;
  };

  getAppVersion = function(successCallback, errorCallback) {
    if (FLAG_NATIVE_CODE_SUPPORTED) {
      exec(successCallback, errorCallback, 'AppRate', 'getAppVersion', []);
    } else {
      successCallback(counter.applicationVersion);
    }
    return AppRate;
  };

  getAppTitle = function(successCallback, errorCallback) {
    if (FLAG_NATIVE_CODE_SUPPORTED) {
      exec(successCallback, errorCallback, 'AppRate', 'getAppTitle', []);
    } else {
      successCallback(AppRate.preferences.displayAppName);
    }
    return AppRate;
  };

  AppRate.init = function() {
    if(localStorageParam(LOCAL_STORAGE_COUNTER)){
      counter = JSON.parse(localStorageParam(LOCAL_STORAGE_COUNTER)) || counter;
    }
    getAppVersion((function(_this) {
      return function(applicationVersion) {
        if (counter.applicationVersion !== applicationVersion) {
          counter.applicationVersion = applicationVersion;
          if (_this.preferences.promptAgainForEachNewVersion) {
            updateCounter('reset');
          }
        }
        return _this;
      };
    })(this));
    getAppTitle((function(_this) {
      return function(displayAppName) {
        _this.preferences.displayAppName = displayAppName;
        return _this;
      };
    })(this));
    return this;
  };

  AppRate.locales = Locales;

  AppRate.preferences = {
    useLanguage: null,
    displayAppName: '',
    isAdvancedMode: true,
    promptAgainForEachNewVersion: true,
    usesUntilPrompt: 3,
    openStoreInApp: false,
    useCustomRateDialog: false,
    callbacks: {
      onButtonClicked: null,
      onRateDialogShow: null,
      done:null
    },
    storeAppURL: {
      ios: null,
      android: null,
      blackberry: null,
      windows8: null,
      windows: null
    },
    appFeedbackURL: '/#',
    customLocale: null
  };

  AppRate.promptForRating = function(immediately) {
    if (immediately == null) {
      immediately = true;
    }
    if (this.preferences.useLanguage === null) {
      navigator.globalization.getPreferredLanguage((function(_this) {
        return function(language) {
          _this.preferences.useLanguage = language.value;
          return showDialog(immediately);
        };
      })(this));
    } else {
      showDialog(immediately);
    }
    updateCounter();
    return this;
  };

  AppRate.navigateToAppStore = function() {
    var iOSVersion;
    var PREF_STORE_URL_FORMAT_IOS;
    if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent.toLowerCase())) {
      if (this.preferences.openStoreInApp) {
        exec(null, null, 'AppRate', 'launchAppStore', [this.preferences.storeAppURL.ios]);
      } else {
        iOSVersion = navigator.userAgent.match(/OS\s+([\d\_]+)/i)[0].replace(/_/g, '.').replace('OS ', '').split('.');
        iOSVersion = parseInt(iOSVersion[0]) + (parseInt(iOSVersion[1]) || 0) / 10;
        if (iOSVersion < 9) {
          PREF_STORE_URL_FORMAT_IOS = PREF_STORE_URL_FORMAT_IOS8;
        } else {
          PREF_STORE_URL_FORMAT_IOS = PREF_STORE_URL_FORMAT_IOS9;
        }
        window.open(PREF_STORE_URL_FORMAT_IOS + this.preferences.storeAppURL.ios, '_system');
      }
    } else if (/(Android)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(this.preferences.storeAppURL.android, '_system');
    } else if (/(Windows|Edge)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(this.preferences.storeAppURL.windows, '_blank');
    } else if (/(BlackBerry)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(this.preferences.storeAppURL.blackberry, '_system');
    } else if (/(IEMobile|Windows Phone)/i.test(navigator.userAgent.toLowerCase())) {
      window.open(this.preferences.storeAppURL.windows8, '_system');
    }
    return this;
  };

  return AppRate;

})();

AppRate.init();

module.exports = AppRate;
