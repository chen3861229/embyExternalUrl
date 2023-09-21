//author: @bpking  https://github.com/bpking1/embyExternalUrl
//查看日志: "docker logs -f -n 10 emby-nginx 2>&1  | grep js:"
import config from "./constant.js";
import util from "./util.js";

async function redirect2Pan(r) {
  const embyMountPath = config.embyMountPath;
  const alistToken = config.alistToken;
  const alistAddr = config.alistAddr;
  const alistPublicAddr = config.alistPublicAddr;
  const alistIp = config.alistIp;
  const publicDomain = config.publicDomain;
  const embyPort = config.embyPort;
  //fetch mount emby/jellyfin file path
  const itemInfo = util.getItemInfo(r);
  r.warn(`itemInfo: ${JSON.stringify(itemInfo)}`);
  const embyRes = await fetchEmbyFilePath(itemInfo.itemInfoUri, itemInfo.Etag, itemInfo.itemId);
  if (embyRes.startsWith("error")) {
    r.error(embyRes);
    r.return(500, embyRes);
    return;
  }
  r.warn(`mount emby file path: ${embyRes}`);

  //fetch alist direct link
  const alistFilePath = embyRes.replace(embyMountPath, "");
  const alistFsGetApiPath = `${alistAddr}/api/fs/get`;
  let alistRes = await fetchAlistPathApi(
    alistFsGetApiPath,
    alistFilePath,
    alistToken
  );
  if (!alistRes.startsWith("error")) {
    // alistRes =  alistRes.includes('http://172.17.0.1')
    //   ? alistRes.replace('http://172.17.0.1', alistPublicAddr)
    //   : alistRes;
    // 修复AList本地代理地址无端口返回bug
    // alistRes =  alistRes.includes(alistIp)
    //   && !alistRes.includes(alistPort)
    //   ? alistRes.replace(alistIp, alistPublicAddr)
    //   : alistRes;
    // r.warn(`redirect to: ${alistRes}`);
    // 播放AList挂载的NAS本地视频时,存在卡顿与花屏,替换alist直链回到原始emby服务
    if (alistRes.startsWith(alistIp) || alistRes.startsWith(publicDomain)) {
        alistRes = `${publicDomain}:${embyPort}${r.uri}?DeviceId=${r.args.DeviceId}&MediaSourceId=${itemInfo.mediaSourceId}&Static=${r.args.Static}&PlaySessionId=${r.args.PlaySessionId}&api_key=${itemInfo.api_key}`;
        r.warn(`alist direct link change to: ${alistRes}`);
    }
    r.return(302, alistRes);
    return;
  }
  if (alistRes.startsWith("error403")) {
    r.error(alistRes);
    r.return(403, alistRes);
    return;
  }
  if (alistRes.startsWith("error500")) {
    const filePath = alistFilePath.substring(alistFilePath.indexOf("/", 1));
    const alistFsListApiPath = `${alistAddr}/api/fs/list`;
    const foldersRes = await fetchAlistPathApi(
      alistFsListApiPath,
      "/",
      alistToken
    );
    if (foldersRes.startsWith("error")) {
      r.error(foldersRes);
      r.return(500, foldersRes);
      return;
    }
    const folders = foldersRes.split(",").sort();
    for (let i = 0; i < folders.length; i++) {
      r.warn(`try to fetch alist path from /${folders[i]}${filePath}`);
      let driverRes = await fetchAlistPathApi(
        alistFsGetApiPath,
        `/${folders[i]}${filePath}`,
        alistToken
      );
      if (!driverRes.startsWith("error")) {
        driverRes = driverRes.includes("http://172.17.0.1")
          ? driverRes.replace("http://172.17.0.1", alistPublicAddr)
          : driverRes;
        r.warn(`redirect to: ${driverRes}`);
        r.return(302, driverRes);
        return;
      }
    }
    // use original link
    return r.return(302, util.getEmbyOriginRequestUrl(r));
  }
  r.error(alistRes);
  r.return(500, alistRes);
  return;
}

// 拦截 PlaybackInfo 请求，防止客户端转码（转容器）
async function transferPlaybackInfo(r) {
  // 1 获取 itemId
  const itemInfo = util.getItemInfo(r);
  // 2 手动请求 PlaybackInfo
  const response = await ngx.fetch(itemInfo.itemInfoUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  // 3 返回
  if (response.ok) {
    const body = await response.json();
    r.headersOut["Content-Type"] = "application/json;charset=utf-8";
    return r.return(200, JSON.stringify(body));
  }
  return r.return(302, util.getEmbyOriginRequestUrl(r));
}

async function fetchAlistPathApi(alistApiPath, alistFilePath, alistToken) {
  ngx.log(ngx.WARN, `alistApiPath: ${alistApiPath}`);
  ngx.log(ngx.WARN, `alistFilePath: ${alistFilePath}`);
  const alistRequestBody = {
    path: alistFilePath,
    password: "",
  };
  try {
    const response = await ngx.fetch(alistApiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Authorization: alistToken,
      },
      max_response_body_size: 65535,
      body: JSON.stringify(alistRequestBody),
    });
    if (response.ok) {
      const result = await response.json();
      if (result === null || result === undefined) {
        return `error: alist_path_api response is null`;
      }
      if (result.message == "success") {
        if (result.data.raw_url) {
          ngx.log(ngx.WARN, `alist api result.data.raw_url: ${JSON.stringify(result.data.raw_url)}`);
          return result.data.raw_url;
        }
        return result.data.content.map((item) => item.name).join(",");
      }
      if (result.code == 403) {
        return `error403: alist_path_api ${result.message}`;
      }
      return `error500: alist_path_api ${result.code} ${result.message}`;
    } else {
      return `error: alist_path_api ${response.status} ${response.statusText}`;
    }
  } catch (error) {
    return `error: alist_path_api fetchAlistFiled ${error}`;
  }
}

async function fetchEmbyFilePath(itemInfoUri, Etag, itemId) {
  try {
    let method = "POST";
    // 1: 原始, 2: JobItems返回值
    let resultType = 1;
    if (itemInfoUri.includes("JobItems")) {
      method = "GET";
      resultType = 2;
    }
    const res = await ngx.fetch(itemInfoUri, {
      method: method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Content-Length": 0,
      },
      max_response_body_size: 65535,
    });
    if (res.ok) {
      const result = await res.json();
      if (result === null || result === undefined) {
        return `error: emby_api itemInfoUri response is null`;
      }
      if (resultType == 2) {
        ngx.log(ngx.WARN, `emby /Sync/JobItems api result: ${JSON.stringify(result.Items)}`);
        const jobItem = result.Items.find(o => o.Id == itemId);
        if (jobItem) {
	  return jobItem.MediaSource.Path;
        }
      } else {
        if (Etag) {
	  const mediaSource = result.MediaSources.find((m) => m.ETag == Etag);
	  if (mediaSource && mediaSource.Path) {
	    return mediaSource.Path;
	  }
        }
        return result.MediaSources[0].Path; 
      }
    } else {
      return `error: emby_api ${res.status} ${res.statusText}`;
    }
  } catch (error) {
    return `error: emby_api fetch mediaItemInfo failed,  ${error}`;
  }
}

export default { redirect2Pan, fetchEmbyFilePath, transferPlaybackInfo };
