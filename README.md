# 🌿 AI 健康伴侣（AI Health Companion）

面向个人用户的 **AI + 健康管理应用**，聚焦 **饮食健康** 与 **睡眠健康** 两大场景，产品理念：**"零焦虑、重陪伴"**。
核心闭环：**无感采集 ➔ 智能评估 ➔ 最小可执行微行为 ➔ 形成正循环**。

## 📁 项目结构

```
├── prototype/          # 高保真交互原型（纯 HTML/CSS/JS，浏览器直接打开）
│   ├── index.html      # V1.3 · 15 个页面 + 锁屏通知演示
│   ├── test/           # 测试版：验收清单 / A/B 换肤 / 深色 / 操作日志
│   ├── macos/          # macOS 风格原型（Apple 设计语言：菜单栏 / Dock / 毛玻璃）
│   └── docs/           # 文档中心构建产物（MkDocs 输出，/docs 访问）
├── docs/               # 产品文档（MkDocs 源文件）
│   ├── index.md        # 文档中心首页
│   ├── SRS.md          # 软件需求规格说明书 V1.1
│   ├── 原型页面-功能清单.md    # 页面 × 功能点 × 需求编号 完整对照
│   ├── 健康伴侣-功能清单.md    # 产品功能清单 V1.2 整合版
│   ├── 行业调研报告.md
│   ├── 穿戴设备接入方案-小米手环.md  # M5 手环接入：Health Connect/HealthKit 主通道 + 实操步骤
│   └── 协作工作台SOP.md
├── mkdocs.yml          # 文档中心配置（Material 主题，构建到 prototype/docs）
└── vercel.json         # Vercel 部署配置（根路径 → 原型）
```

## 🖥️ 在线访问

- 原型演示（正式版）：`/`（自动重定向至 `prototype/index.html`）
- **测试版（BETA）**：`/test`（验收清单 / A/B 换肤 / 深色模式 / 操作日志）
- **macOS 版**：`/mac`（Apple 设计语言 · 菜单栏 / Dock / 毛玻璃 / 深浅色切换）
- **文档中心**：`/docs`（MkDocs Material · 需求 / 功能清单 / 调研 / 接入方案）
- 本地预览：`open prototype/index.html`

## 🚀 部署（Vercel）

项目未连接 GitHub 集成，部署走 git-less API（`scripts/deploy-vercel.py`）：

```bash
VTOKEN=<你的 Vercel Token> python3 scripts/deploy-vercel.py
```

1. Token 获取：Vercel → Account Settings → Tokens → Create（Full Account 权限）
2. 脚本自动 `git archive HEAD` 打包当前代码 → 上传文件 → 创建 production 部署
3. 部署完成输出线上 URL，约 1 分钟生效

> 若需推送即自动部署：GitHub 安装 Vercel App 并授权本仓库后，在 Vercel 项目 Settings → Git 连接仓库即可。
> 国内网络推送到 GitHub：`git config --global --unset-all url.https://ghproxy.net/https://github.com/.insteadof && git -c http.https://github.com.proxy=socks5h://127.0.0.1:7890 push origin main && git config --global --add url.https://ghproxy.net/https://github.com/.insteadof https://github.com/`

## 🗺️ 里程碑

| 阶段 | 范围 |
|------|------|
| M1 需求与原型 | 本文档 + 原型走查 ✅ |
| M2 MVP | 账号、饮食记录（拍照/语音）、能量分析、Dashboard、七要素基础诊断 |
| M3 闭环 Beta | 睡眠、Agent 任务、手机+锁屏通知、节律陪伴、反馈回流 |
| M4 V1.0 | 七大要素完整诊断、起居注卡片、跨餐记账、报告、订阅 |
| M5 后期 | 手环/手表绑定与穿戴通知（Apple Watch / 小米 / 华为 / 三星） |
