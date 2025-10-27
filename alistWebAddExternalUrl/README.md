
---

## 🎯 Purpose
This user script enables AList users to launch external video players directly from the web interface. It supports both standalone browser use and server-side integration.

📜 **Script URL**: [GreasyFork – alistWebLaunchExternalPlayer](https://greasyfork.org/zh-CN/scripts/494829)

---

## ⚙️ Configurable Variables

```js
const replaceOriginLinks = true;     // Replace original external player links
const useInnerIcons = true;          // Use built-in Base64 icons
const removeCustomBtns = false;      // Remove redundant custom toggles
```

---

## 🖼️ Visual Preview

- **AList V3**  
  ![Preview V3](https://emby-external-url.7o7o.cc/alistWebAddExternalUrl/preview/preview01.png)

- **AList V2**  
  ![Preview V2](https://emby-external-url.7o7o.cc/alistWebAddExternalUrl/preview/preview02.png)

---

## 🧩 Deployment Methods

### 1. Browser-Only (Tampermonkey)

1. Install [Tampermonkey](https://www.tampermonkey.net)
2. Visit the [script page](https://greasyfork.org/zh-CN/scripts/494829) and click **Install**
3. Open Tampermonkey dashboard → Enable the script → Click **Edit** → Go to **Settings** tab
4. Under **Include/Exclude**, remove the generic domain match and add your AList domain manually (without port number)

---

### 2. Server-Side Integration (AList Admin Panel)

1. Log in to AList admin → Settings → Global → Custom Header
2. Add the script reference:

```html
<!-- AList default polyfill -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=String.prototype.replaceAll"></script>

<!-- Choose one of the following script sources -->
<!-- Self-hosted -->
<script src="https://yourdomain.com/alistWebLaunchExternalPlayer.js"></script>

<!-- CDN options -->
<script src="https://emby-external-url.7o7o.cc/alistWebAddExternalUrl/alistWebLaunchExternalPlayer.js"></script>
<script src="https://fastly.jsdelivr.net/gh/bpking1/embyExternalUrl@main/embyWebAddExternalUrl/alistWebLaunchExternalPlayer.js"></script>
```

---

## 📌 Additional Notes

- Refer to [embyLaunchPotplayer](https://greasyfork.org/en/scripts/459297-embylaunchpotplayer) for related functionality and compatibility tips.

---

## 📝 CHANGELOG

### 1.1.4
- Fixed compatibility with `vlc-protocol` and `mpvplay-protocol`

### 1.1.3
- Added internal toggle to remove redundant custom switches

### 1.1.2
- Added toggle to hide other platform players
- Added multi-instance PotPlayer support

### 1.1.1
- Added support for additional players
- Default: hide other platform icons

### 1.1.0
- Fixed clipboard API compatibility

### 1.0.9
- Fixed PotPlayer launch issue on Chrome ≥130
- Improved Chinese title support in PotPlayer

### 1.0.8
- Fixed `mpv-handler` encoding bug
- Updated `@match` for Violentmonkey compatibility

### 1.0.7
- Fixed URL encoding bug again

### 1.0.6
- Prioritized local Base64 icons for faster loading

### 1.0.5
- Fixed incorrect MXPlayer comments

### 1.0.4
- Delayed script loading to match server-side custom headers

### 1.0.3
- Added compatibility for AList V2

### 1.0.2
- Reduced token dependency for third-party site compatibility

### 1.0.1
- Fixed double URL encoding issue

---

