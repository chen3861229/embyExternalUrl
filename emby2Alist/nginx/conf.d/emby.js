//author: @bpking  https://github.com/bpking1/embyExternalUrl
//查看日志: "docker logs -f -n 10 emby-nginx 2>&1  | grep js:"
async function redirect2Pan(r) {
    //根据实际情况修改下面的设置
    const embyIp = 'http://172.17.0.1';
    const publicDomain = 'http://youralist.com';
    const embyPort = 8098;
    const embyHost = embyIp + ':' + embyPort; //这里默认emby/jellyfin的地址是宿主机,要注意iptables给容器放行端口
    const embyMountPath = '/AList';  // rclone 的挂载目录, 例如将od, gd挂载到/mnt目录下:  /mnt/onedrive  /mnt/gd ,那么这里 就填写 /mnt
    const alistToken = 'alist-2528f39b';      //alist token, 在alist后台查看
    const alistIp = 'http://172.17.0.1';
    const alistPort = 5244;
    const alistAddr= alistIp + ':' + alistPort; //访问宿主机上5244端口的alist地址, 要注意iptables给容器放行端口
    const embyApiKey = 'ed8cb97fe03f4d09b5b3f33ed';  //emby/jellyfin api key, 在emby/jellyfin后台设置
    const alistPublicAddr = publicDomain + ':' + alistPort; // alist公网地址, 用于需要alist server代理流量的情况, 按需填写

    //fetch mount emby/jellyfin file path
    const regex = /[A-Za-z0-9]+/g;
    const itemId = r.uri.replace('emby', '').replace(/-/g, '').match(regex)[1];
    const mediaSourceId = r.args.MediaSourceId ? r.args.MediaSourceId : r.args.mediaSourceId;
    const Etag = r.args.Tag
    let api_key = r.args['X-Emby-Token'] ? r.args['X-Emby-Token'] : r.args.api_key;
    api_key = api_key ? api_key : embyApiKey;

    let itemInfoUri = '';
    if (mediaSourceId) {
        itemInfoUri = `${embyHost}/Items/${itemId}/PlaybackInfo?MediaSourceId=${mediaSourceId}&api_key=${api_key}`;
    }else{
        itemInfoUri = `${embyHost}/Items/${itemId}/PlaybackInfo?api_key=${api_key}`;
    }
    r.warn(`itemInfoUri: ${itemInfoUri}`);
    const embyRes = await fetchEmbyFilePath(itemInfoUri, Etag);
    if (embyRes.startsWith('error')) {
        r.error(embyRes);
        r.return(500, embyRes);
        return;
    }
    r.warn(`mount emby file path: ${embyRes}`);

    //fetch alist direct link
    const alistFilePath = embyRes.replace(embyMountPath, '');
    const alistFsGetApiPath = `${alistAddr}/api/fs/get`;
    let alistRes = await fetchAlistPathApi(alistFsGetApiPath, alistFilePath, alistToken);
    if (!alistRes.startsWith('error')) {
        // alistRes =  alistRes.includes('http://172.17.0.1') ? alistRes.replace('http://172.17.0.1',alistPublicAddr) : alistRes;
        // 修复AList本地代理地址无端口返回bug
        // alistRes =  alistRes.includes(alistIp) && !alistRes.includes(alistPort) ? alistRes.replace(alistIp, alistPublicAddr) : alistRes;
        // r.warn(`redirect to: ${alistRes}`);
        // 播放本地视频时，不使用alist直链
        if (alistRes.startsWith(alistIp) || alistRes.startsWith(publicDomain)) {
            alistRes = `${publicDomain}:${embyPort}${r.uri}?DeviceId=${r.args.DeviceId}&MediaSourceId=${mediaSourceId}&Static=${r.args.Static}&PlaySessionId=${r.args.PlaySessionId}&api_key=${api_key}`;
            r.warn(`direct to: ${alistRes}`);
            r.return(302, alistRes);
            return;
        }
        r.return(302, alistRes);
        return;
    }
    if (alistRes.startsWith('error403')) {
        r.error(alistRes);
        r.return(403, alistRes);
        return;
    }
    if (alistRes.startsWith('error500')) {
        const filePath = alistFilePath.substring(alistFilePath.indexOf('/', 1));
        const alistFsListApiPath = `${alistAddr}/api/fs/list`;
        const foldersRes = await fetchAlistPathApi(alistFsListApiPath, '/', alistToken);
        if (foldersRes.startsWith('error')) {
            r.error(foldersRes);
            r.return(500, foldersRes);
            return;
        }
        const folders = foldersRes.split(',').sort();
        for (let i = 0; i < folders.length; i++) {
            r.warn(`try to fetch alist path from /${folders[i]}${filePath}`);
            let driverRes = await fetchAlistPathApi(alistFsGetApiPath, `/${folders[i]}${filePath}`, alistToken);
            if (!driverRes.startsWith('error')) {
                driverRes =  driverRes.includes('http://172.17.0.1') ? driverRes.replace('http://172.17.0.1',alistPublicAddr) : driverRes;
                r.warn(`redirect to: ${driverRes}`);
                r.return(302, driverRes);
                return;
            }
        }
        r.error(alistRes);
        r.return(404, alistRes);
        return;
    }
    r.error(alistRes);
    r.return(500, alistRes);
    return;
}

async function fetchAlistPathApi(alistApiPath, alistFilePath, alistToken) {
	ngx.log(ngx.WARN, `alistApiPath: ${alistApiPath}`);
	ngx.log(ngx.WARN, `alistFilePath: ${alistFilePath}`);
    const alistRequestBody = {
        "path": alistFilePath,
        "password": ''
    }
    try {
        const response = await ngx.fetch(alistApiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Authorization': alistToken
            },
            max_response_body_size: 65535,
            body: JSON.stringify(alistRequestBody)
        })
        if (response.ok) {
            const result = await response.json();
            if (result === null || result === undefined) {
                return `error: alist_path_api response is null`;
            }
            if (result.message == 'success') {
            	if (result.data.raw_url) {
                	ngx.log(ngx.WARN, `alist api result.data.raw_url: ${JSON.stringify(result.data.raw_url)}`);
                    return result.data.raw_url;
                }
                return result.data.content.map(item => item.name).join(',');
            }
            if (result.code == 403) {
                return `error403: alist_path_api ${result.message}`;
            }
            return `error500: alist_path_api ${result.code} ${result.message}`;
        }
        else {
            return `error: alist_path_api ${response.status} ${response.statusText}`;
        }
    } catch (error) {
        return (`error: alist_path_api fetchAlistFiled ${error}`);
    }
}

async function fetchEmbyFilePath(itemInfoUri, Etag) {
    try {
        const res = await ngx.fetch(itemInfoUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Content-Length': 0,
            },
            max_response_body_size: 65535,
        });
        if (res.ok) {
            const result = await res.json();
            if (result === null || result === undefined) {
                return `error: emby_api itemInfoUri response is null`;
            }
            if (Etag) {
                const mediaSource = result.MediaSources.find(m => m.ETag == Etag);
                if (mediaSource && mediaSource.Path) {
                    return mediaSource.Path;
                }
            }
            return result.MediaSources[0].Path;
        }
        else {
            return (`error: emby_api ${res.status} ${res.statusText}`);
        }
    }
    catch (error) {
        return (`error: emby_api fetch mediaItemInfo failed,  ${error}`);
    }
}

export default { redirect2Pan };