# Joan's Academic Hub

> ⚖️ *"以圣洁纯粹之心，行理性严谨之事；以温和坚定之志，守学术求真之本。"*
> — 贞德・达尔克，裁定者

一个面向学术研究者的个人学术网站系统，采用前后端分离架构。前端为 React 19 单页应用，内置 Mock 模式，无需后端即可完整运行。可选后端基于 EdgeOne Cloud Functions + KV Storage。

## ✨ 功能特性

- 🔐 **认证系统** — 固定管理员登录（admin/123456），localStorage 会话持久化
- 📊 **学术仪表盘** — 统计卡片、阅读热力图（Recharts）、活动时间线、Joan 语录
- 📚 **文献库** — 全文搜索、多条件筛选排序、30+ 篇真实 GNN/HGNN/欺诈检测论文
- 📄 **论文详情** — 完整信息展示、引用导出（BibTeX / IEEE / GB/T 7714-2015）
- 🔬 **研究项目管理** — 项目 CRUD、关联论文、目标跟踪、进度管理
- ⚙️ **设置** — 主题切换、引用格式偏好、个人信息管理
- 👤 **管理面板** — 用户管理、数据概览
- 📤 **导入/导出** — 批量论文导入、数据导出（JSON/CSV）
- 🌙 **深色/浅色模式** — 完整的 Tailwind CSS 变量主题系统
- 📱 **响应式设计** — 移动端/平板/桌面端适配

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2.x |
| 语言 | TypeScript | 6.0.x |
| 构建工具 | Vite | 8.0.x |
| 路由 | react-router-dom (HashRouter) | 7.0.x |
| 样式 | Tailwind CSS | 3.4.x |
| UI 组件 | shadcn/ui (Radix UI + CVA) | — |
| 动画 | Framer Motion | 12.x |
| 图表 | Recharts | 2.12.x |
| 部署 | EdgeOne Pages | — |

## 🚀 快速开始

### 从 GitHub 克隆

```bash
git clone https://github.com/zixilee666-svg/academic-hub.git
cd academic-hub
npm install
npm run dev
```

### 部署到 EdgeOne Pages

```bash
# 安装 EdgeOne CLI
npm install -g edgeone
edgeone login

# 构建并部署
npm run build
npx edgeone pages deploy -n academic-hub
```

详见 [docs/使用说明书.md](docs/使用说明书.md)。

### 从 EdgeOne Pages 导入

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 点击「导入项目」→「GitHub 仓库」
3. 选择 `zixilee666-svg/academic-hub`
4. 构建命令：`npm run build`
5. 输出目录：`dist`
6. 点击部署

## 📁 项目结构

```
academic-hub/
├── src/                          # 源代码
│   ├── main.tsx                  # 入口文件
│   ├── App.tsx                   # 路由 + Provider
│   ├── pages/                    # 8 个页面组件
│   ├── components/               # UI + 布局 + 共享组件
│   ├── context/                  # Auth/Theme/Settings 上下文
│   ├── lib/                      # API 客户端 + 工具函数
│   ├── data/                     # 30+ 篇真实论文数据
│   └── types/                    # TypeScript 类型定义
├── public/                       # 静态资源
├── _cloud-functions-bak/         # 后端函数备份（可选）
├── _edge-functions-bak/          # 边缘函数备份（可选）
├── scripts/                      # 管理脚本
├── docs/                         # 文档
│   └── 使用说明书.md              # 完整使用指南
└── 配置文件                       # package.json, vite.config.ts, tailwind.config.js 等
```

## 🔑 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |

## 📖 相关仓库

| 仓库 | 说明 |
|------|------|
| [academic-prompt](https://github.com/zixilee666-svg/academic-prompt) | 可复现前端的 AI Prompt（WorkBuddy + EdgeOne 自动部署） |
| [academic-skill](https://github.com/zixilee666-svg/academic-skill) | WorkBuddy Skill 定义（自动化项目生成） |

## 📄 License

MIT

---

*May the light of knowledge guide your path.* ⚖️
