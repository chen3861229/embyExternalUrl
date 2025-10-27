[English](README.md) | [简体中文](README.zh-Hans.md)

---

## 🎯 Target Audience
This guide is intended for Emby users who:
- Use **rclone** to mount cloud drives
- Are familiar with **Docker**
- Want to redirect Emby/Jellyfin playback to direct links via Alist

> ⚠️ This project does **not** modify your existing Emby or rclone configurations.

---

## ⚙️ Concept Overview

- Emby reads media via **rclone-mounted cloud drives**
- [Alist](https://github.com/Xhofe/alist) converts cloud drive files into **direct links**
- **nginx + njs module** intercepts Emby playback URLs and redirects them to Alist direct links

> ✅ Tested with OneDrive, Google Drive, and Aliyun Drive  
> ✅ Alist supports many cloud providers — feel free to experiment

---

## 🚀 Deployment Options

### 1. All-in-One Docker Deployment (Recommended)
- Simplified setup: pull image and map config files
- Built-in SSL with acme for auto certificate issuance and renewal
- Auto-update on restart

🔗 [Project Link](https://github.com/thsrite/MediaLinker?tab=readme-ov-file)

---

### 2. Manual Setup in Existing nginx Environment
- Similar steps as Docker
- Example using **nginx proxy manager (WebUI)**:  
  [Reference](https://github.com/chen3861229/embyExternalUrl/issues/73#issuecomment-2452921067)

---

### 3. Manual Docker Deployment

#### Step 1: Download Configuration
```bash
wget https://github.com/bpking1/embyExternalUrl/releases/download/v0.0.1/emby2Alist.tar.gz \
  && mkdir -p ~/emby2Alist \
  && tar -xzvf ./emby2Alist.tar.gz -C ~/emby2Alist \
  && cd ~/emby2Alist
```

#### Step 2: File Structure Overview
```plaintext
~/emby2Alist
├── docker/
│   ├── docker-compose.yml
│   ├── nginx-emby.syno.json
│   └── nginx-jellyfin.syno.json
└── nginx/
    ├── conf.d/
    │   ├── api/
    │   ├── cert/
    │   ├── common/
    │   ├── config/
    │   ├── exampleConfig/
    │   ├── includes/
    │   ├── constant.js
    │   ├── emby-live.js
    │   ├── emby-transcode.js
    │   ├── emby.conf
    │   └── emby.js
    └── nginx.conf
```

#### Step 3: Modify Configs
- Edit `constant.js` to set your Alist password
- Default assumes Emby runs on the same machine at port `8096`

#### Step 4: Optional — Aliyun Drive Setup
- Edit `docker-compose.yml` → `service.ali-webdav` → `REFRESH_TOKEN`
- Token guide: [Aliyun WebDAV](https://github.com/messense/aliyundrive-webdav)

#### Step 5: Docker Deployment Options

**Preconditions:**
```bash
mkdir -p /xxx/nginx-emby/log
mkdir -p /xxx/nginx-emby/embyCache
```
Move all files from `xxx2Alist/nginx/` to `/xxx/nginx-emby/config/`

**Start Docker:**
```bash
cd ~/emby2Alist/docker
docker-compose up -d
docker-compose logs -f
```

> Common errors:
> - Port conflicts → adjust `docker-compose.yml`
> - Invalid refresh token (ignore if not using Aliyun)

**Synology Docker:**
- Go to Container → Settings → Import → Select JSON config → Confirm

---

### 🔐 Firewall Configuration
Open ports: `5244`, `8091`  
- `8080`: Aliyun WebDAV  
- `8091`: Emby direct link proxy  
- `8096`: Original Emby server

Access `5244` to configure Alist.  
Add cloud drives via Alist backend:  
- Use existing `client_id`, `secret`, `refresh_token` from rclone  
- For Aliyun: use [this tool](https://media.cooluc.com/decode_token/) to get the correct token  
- Match Alist drive name with rclone mount folder name (e.g., `/mnt/ali` → `ali`)

---

### 🧰 rclone Mount Example (Aliyun WebDAV)
```bash
rclone config  # Choose webdav, set URL to http://localhost:8080, user/pass = admin
rclone lsf ali:  # Test listing
mkdir -p /mnt/ali
nohup rclone mount ali: /mnt/ali --umask 0000 --default-permissions --allow-non-empty --allow-other --buffer-size 32M --vfs-read-chunk-size 64M --vfs-read-chunk-size-limit 1G &
```

---

### ✅ Test Setup
Visit `http://localhost:8091` to test direct link playback  
Check logs:
```bash
docker logs -f -n 10 nginx-emby 2>&1 | grep js:
```

> Direct links bypass Emby’s transcoding  
> Set Emby → Playback → Video → Internet Quality to **highest**  
> Disable user transcoding permissions to force direct link usage

---

## ⚠️ Known Issues

1. **Subtitles**:  
   Embedded subtitles require Emby to extract via ffmpeg, which downloads most of the video and consumes CPU.  
   → Use **external subtitles** for web playback  
   → Only modified Emby clients with MX Player support full subtitle passing

2. **Google Drive**:  
   Due to API limits, direct links require server relay or CF Worker proxy  
   → Alist now supports CF Worker proxy for GD

3. Other issues may arise — feel free to report or comment

---


