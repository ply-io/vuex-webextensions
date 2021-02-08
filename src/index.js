/*
 *  Copyright 2018 - 2019 Mitsuha Kitsune <https://mitsuhakitsune.com>
 *  Licensed under the MIT license.
 */
/* eslint no-console: "warn" */
/* eslint-disable */

import BackgroundScript from './backgroundScript';
import Browser from './browser';
import ContentScript from './contentScript';
import Logger from './logger';

var defaultOptions = {
  connectionName: 'vuex-webextensions',
  loggerLevel: 'warning',
  persistentStates: [],
  ignoredMutations: [],
  ignoredActions: [],
  syncActions: true,
  ignoredStates: []
};

export default function(opt) {
  if (typeof window === 'undefined') {
    // This allows authors to unit test more easily
    return () => {}; // eslint-disable-line no-empty-function
  }

  // Merge default options with passed settings
  const options = {
    ...defaultOptions,
    ...opt
  };

  // Set level of logs
  Logger.setLoggerLevel(options.loggerLevel);

  // Initialize browser class
  const browser = new Browser();

  const isIgnoredState = (state) => {
    const isIgnored = options.ignoredStates.includes(state);
    Logger.debug(`Checking if ${state} is ignored:`, isIgnored);
    return isIgnored;
  };

  return function(str) {
    // Inject the custom mutation to replace the state on load
    str.registerModule('@@VWE_Helper', {
      mutations: {
        vweReplaceState(state, payload) {
          Object.keys(str.state)
            .filter((key) => {
              return isIgnoredState(key) === false;
            })
            .forEach(function(key) {
              str.state[key] = payload[key];
            });
        }
      }
    });

    // Get type of script and initialize connection
    browser.isBackgroundScript(window).then(function(isBackground) {
      if (isBackground) {
        return new BackgroundScript(str, browser, options);
      }

      return new ContentScript(str, browser, options);
    });
  };
}
