

---

### Emby External Player User Script (Supports Web and Server)

**Latest user script update address:**  
[https://greasyfork.org/zh-CN/scripts/514529](https://greasyfork.org/zh-CN/scripts/514529)

---

### Notes from the Original Author (bpking1)

1. **Add MPV Player**: On desktop, you need to configure it with this project: [mpv-handler](https://github.com/akiirui/mpv-handler).  
2. **PotPlayer**: Please use the official latest version. Current version `230208` has an issue where Chinese titles appear garbled — wait for the official update.  
3. PotPlayer can load external subtitles. If no external subtitle is selected, it will try to load Chinese subtitles by default.  
4. The direct-link cloud drive playback button has been removed. If you need direct links, solve it on the Emby server side. See [this article](https://blog.738888.xyz/posts/emby_jellyfin_to_alist_directlink).  
5. If PotPlayer launch doesn’t work, it’s usually because the registry entry is missing. Reinstall the latest official PotPlayer.  
6. To allow multiple PotPlayer instances, remove `/current` around line 186 of the script.  
7. Recommended: deploy the JS script directly on the Emby server (no Tampermonkey needed). For Linux:  
   - Create `externalPlayer.js` under `/opt/emby-server/system/dashboard-ui/`  
   - Copy the script content into it  
   - In `index.html`, add a `<script>` reference just above the closing `</body>` tag.  
8. Reference info from original script: [GreasyFork link](https://greasyfork.org/zh-CN/scripts/459297-embylaunchpotplayer).  
9. The original author’s account is no longer accessible. Future updates will be at the new address. Old links:  
   - [GreasyFork 1](https://greasyfork.org/en/scripts/406811-embylaunchpotplayer)  
   - [GitHub](https://github.com/bpking1/embyExternalUrl)  

---

### Deployment Methods (Choose One)

#### 1. Native Server Deployment (Recommended)
- **Pros**: No dependency on plugins like Tampermonkey. All web clients share the plugin automatically.  
- **Cons**: Users cannot disable it manually, and it won’t work on non-web clients.  

Steps:  
1. Edit `../emby-server/system/dashboard-ui/index.html`.  
2. At the bottom, just above `</body>`, below the line `<script src="apploader.js" defer></script>`, add:  
   ```html
   <script src="https://emby-external-url.7o7o.cc/embyWebAddExternalUrl/embyLaunchPotplayer.js" defer></script>
   </body>
   ```  
3. Refresh the client browser or clear cache to take effect.  

---

#### 2. Server Plugin User Script Manager Deployment (Recommended)
- **Pros**: Unified across multiple clients, supports forced enable/disable, more flexible and modern.  
- **Cons**: Depends on a third-party user script manager plugin.  

Use [CustomCssJS](https://github.com/Shurelol/Emby.CustomCssJS).  
- Server changes once, clients can integrate manually.  
- Alternatively, use a third-party modified Emby build with **CustomCssJS** already integrated.  
- Limitation: no modified version available for iOS.  

---

#### 3. Browser User Script Manager Deployment
- **Pros**: Traditional and familiar.  
- **Cons**: Each browser requires its own user script manager installation.  

---

#### 4. Other Deployment & Client Integration
See: [dd-danmaku project](https://github.com/chen3861229/dd-danmaku#%E5%AE%89%E8%A3%85)

---

### Configurable Variables

```js
const iconConfig = {
    // Icon source, choose one (priority: #3 highest)
    // 1. Load icons from jsDelivr CDN
    baseUrl: "https://emby-external-url.7o7o.cc/embyWebAddExternalUrl/icons",
    // baseUrl: "https://fastly.jsdelivr.net/gh/bpking1/embyExternalUrl@main/embyWebAddExternalUrl/icons",
    // 2. Use server local icons (same as /emby-server/system/dashboard-ui/icons)
    // baseUrl: "icons",
    // 3. Embed icons as Base64 inside the script (larger script size)
    // Copy ./iconsExt.js content into getIconsExt function
    removeCustomBtns: false,
};

// Option to rewrite stream links with real filenames for better third-party player compatibility.
// Default: false. Requires nginx-emby2Alist rewrite. If playback fails, disable this option.
const useRealFileName = false;
```

---

### Preview

- **Emby Web, iconOnly: false**  
  ![Preview 1](https://emby-external-url.7o7o.cc/embyWebAddExternalUrl/preview/preview01.png)

- **Emby Web, iconOnly: true**  
  ![Preview 2](https://emby-external-url.7o7o.cc/embyWebAddExternalUrl/preview/preview02.png)

---

### CHANGELOG (Highlights)

- **1.1.22**: Fix compatibility with new `vlc-protocol` and `mpvplay-protocol`.  
- **1.1.21**: Fixed Jellyfin misbehavior and icon issues.  
- **1.1.20**: Adapted to Emby 4.9.0.40, refactored selectors.  
- **1.1.19**: Added option to remove redundant custom switches, added icons, added STRM passthrough toggle.  
- **1.1.18**: Added multi-instance PotPlayer support.  
- **1.1.17**: Improved icon/text mode, isolated data for different platforms.  
- **1.1.16**: Added missing MXPlayerPro icon.  
- **1.1.15**: Added more player support, default hides other platform icons.  
- **1.1.14**: Fixed clipboard API compatibility.  
- **1.1.13**: Fixed Chrome ≥130 PotPlayer launch issue, improved Chinese title support, modernized clipboard API.  
- **1.1.12**: Changed default CDN to Cloudflare Pages for better China Mobile experience.  
- **1.1.11**: Added DeviceId parameter to playback links.  
- **1.1.10**: Fixed mpv-handler encoding error.  
- **1.1.9**: Fixed ddplay error for non-admin accounts.  
- **1.1.8**: Fixed custom stream and download URLs.  
- **1.1.7**: Added `iconOnly` setting, Jellyfin 10.9.6+ compatibility.  
- **1.1.6**: Refactored HTML to JS objects, fixed undefined variables, improved local icon loading, fixed live filenames.  
- **1.1.5**: Fixed copy link button.  
- **1.1.4**: Jellyfin 10.8.13 compatibility, added `useRealFileName` option, fixed missing episode bug.  
- **1.1.3**: Synced with emby2Alist stream.ext changes, fixed double URL encoding.  
- **1.1.2**: Playlist compatibility, fixed playback bug, live page support, added DanDan Play and Base64 icons, Jellyfin compatibility.  
- **1.1.1**: Fixed STRM playback when no initial audio/video info.  

---

✅ This translation keeps the technical details intact while making it clear for English-speaking developers.  

Would you like me to reformat this into a **ready-to-use `README.md` file** for GitHub, with proper headings, code blocks, and links?
