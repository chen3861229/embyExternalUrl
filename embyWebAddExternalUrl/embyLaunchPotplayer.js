// ==UserScript==
// @name         embyLaunchPotplayer
// @name:en      embyLaunchPotplayer
// @name:zh      embyLaunchPotplayer
// @name:zh-CN   embyLaunchPotplayer
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  emby/jellfin launch extetnal player
// @description:zh-cn emby/jellfin 调用外部播放器
// @description:en  emby/jellfin to external player
// @license      MIT
// @author       @bpking
// @github       https://github.com/bpking1/embyExternalUrl
// @match        *://*/web/index.html
// @match        *://*/web/
// ==/UserScript==

(function () {
    'use strict';
    const iconConfig = {
        // Icon source, choose one of the following three, comment out the others, option 3 has the highest priority
        // 1.add icons from jsdelivr, network
        baseUrl: "https://emby-external-url.7o7o.cc/embyWebAddExternalUrl/icons",
        // baseUrl: "https://fastly.jsdelivr.net/gh/bpking1/embyExternalUrl@main/embyWebAddExternalUrl/icons",
        // 2.server local icons, same as /emby-server/system/dashboard-ui/icons
        // baseUrl: "icons",
        // 3.add icons from Base64, script inner, this script size 22.5KB to 74KB,
        // Manually copy the content of ./iconsExt.js to getIconsExt in this script
        // Remove the last few redundant custom switches
        removeCustomBtns: false,
    };
    // When enabled, the direct stream link will be modified to the actual file name, which is convenient for external players to display and match.
    // It is disabled by default. It strongly depends on the Nginx-emby2Alist location two rewrite. If the original link fails to play, please disable this option.
    const useRealFileName = false;
    // Internal variables below, please do not change
    let isEmby = "";
    const mark = "embyLaunchPotplayer";
    const playBtnsWrapperId = "ExternalPlayersBtns";
    const lsKeys = {
        iconOnly: `${mark}-iconOnly`,
        hideByOS: `${mark}-hideByOS`,
        notCurrentPot: `${mark}-notCurrentPot`,
        strmDirect: `${mark}-strmDirect`,
    };
    const OS = {
        isAndroid: () => /android/i.test(navigator.userAgent),
        isIOS: () => /iPad|iPhone|iPod/i.test(navigator.userAgent),
        isMacOS: () => /Macintosh|MacIntel/i.test(navigator.userAgent),
        isApple: () => OS.isMacOS() || OS.isIOS(),
        isWindows: () => /compatible|Windows/i.test(navigator.userAgent),
        isMobile: () => OS.isAndroid() || OS.isIOS(),
        isUbuntu: () => /Ubuntu/i.test(navigator.userAgent),
        // isAndroidEmbyNoisyX: () => OS.isAndroid() && ApiClient.appVersion().includes('-'),
        // isEmbyNoisyX: () => ApiClient.appVersion().includes('-'),
        isOthers: () => Object.entries(OS).filter(([key, val]) => key !== 'isOthers').every(([key, val]) => !val()),
    };
    const playBtns = [
        { id: "embyPot", title: "Potplayer", iconId: "icon-PotPlayer"
            , onClick: embyPot, osCheck: [OS.isWindows], },
        { id: "embyVlc", title: "VLC", iconId: "icon-VLC", onClick: embyVlc, },
        { id: "embyIINA", title: "IINA", iconId: "icon-IINA"
            , onClick: embyIINA, osCheck: [OS.isMacOS], },
        { id: "embyNPlayer", title: "NPlayer", iconId: "icon-NPlayer", onClick: embyNPlayer, },
        { id: "embyMX", title: "MXPlayer", iconId: "icon-MXPlayer"
            , onClick: embyMX, osCheck: [OS.isAndroid], },
        { id: "embyMXPro", title: "MXPlayerPro", iconId: "icon-MXPlayerPro"
            , onClick: embyMXPro, osCheck: [OS.isAndroid], },
        { id: "embyInfuse", title: "Infuse", iconId: "icon-infuse"
            , onClick: embyInfuse, osCheck: [OS.isApple], },
        { id: "embyStellarPlayer", title: "Stellar Player", iconId: "icon-StellarPlayer"
            , onClick: embyStellarPlayer, osCheck: [OS.isWindows, OS.isMacOS, OS.isAndroid], },
        { id: "embyMPV", title: "MPV", iconId: "icon-MPV", onClick: embyMPV, },
        { id: "embyDDPlay", title: "DDPlay", iconId: "icon-DDPlay"
            , onClick: embyDDPlay, osCheck: [OS.isWindows, OS.isAndroid], },
        { id: "embyFileball", title: "Fileball", iconId: "icon-Fileball"
            , onClick: embyFileball, osCheck: [OS.isApple], },
        { id: "embyOmniPlayer", title: "OmniPlayer", iconId: "icon-OmniPlayer"
            , onClick: embyOmniPlayer, osCheck: [OS.isMacOS], },
        { id: "embyFigPlayer", title: "FigPlayer", iconId: "icon-FigPlayer"
            , onClick: embyFigPlayer, osCheck: [OS.isMacOS], },
        { id: "embySenPlayer", title: "SenPlayer", iconId: "icon-SenPlayer"
            , onClick: embySenPlayer, osCheck: [OS.isIOS], },
        { id: "embyCopyUrl", title: "Copy Stream URL", iconId: "icon-Copy", onClick: embyCopyUrl, },
    ];
    // Jellyfin Icons: https://marella.github.io/material-icons/demo
    // Emby Icons: https://fonts.google.com/icons
    const customBtns = [
        { id: "hideByOS", title: "Player by OS", desc: "Hide players not supported by current OS", iconName: "more", onClick: hideByOSHandler, },
        { id: "iconOnly", title: "Display Mode", desc: "Toggle button text/icon display", iconName: "open_in_full", onClick: iconOnlyHandler, },
        { id: "notCurrentPot", title: "Potplayer Multi-instance", desc: "Toggle whether to open a new Potplayer instance", iconName: "window", onClick: notCurrentPotHandler, },
        { id: "strmDirect", title: "STRM Direct", desc: "If using AList, disable sign, otherwise do not enable this option, still let the server handle the sign.", iconName: "link", onClick: strmDirectHandler, },
    ];
    if (!iconConfig.removeCustomBtns) {
        playBtns.push(...customBtns);
    }
    const fileNameReg = /.*[\\/]|(\?.*)?$/g;
    const selectors = {
        // Detail page score, release date info bar
        embyMediaInfoDiv: "div[is='emby-scroller']:not(.hide) .mediaInfo:not(.hide)",
        jellfinMediaInfoDiv: ".itemMiscInfo-primary:not(.hide)",
        // TV Live Detail Page Create Recording Button
        embyBtnManualRecording: "div[is='emby-scroller']:not(.hide) .btnManualRecording:not(.hide)",
        // TV Live Detail Page Stop Recording Button
        jellfinBtnCancelTimer: ".btnCancelTimer:not(.hide)",
        // Detail page Play/Favorite buttons row
        embyMainDetailButtons: "div[is='emby-scroller']:not(.hide) .mainDetailButtons",
        jellfinMainDetailButtons: "div.itemDetailPage:not(.hide) div.detailPagePrimaryContainer",
        // Detail page subtitle selection dropdown
        selectSubtitles: "div[is='emby-scroller']:not(.hide) select.selectSubtitles",
        // Detail page multiple version selection dropdown
        selectSource: "div[is='emby-scroller']:not(.hide) select.selectSource:not([disabled])",
    };

    function init() {
        let playBtnsWrapper = document.getElementById(playBtnsWrapperId);
        if (playBtnsWrapper) {
            playBtnsWrapper.remove();
        }
        let mainDetailButtons = document.querySelector(selectors.embyMainDetailButtons);
        function generateButtonHTML({ id, title, desc, iconId, iconName }) {
            // jellyfin icon class: material-icons
            return `
                <button
                    id="${id}"
                    type="button"
                    class="detailButton emby-button emby-button-backdropfilter raised-backdropfilter detailButton-primary"
                    title="${desc ? desc : title}"
                >
                    <div class="detailButton-content">
                        <i class="md-icon detailButton-icon button-icon button-icon-left material-icons" id="${iconId}">
                        ${iconName ? iconName : '　'}
                        </i>
                        <span class="button-text">${title}</span>
                    </div>
                </button>
            `;
        }
        let buttonHtml = `<div id="${playBtnsWrapperId}" class="detailButtons flex align-items-flex-start flex-wrap-wrap detail-lineItem">`;
        playBtns.forEach(btn => {
            buttonHtml += generateButtonHTML(btn);
        });
        buttonHtml += `</div>`;

        if (!isEmby) {
            // jellfin
            mainDetailButtons = document.querySelector(selectors.jellfinMainDetailButtons);
        }

        mainDetailButtons.insertAdjacentHTML("afterend", buttonHtml);

        if (!isEmby) {
            // jellfin add class, detailPagePrimaryContainer、button-flat
            let playBtnsWrapper = document.getElementById("ExternalPlayersBtns");
            // style to cover .layout-mobile
            playBtnsWrapper.style.display = "flex";
            // playBtnsWrapper.style["justifyContent"] = "center";
            playBtnsWrapper.classList.add("detailPagePrimaryContainer");
            let btns = playBtnsWrapper.getElementsByTagName("button");
            for (let i = 0; i < btns.length; i++) {
                btns[i].classList.add("button-flat");
            }
        }

        // add event
        playBtns.forEach(btn => {
            const btnEle = document.querySelector(`#${btn.id}`);
            if (btnEle) {
                btnEle.onclick = btn.onClick;
            }
        });

        const iconBaseUrl = iconConfig.baseUrl;
        const icons = [
            // if url exists, use url property, if id diff icon name, use name property
            { id: "icon-PotPlayer", name: "icon-PotPlayer.webp", fontSize: "1.4em" },
            { id: "icon-VLC", fontSize: "1.3em" },
            { id: "icon-IINA", fontSize: "1.4em" },
            { id: "icon-NPlayer", fontSize: "1.3em" },
            { id: "icon-MXPlayer", fontSize: "1.4em" },
            { id: "icon-MXPlayerPro", fontSize: "1.4em" },
            { id: "icon-infuse", fontSize: "1.4em" },
            { id: "icon-StellarPlayer", fontSize: "1.4em" },
            { id: "icon-MPV", fontSize: "1.4em" },
            { id: "icon-DDPlay", fontSize: "1.4em" },
            { id: "icon-Fileball", fontSize: "1.4em" },
            { id: "icon-SenPlayer", fontSize: "1.4em" },
            { id: "icon-OmniPlayer", fontSize: "1.4em" },
            { id: "icon-FigPlayer", fontSize: "1.4em" },
            { id: "icon-Copy", fontSize: "1.4em" },
        ];
        const iconsExt = getIconsExt();
        icons.map((icon, index) => {
            const element = document.querySelector(`#${icon.id}`);
            if (element) {
                // if url exists, use url property, if id diff icon name, use name property
                icon.url = typeof iconsExt !== 'undefined' && iconsExt && iconsExt[index] ? iconsExt[index].url : undefined;
                const url = icon.url || `${iconBaseUrl}/${icon.name || `${icon.id}.webp`}`;
                element.style.cssText += `
                    background-image: url(${url});
                    background-repeat: no-repeat;
                    background-size: 100% 100%;
                    font-size: ${icon.fontSize};
                `;
            }
        });
        if (!iconConfig.removeCustomBtns) {
            hideByOSHandler();
            iconOnlyHandler();
            notCurrentPotHandler();
            strmDirectHandler();
        }
    }

    // copy from ./iconsExt,如果更改了以下内容,请同步更改 ./iconsExt.js
    function getIconsExt() {
        // base64 data total size 72.5 KB from embyWebAddExternalUrl/icons/min, sync modify
        const iconsExt = [];
        return iconsExt;
    }

    function showFlag() {
        let mediaInfoDiv = document.querySelector(selectors.embyMediaInfoDiv);
        let btnManualRecording = document.querySelector(selectors.embyBtnManualRecording);
        if (!isEmby) {
            mediaInfoDiv = document.querySelector(selectors.jellfinMediaInfoDiv);
            btnManualRecording = document.querySelector(selectors.jellfinBtnCancelTimer);
        }
        return !!mediaInfoDiv || !!btnManualRecording;
    }

    async function getItemInfo() {
        let userId = ApiClient._serverInfo.UserId;
        let itemId = /\?id=([A-Za-z0-9]+)/.exec(window.location.hash)[1];
        let response = await ApiClient.getItem(userId, itemId);
        // Continue playing the next episode of the current series
        if (response.Type == "Series") {
            let seriesNextUpItems = await ApiClient.getNextUpEpisodes({ SeriesId: itemId, UserId: userId });
            if (seriesNextUpItems.Items.length > 0) {
                console.log("nextUpItemId: " + seriesNextUpItems.Items[0].Id);
                return await ApiClient.getItem(userId, seriesNextUpItems.Items[0].Id);
            }
        }
        // Play the first episode of the current season
        if (response.Type == "Season") {
            let seasonItems = await ApiClient.getItems(userId, { parentId: itemId });
            console.log("seasonItemId: " + seasonItems.Items[0].Id);
            return await ApiClient.getItem(userId, seasonItems.Items[0].Id);
        }
        // Play the current episode or movie
        if (response.MediaSources?.length > 0) {
            console.log("itemId:  " + itemId);
            return response;
        }
        // Default: Play the first item, episode, or the first media item in a playlist
        let firstItems = await ApiClient.getItems(userId, { parentId: itemId, Recursive: true, IsFolder: false, Limit: 1 });
        console.log("firstItemId: " + firstItems.Items[0].Id);
        return await ApiClient.getItem(userId, firstItems.Items[0].Id);
    }

    function getSeek(position) {
        let ticks = position * 10000;
        let parts = []
            , hours = ticks / 36e9;
        (hours = Math.floor(hours)) && parts.push(hours);
        let minutes = (ticks -= 36e9 * hours) / 6e8;
        ticks -= 6e8 * (minutes = Math.floor(minutes)),
            minutes < 10 && hours && (minutes = "0" + minutes),
            parts.push(minutes);
        let seconds = ticks / 1e7;
        return (seconds = Math.floor(seconds)) < 10 && (seconds = "0" + seconds),
            parts.push(seconds),
            parts.join(":")
    }

    function getSubPath(mediaSource) {
        let selectSubtitles = document.querySelector(selectors.selectSubtitles);
        let subTitlePath = '';
        // Return the selected external subtitle
        if (selectSubtitles && selectSubtitles.value > 0) {
            let SubIndex = mediaSource.MediaStreams.findIndex(m => m.Index == selectSubtitles.value && m.IsExternal);
            if (SubIndex > -1) {
                let subtitleCodec = mediaSource.MediaStreams[SubIndex].Codec;
                subTitlePath = `/${mediaSource.Id}/Subtitles/${selectSubtitles.value}/Stream.${subtitleCodec}`;
            }
        }
        else {
            // Default: try to return the first external Chinese subtitle
            let chiSubIndex = mediaSource.MediaStreams.findIndex(m => m.Language == "chi" && m.IsExternal);
            if (chiSubIndex > -1) {
                let subtitleCodec = mediaSource.MediaStreams[chiSubIndex].Codec;
                subTitlePath = `/${mediaSource.Id}/Subtitles/${chiSubIndex}/Stream.${subtitleCodec}`;
            } else {
                // Try to return the first external subtitle
                let externalSubIndex = mediaSource.MediaStreams.findIndex(m => m.IsExternal);
                if (externalSubIndex > -1) {
                    let subtitleCodec = mediaSource.MediaStreams[externalSubIndex].Codec;
                    subTitlePath = `/${mediaSource.Id}/Subtitles/${externalSubIndex}/Stream.${subtitleCodec}`;
                }
            }

        }
        return subTitlePath;
    }

    async function getEmbyMediaInfo() {
        let itemInfo = await getItemInfo();
        let mediaSourceId = itemInfo.MediaSources[0].Id;
        let selectSource = document.querySelector(selectors.selectSource);
        if (selectSource && selectSource.value.length > 0) {
            mediaSourceId = selectSource.value;
        }
        // let selectAudio = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectAudio:not([disabled])");
        const accessToken = ApiClient.accessToken();
        let mediaSource = itemInfo.MediaSources.find(m => m.Id == mediaSourceId);
        let uri = isEmby ? "/emby/videos" : "/Items";
        let baseUrl = `${ApiClient._serverAddress}${uri}/${itemInfo.Id}`;
        let subPath = getSubPath(mediaSource);
        let subUrl = subPath.length > 0 ? `${baseUrl}${subPath}?api_key=${accessToken}` : "";
        let streamUrl = `${baseUrl}/`;
        if (mediaSource.Path.startsWith("http") && localStorage.getItem(lsKeys.strmDirect) === "1") {
            streamUrl = decodeURIComponent(mediaSource.Path);
        } else {
            let fileName = mediaSource.IsInfiniteStream ? `master.m3u8` : decodeURIComponent(mediaSource.Path.replace(fileNameReg, ""));
            if (isEmby) {
                if (mediaSource.IsInfiniteStream) {
                    streamUrl += useRealFileName && mediaSource.Name ? `${mediaSource.Name}.m3u8` : fileName;
                } else {
                    // origin link: /emby/videos/401929/stream.xxx?xxx
                    // modify link: /emby/videos/401929/stream/xxx.xxx?xxx
                    // this is not important, hit "/emby/videos/401929/" path level still worked
                    streamUrl += useRealFileName ? `stream/${fileName}` : `stream.${mediaSource.Container}`;
                }
            } else {
                streamUrl += `Download`;
                streamUrl += useRealFileName ? `/${fileName}` : "";
            }
            streamUrl += `?api_key=${accessToken}&Static=true&MediaSourceId=${mediaSourceId}&DeviceId=${ApiClient._deviceId}`;
        }
        let position = parseInt(itemInfo.UserData.PlaybackPositionTicks / 10000);
        let intent = await getIntent(mediaSource, position);
        console.log(streamUrl, subUrl, intent);
        return {
            streamUrl: streamUrl,
            subUrl: subUrl,
            intent: intent,
        }
    }

    async function getIntent(mediaSource, position) {
        // Live TV programs query items interface has no path
        let title = mediaSource.IsInfiniteStream
            ? mediaSource.Name
            : decodeURIComponent(mediaSource.Path.replace(fileNameReg, ""));
        let externalSubs = mediaSource.MediaStreams.filter(m => m.IsExternal == true);
        let subs = ''; // Required to be android.net.uri[] ?
        let subs_name = '';
        let subs_filename = '';
        let subs_enable = '';
        if (externalSubs) {
            subs_name = externalSubs.map(s => s.DisplayTitle);
            subs_filename = externalSubs.map(s => s.Path.split('/').pop());
        }
        return {
            title: title,
            position: position,
            subs: subs,
            subs_name: subs_name,
            subs_filename: subs_filename,
            subs_enable: subs_enable,
            path: mediaSource.Path,
        };
    }

    // URL with "intent" scheme only support
    // String => 'S'
    // Boolean =>'B'
    // Byte => 'b'
    // Character => 'c'
    // Double => 'd'
    // Float => 'f'
    // Integer => 'i'
    // Long => 'l'
    // Short => 's'

    async function embyPot() {
        const mediaInfo = await getEmbyMediaInfo();
        const intent = mediaInfo.intent;
        const notCurrentPotArg = localStorage.getItem(lsKeys.notCurrentPot) === "1" ? "" : "/current";
        let potUrl = `potplayer://${encodeURI(mediaInfo.streamUrl)} /sub=${encodeURI(mediaInfo.subUrl)} ${notCurrentPotArg} /seek=${getSeek(intent.position)} /title="${intent.title}"`;
        await writeClipboard(potUrl);
        console.log("Successfully wrote the real deep link to the clipboard: ", potUrl);
        // Test showed that no spaces is also okay, Potplayer automatically converts DeepLink to command line arguments. Full arguments: PotPlayer About -> Command line options
        potUrl = `potplayer://${notCurrentPotArg}/clipboard`;
        window.open(potUrl, "_self");
    }

    // async function embyPot() {
    //     let mediaInfo = await getEmbyMediaInfo();
    //     let intent = mediaInfo.intent;
    //     let potUrl = `potplayer://${encodeURI(mediaInfo.streamUrl)} /sub=${encodeURI(mediaInfo.subUrl)} /current /seek=${getSeek(intent.position)}`;
    //     potUrl += useRealFileName ? '' : ` /title="${intent.title}"`;
    //     console.log(potUrl);
    //     window.open(potUrl, "_self");
    // }

    // https://wiki.videolan.org/Android_Player_Intents/
    async function embyVlc() {
        let mediaInfo = await getEmbyMediaInfo();
        let intent = mediaInfo.intent;
        // android subtitles:  https://code.videolan.org/videolan/vlc-android/-/issues/1903
        let vlcUrl = `intent:${encodeURI(mediaInfo.streamUrl)}#Intent;package=org.videolan.vlc;type=video/*;S.subtitles_location=${encodeURI(mediaInfo.subUrl)};S.title=${encodeURI(intent.title)};i.position=${intent.position};end`;
        if (OS.isWindows() || OS.isMacOS()) {
            // Desktop requires additional setup, refer to this project:
            // new: https://github.com/northsea4/vlc-protocol
            // old: https://github.com/stefansundin/vlc-protocol
            vlcUrl = `vlc://${encodeURI(mediaInfo.streamUrl)}`;
        }
        if (OS.isIOS()) {
            // https://wiki.videolan.org/Documentation:IOS/#x-callback-url
            // https://code.videolan.org/videolan/vlc-ios/-/commit/55e27ed69e2fce7d87c47c9342f8889fda356aa9
            vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(mediaInfo.streamUrl)}&sub=${encodeURIComponent(mediaInfo.subUrl)}`;
        }
        console.log(vlcUrl);
        window.open(vlcUrl, "_self");
    }

    // MPV
    async function embyMPV() {
        let mediaInfo = await getEmbyMediaInfo();
        // Desktop requires additional setup, refer to this project:
        // new: https://github.com/northsea4/mpvplay-protocol
        // old: https://github.com/akiirui/mpv-handler
        let streamUrl64 = btoa(String.fromCharCode.apply(null, new Uint8Array(new TextEncoder().encode(mediaInfo.streamUrl))))
            .replace(/\//g, "_").replace(/\+/g, "-").replace(/\=/g, "");
        let MPVUrl = `mpv://play/${streamUrl64}`;
        if (mediaInfo.subUrl.length > 0) {
            let subUrl64 = btoa(mediaInfo.subUrl).replace(/\//g, "_").replace(/\+/g, "-").replace(/\=/g, "");
            MPVUrl = `mpv://play/${streamUrl64}/?subfile=${subUrl64}`;
        }

        if (OS.isIOS() || OS.isAndroid()) {
            MPVUrl = `mpv://${encodeURI(mediaInfo.streamUrl)}`;
        }
        if (OS.isMacOS()) {
            MPVUrl = `mpvplay://${encodeURI(mediaInfo.streamUrl)}`;
        }

        console.log(MPVUrl);
        window.open(MPVUrl, "_self");
    }

    // https://github.com/iina/iina/issues/1991
    async function embyIINA() {
        let mediaInfo = await getEmbyMediaInfo();
        let iinaUrl = `iina://weblink?url=${encodeURIComponent(mediaInfo.streamUrl)}&new_window=1`;
        console.log(`iinaUrl= ${iinaUrl}`);
        window.open(iinaUrl, "_self");
    }

    // https://sites.google.com/site/mxvpen/api
    // https://mx.j2inter.com/api
    // https://support.mxplayer.in/support/solutions/folders/43000574903
    async function embyMX() {
        const mediaInfo = await getEmbyMediaInfo();
        const intent = mediaInfo.intent;
        // mxPlayer free
        const packageName = "com.mxtech.videoplayer.ad";
        const url = `intent:${encodeURI(mediaInfo.streamUrl)}#Intent;package=${packageName};S.title=${encodeURI(intent.title)};i.position=${intent.position};end`;
        console.log(url);
        window.open(url, "_self");
    }

    async function embyMXPro() {
        const mediaInfo = await getEmbyMediaInfo();
        const intent = mediaInfo.intent;
        // mxPlayer Pro
        const packageName = "com.mxtech.videoplayer.pro";
        const url = `intent:${encodeURI(mediaInfo.streamUrl)}#Intent;package=${packageName};S.title=${encodeURI(intent.title)};i.position=${intent.position};end`;
        console.log(url);
        window.open(url, "_self");
    }

    async function embyNPlayer() {
        let mediaInfo = await getEmbyMediaInfo();
        let nUrl = OS.isMacOS()
            ? `nplayer-mac://weblink?url=${encodeURIComponent(mediaInfo.streamUrl)}&new_window=1` 
            : `nplayer-${encodeURI(mediaInfo.streamUrl)}`;
        console.log(nUrl);
        window.open(nUrl, "_self");
    }

    async function embyInfuse() {
        let mediaInfo = await getEmbyMediaInfo();
        // Subtitle parameter restrictions: Play a single video file with external subtitles (Infuse 7.6.2 and above)
        // see: https://support.firecore.com/hc/zh-cn/articles/215090997
        let infuseUrl = `infuse://x-callback-url/play?url=${encodeURIComponent(mediaInfo.streamUrl)}&sub=${encodeURIComponent(mediaInfo.subUrl)}`;
        console.log(`infuseUrl= ${infuseUrl}`);
        window.open(infuseUrl, "_self");
    }

    // StellarPlayer
    async function embyStellarPlayer() {
        let mediaInfo = await getEmbyMediaInfo();
        let stellarPlayerUrl = `stellar://play/${encodeURI(mediaInfo.streamUrl)}`;
        console.log(`stellarPlayerUrl= ${stellarPlayerUrl}`);
        window.open(stellarPlayerUrl, "_self");
    }

    // MPV
    async function embyMPV() {
        let mediaInfo = await getEmbyMediaInfo();
        // Desktop requires additional setup, use this project: https://github.com/akiirui/mpv-handler
        let streamUrl64 = btoa(String.fromCharCode.apply(null, new Uint8Array(new TextEncoder().encode(mediaInfo.streamUrl))))
            .replace(/\//g, "_").replace(/\+/g, "-").replace(/\=/g, "");
        let MPVUrl = `mpv-handler://play/${streamUrl64}`;
        if (mediaInfo.subUrl.length > 0) {
            let subUrl64 = btoa(mediaInfo.subUrl).replace(/\//g, "_").replace(/\+/g, "-").replace(/\=/g, "");
            MPVUrl = `mpv-handler://play/${streamUrl64}/?subfile=${subUrl64}`;
        }

        if (OS.isIOS() || OS.isAndroid()) {
            MPVUrl = `mpv-handler://${encodeURI(mediaInfo.streamUrl)}`;
        }

        console.log(MPVUrl);
        window.open(MPVUrl, "_self");
    }

    // see https://greasyfork.org/zh-CN/scripts/443916
    async function embyDDPlay() {
        // Check if it's a Windows local path
        const fullPathEle = document.querySelector(".mediaSources .mediaSource .sectionTitle > div:not([class]):first-child");
        let fullPath = fullPathEle ? fullPathEle.innerText : "";
        let ddplayUrl;
        if (new RegExp('^[a-zA-Z]:').test(fullPath)) {
            ddplayUrl = `ddplay:${encodeURIComponent(fullPath)}`;
        } else {
            console.log("File path is not a local path, using stream playback");
            const mediaInfo = await getEmbyMediaInfo();
            const intent = mediaInfo.intent;
            if (!fullPath) {
                fullPath = intent.title;
            }
            const urlPart = mediaInfo.streamUrl + `|filePath=${fullPath}`;
            ddplayUrl = `ddplay:${encodeURIComponent(urlPart)}`;
            if (OS.isAndroid()) {
                // Subtitles Not Supported: https://github.com/kaedei/dandanplay-libraryindex/blob/master/api/ClientProtocol.md
                ddplayUrl = `intent:${encodeURI(urlPart)}#Intent;package=com.xyoye.dandanplay;type=video/*;end`;
            }
        }
        console.log(`ddplayUrl= ${ddplayUrl}`);
        window.open(ddplayUrl, "_self");
    }

    async function embyFileball() {
        const mediaInfo = await getEmbyMediaInfo();
        // see: app About, URL Schemes
        const url = `filebox://play?url=${encodeURIComponent(mediaInfo.streamUrl)}`;
        console.log(`FileballUrl= ${url}`);
        window.open(url, "_self");
    }

    async function embyOmniPlayer() {
        const mediaInfo = await getEmbyMediaInfo();
        // see: https://github.com/AlistGo/alist-web/blob/main/src/pages/home/previews/video_box.tsx
        const url = `omniplayer://weblink?url=${encodeURIComponent(mediaInfo.streamUrl)}`;
        console.log(`OmniPlayerUrl= ${url}`);
        window.open(url, "_self");
    }

    async function embyFigPlayer() {
        const mediaInfo = await getEmbyMediaInfo();
        // see: https://github.com/AlistGo/alist-web/blob/main/src/pages/home/previews/video_box.tsx
        const url = `figplayer://weblink?url=${encodeURIComponent(mediaInfo.streamUrl)}`;
        console.log(`FigPlayerUrl= ${url}`);
        window.open(url, "_self");
    }

    async function embySenPlayer() {
        const mediaInfo = await getEmbyMediaInfo();
        // see: app About, URL Schemes
        const url = `SenPlayer://x-callback-url/play?url=${encodeURIComponent(mediaInfo.streamUrl)}`;
        console.log(`SenPlayerUrl= ${url}`);
        window.open(url, "_self");
    }

    function lsCheckSetBoolean(event, lsKeyName) {
        let flag = localStorage.getItem(lsKeyName) === "1";
        if (event) {
            flag = !flag;
            localStorage.setItem(lsKeyName, flag ? "1" : "0");
        }
        return flag;
    }

    function hideByOSHandler(event) {
        const btn = document.getElementById("hideByOS");
        if (!btn) {
            return;
        }
        const flag = lsCheckSetBoolean(event, lsKeys.hideByOS);
        const playBtnsWrapper = document.getElementById(playBtnsWrapperId);
        const buttonEleArr = playBtnsWrapper.querySelectorAll("button");
        buttonEleArr.forEach(btnEle => {
            const btn = playBtns.find(btn => btn.id === btnEle.id);
            const shouldHide = flag && btn.osCheck && !btn.osCheck.some(check => check());
            console.log(`${btn.id} Should Hide: ${shouldHide}`);
            btnEle.style.display = shouldHide ? 'none' : 'block';
        });
        btn.classList.toggle("button-submit", flag);
    }

    function iconOnlyHandler(event) {
        const btn = document.getElementById("iconOnly");
        if (!btn) {
            return;
        }
        const flag = lsCheckSetBoolean(event, lsKeys.iconOnly);
        const playBtnsWrapper = document.getElementById(playBtnsWrapperId);
        const spans = playBtnsWrapper.querySelectorAll("span");
        spans.forEach(span => {
            span.hidden = flag;
        });
        const iArr = playBtnsWrapper.querySelectorAll("i");
        iArr.forEach(iEle => {
            iEle.classList.toggle("button-icon-left", !flag);
        });
        btn.classList.toggle("button-submit", flag);
    }

    function notCurrentPotHandler(event) {
        const btn = document.getElementById("notCurrentPot");
        if (!btn) {
            return;
        }
        const flag = lsCheckSetBoolean(event, lsKeys.notCurrentPot);
        btn.classList.toggle("button-submit", flag);
    }

    function strmDirectHandler(event) {
        const btn = document.getElementById("strmDirect");
        if (!btn) {
            return;
        }
        const flag = lsCheckSetBoolean(event, lsKeys.strmDirect);
        btn.classList.toggle("button-submit", flag);
    }

    async function embyCopyUrl() {
        const mediaInfo = await getEmbyMediaInfo();
        const streamUrl = encodeURI(mediaInfo.streamUrl);
        if (await writeClipboard(streamUrl)) {
            console.log(`copyUrl = ${streamUrl}`);
            this.innerText = 'Copy Successful';
        }
    }

    async function writeClipboard(text) {
        let flag = false;
        if (navigator.clipboard) {
            // Firefox requires https
            try {
                await navigator.clipboard.writeText(text);
                flag = true;
                console.log("Successfully used navigator.clipboard modern clipboard implementation");
            } catch (error) {
                console.error('Error when copying to clipboard with navigator.clipboard:', error);
            }
        } else {
            flag = writeClipboardLegacy(text);
            console.log("navigator.clipboard modern clipboard implementation not available, using legacy implementation");
        }
        return flag;
    }

    function writeClipboardLegacy(text) {
        let textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.style.position = 'absolute';
        textarea.style.clip = 'rect(0 0 0 0)';
        textarea.value = text;
        textarea.select();
        if (document.execCommand('copy', true)) {
            return true;
        }
        return false;
    }

    // emby/jellyfin CustomEvent
    // see: https://github.com/MediaBrowser/emby-web-defaultskin/blob/822273018b82a4c63c2df7618020fb837656868d/nowplaying/videoosd.js#L691
    // monitor dom changements
    document.addEventListener("viewbeforeshow", function (e) {
        console.log("viewbeforeshow", e);
        if (isEmby === "") {
            isEmby = !!e.detail.contextPath;
        }
        let isItemDetailPage;
        if (isEmby) {
            isItemDetailPage = e.detail.contextPath.startsWith("/item?id=");
        } else {
            isItemDetailPage = e.detail.params && e.detail.params.id;
        }
        if (isItemDetailPage) {
            const mutation = new MutationObserver(function() {
                if (showFlag()) {
                    init();
                    mutation.disconnect();
                }
            })
            mutation.observe(document.body, {
                childList: true,
                characterData: true,
                subtree: true,
            })
        }
    });

})();
