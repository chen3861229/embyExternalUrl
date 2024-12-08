### 主要功能
| 名称 | 功能 |
| - | :- |
| [emby2Alist](./emby2Alist/README.md) | emby/jellyfin 重定向到 alist 直链 |
| embyAddExternalUrl | emby/jellyfin 全客户端(除老TV端)添加调用外部播放器按钮 |
| [embyWebAddExternalUrl](./embyWebAddExternalUrl/README.md) | emby/jellyfin/alistWeb 调用外部播放器用户脚本,只支持网页 |
| [plex2Alist](./plex2Alist/README.md) | plex 重定向到 alist 直链 |

### 常见问题
[FAQ](./FAQ.md)

# embyExternalUrl

### emby调用外部播放器服务端脚本

通过nginx的njs模块运行js脚本,在emby视频的外部链接处添加调用外部播放器链接,所有emby官方客户端可用,
不支持老 TV 客户端等没有外部媒体数据库链接处的情况,另外需要注意电视端内置的 web view 实现方式的兼容性

![](https://raw.githubusercontent.com/bpking1/pics/main/img/Screenshot%202023-02-06%20191721.png)


### 部署方式,任选一种

## 一.单独使用方式

这里采用的是docker安装,也可以不使用docker,自己安装njs模块

先下载脚本:
```bash
wget https://github.com/bpking1/embyExternalUrl/releases/download/v0.0.1/addExternalUrl.tar.gz && mkdir -p ~/embyExternalUrl && tar -xzvf ./addExternalUrl.tar.gz -C ~/embyExternalUrl && cd ~/embyExternalUrl
```

然后看情况修改externalUrl.js文件里面的serverAddr

tags 和 groups是从视频版本中提取的关键字作为外链的名字,不需要就不用改

emby.conf默认反代emby-server是本机的8096端口,按需修改

docker-compose.yml默认映射8097端口,按需修改

然后启动docker
```
docker-compose up -d
```
访问8097端口,在视频信息页面的底部就添加了外部播放器链接

日志查看:
```
docker logs -f nginx-embyUrl 2>&1 | grep error
```

## 二.与 emby2Alist 整合并共存

1. 将 externalUrl.js 放到 emby2Alist 的 conf.d 下与 emby.js 处于同一级

2. 将 emby.conf 中的 ## addExternalUrl SETTINGS ## 之间的内容复制到 emby2Alist 的 emby.conf 中 location / 块的上面

3. 将 emby.conf 最上面的 js_import 复制到 emby2Alist 的 emby.conf 相同位置

4. 重启 ngixn 或者输入命令 nginx -s reload 重载配置文件,注意此时使用 emby2Alist 的 nginx 对应端口访问

### emby调用外部播放器用户脚本,只支持网页:

[篡改猴地址](https://greasyfork.org/zh-CN/scripts/514529)

## 捐赠

如果这个项目对你有帮助,欢迎点亮一颗⭐️,假如条件允许,可以请我喝杯咖啡,感谢你对开源精神的认可与支持!

### Payments
Alipay: <img src="./donate/Alipay.jpg" width="150px">
Wechat: <img src="./donate/Wechat.jpg" width="170px">

BTC(SegWit): <img src="./donate/BTC(SegWit).jpg" width="150px">
USDT-Tron (TRC20): <img src="./donate/USDT-Tron (TRC20).jpg" width="150px">

Binance ID/币安 ID: 1041685683

BTC
1. Network: BTC(SegWit)
2. Deposit Address: bc1qvr80l9juwkg94mpe55wafpwwnqtzjfs9tje8zn

USDT
1. Network: Tron (TRC20)
2. Deposit Address: TSsmBGRhtN2AZHSG7WtvYN2UZ3dLdtMpUN
