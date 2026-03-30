# LocalTube

YouTube 风格的本地媒体库与播放器：添加本机文件夹后自动扫描、缩略图、可选 HLS 转码，浏览器内播放。

## 环境要求

- **Python** 3.11+
- **Node.js** 18+
- **FFmpeg**（需包含 `ffmpeg` 与 `ffprobe`，并在 `PATH` 中可用）

### 安装 FFmpeg

- **macOS**：`brew install ffmpeg`
- **Ubuntu / Debian**：`sudo apt update && sudo apt install ffmpeg`
- **Windows**：从 [ffmpeg.org](https://ffmpeg.org/download.html) 下载，将 `bin` 加入系统 PATH

## 快速开始

### 一键启动（推荐）

在项目根目录执行其一：

- **Windows**：双击 **`start.bat`**，或在 PowerShell/CMD 中执行 `.\start.bat`
- **任意系统（已装 Node）**：`npm install`（根目录，首次）后执行 **`npm start`**（同一终端同时跑后端 + 前端，`Ctrl+C` 结束）

然后浏览器打开 **http://localhost:5173**，在设置中添加媒体文件夹并点击扫描。

### 手动分步启动

1. 复制 `.env.example` 为 **`backend/.env`**（可选；Windows 可配置 `FFMPEG_PATH` / `FFPROBE_PATH`）
2. **后端**：`cd backend`，`pip install -r requirements.txt`，`uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
3. **前端**：`cd frontend`，`npm install`，`npm run dev`
4. 或使用 **`start.sh`（macOS/Linux）**（两个独立终端窗口）

## 工作原理（HLS）

对多数需转码的视频，后端用 FFmpeg 生成多码率 HLS（`master.m3u8` + `.ts` 分片），前端通过 **HLS.js** 播放。对已满足 **H.264 + AAC** 的 MP4，可标记为 **直接串流**（支持 Range 拖动进度）。

## 浏览器支持

Chrome 90+、Firefox 88+、Safari 14+、Edge 90+（Safari 对 HLS 亦可使用原生播放）。

## 支持的格式

**视频**：mp4、mkv、webm、avi、mov、m4v、flv、wmv、ts、m2ts  

**图片**：jpg、jpeg、png、gif、webp、bmp、tiff、heic（部分格式依赖系统解码）

**音频**（含 Telegram 投递）：mp3、wav、m4a、ogg、flac、aac、opus、wma 等

## Telegram Bot

可将 Telegram 作为「网盘入口」：向 Bot 发送或转发媒体，文件会保存到本机目录并进入媒体库（可选自动扫描、转码、转发到频道）。

### 前置条件

- 在 [@BotFather](https://t.me/BotFather) 创建 Bot 并获取 **Token**
- 准备一个频道，并将 Bot 设为管理员且具备 **发消息** 权限（若需转发到频道）

### 配置步骤

1. 打开 **设置 → Telegram Bot**
2. 填写 **Token** 并测试连接
3. 填写 **频道 ID**（如 `@mychannel` 或数字 ID `-100...`）并测试
4. 设置 **保存目录**（本机绝对路径，将自动创建子目录 `videos/`、`photos/` 等）
5. 按需编辑说明模板，保存后打开 **启用**

### 文件大小限制

普通 Bot API **下载上限约 20 MB**。若需更大文件，请自建 [Telegram Bot API](https://github.com/tdlib/telegram-bot-api) 服务，并在配置中填写 **本地 Bot API URL**（或环境变量 `TELEGRAM_LOCAL_API_URL`）。

### 用户 ID

向 [@userinfobot](https://t.me/userinfobot) 发消息可查看自己的数字 ID，用于「允许的用户」白名单（留空表示不限制）。

### 说明模板变量

| 变量 | 含义 |
|------|------|
| `{filename}` | 原始文件名 |
| `{size}` | 人类可读大小 |
| `{duration}` | 时长（视频/音频） |
| `{date}` | 接收时间 |
| `{sender}` | 发送者 |
| `{media_type}` | 类型文案 |
| `{resolution}` | 分辨率（若有） |

支持 HTML：`<b>`、`<i>`、`<code>` 等。

## 播放器快捷键

| 按键 | 作用 |
|------|------|
| 空格 / K | 播放 / 暂停 |
| ← / J | 后退 5s / 10s |
| → / L | 前进 5s / 10s |
| ↑ / ↓ | 音量 ±10% |
| M | 静音 |
| F | 全屏 |
| P | 画中画 |
| 0–9 | 跳转到 0%–90% |
| [ / ] | 上一条 / 下一条（队列） |

## 数据存放位置

默认在用户目录下 **`~/.localtube/`**（Windows 为 `%USERPROFILE%\.localtube\`）：

- **`localtube.db`**：SQLite 数据库  
- **`thumbnails/`**：缩略图缓存  
- **`hls/`**：转码后的 HLS 输出  

可通过环境变量 **`DATA_DIR`** 覆盖数据根目录（见 `backend/config.py` / pydantic-settings）。

从旧版本升级时若启动报错缺少列（如 `audio_count` 或 Telegram 表），可备份后删除 **`localtube.db`** 再启动以自动建表（会丢失库内索引数据）。

## 性能说明

首次扫描会对视频生成缩略图并可能进行整片转码，耗时与 CPU、磁盘及素材量相关。转码完成后再次播放主要读取本地分片，体验会明显更流畅。

## 项目结构

- `backend/`：FastAPI、SQLite、扫描与 FFmpeg 管线  
- `frontend/`：React + Vite + Tailwind 单页应用  

API 文档（后端运行后）：**http://localhost:8000/docs**
