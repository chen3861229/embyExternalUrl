[English](README.md) | [简体中文](README.zh-Hans.md)

---

### Main Features
| Name | Function |
| - | :- |
| [emby2Alist](./emby2Alist/README.md) | Redirects Emby/Jellyfin to Alist direct links |
| [embyAddExternalUrl](./alistWebAddExternalUrl/README.md) | Adds an external player button in all Emby/Jellyfin clients (except older TV clients) |
| [embyWebAddExternalUrl](./embyWebAddExternalUrl/README.md) | User script for Emby/Jellyfin/AlistWeb to call external players, web-only |
| [plex2Alist](./plex2Alist/README.md) | Redirects Plex to Alist direct links |

---

### FAQ
See [FAQ](./FAQ.md)

---

# embyExternalUrl

### Emby External Player Server Script

This uses the **nginx njs module** to run a JavaScript script. It adds an external player link in the external link section of Emby videos.  
- Works with all official Emby clients.  
- Does **not** support older TV clients that lack an external media database link section.  
- Be mindful of compatibility with the built-in web view implementation on TV clients.

![Screenshot](https://raw.githubusercontent.com/bpking1/pics/main/img/Screenshot%202023-02-06%20191721.png)

---

### Deployment Methods (choose one)

#### 1. Standalone Usage

This example uses Docker, but you can also install the njs module manually.

Download the script:
```bash
wget https://github.com/bpking1/embyExternalUrl/releases/download/v0.0.1/addExternalUrl.tar.gz \
  && mkdir -p ~/embyExternalUrl \
  && tar -xzvf ./addExternalUrl.tar.gz -C ~/embyExternalUrl \
  && cd ~/embyExternalUrl
```

- Edit `externalUrl.js` to adjust `serverAddr` as needed.  
- `tags` and `groups` are extracted from video versions as keywords for external link names. If not needed, leave them unchanged.  
- `emby.conf` defaults to reverse proxying Emby server on port **8096** — adjust if necessary.  
- `docker-compose.yml` maps port **8097** by default — adjust if necessary.  

Start Docker:
```bash
docker-compose up -d
```

Now visit port **8097**. At the bottom of the video info page, you’ll see the external player link added.

Check logs:
```bash
docker logs -f nginx-embyUrl 2>&1 | grep error
```

---

#### 2. Integration with emby2Alist

1. Place `externalUrl.js` into the `conf.d` directory of emby2Alist, at the same level as `emby.js`.  
2. Copy the contents between `## addExternalUrl SETTINGS ##` from `emby.conf` into the `emby2Alist` `emby.conf`, above the `location /` block.  
3. Copy the `js_import` line from the top of `emby.conf` into the same position in `emby2Alist`’s `emby.conf`.  
4. Restart nginx or reload the config with:  
   ```bash
   nginx -s reload
   ```  
   Then access via the nginx port configured for emby2Alist.

---

### Emby External Player User Script (Web Only)

Available here: [GreasyFork Script](https://greasyfork.org/zh-CN/scripts/514529)
