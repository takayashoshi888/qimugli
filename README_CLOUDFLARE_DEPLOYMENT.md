# 考勤群Link Pro - Cloudflare 部署指南

本文档详细介绍了如何将本项目从本地 Mock 数据版本，改造为基于 Cloudflare Pages + D1 数据库的全栈应用，并通过 GitHub 自动部署。你可以将此文档提供给 AI IDE（如 Cursor, Windsurf, GitHub Copilot 等）作为开发和部署的上下文指南。

## 架构概览

*   **前端**: React + Vite (部署在 Cloudflare Pages)
*   **后端/API**: Cloudflare Pages Functions (基于 Hono 或原生 Cloudflare Workers API)
*   **数据库**: Cloudflare D1 (Serverless SQLite)
*   **部署**: GitHub 仓库关联 Cloudflare Pages 自动构建

---

## 阶段一：环境配置与 D1 数据库创建

### 1. 安装 Wrangler CLI
Wrangler 是 Cloudflare 的官方命令行工具。
```bash
npm install -g wrangler
# 登录你的 Cloudflare 账号
wrangler login
```

### 2. 创建 D1 数据库
使用 Wrangler 创建一个新的 D1 数据库：
```bash
wrangler d1 create fieldlink-db
```
*注意：执行后，终端会输出一段配置代码，请将其保存，稍后需要填入 `wrangler.toml` 中。*

### 3. 配置 `wrangler.toml`
在项目根目录创建 `wrangler.toml` 文件，配置 Pages 和 D1 绑定：
```toml
name = "fieldlink-pro"
compatibility_date = "2024-03-20"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB" # 在代码中通过 env.DB 访问
database_name = "fieldlink-db"
database_id = "你的-database-id-填在这里"
```

---

## 阶段二：数据库表结构设计与初始化

### 1. 编写 SQL Schema
在项目根目录创建 `schema.sql`，定义用户表、考勤记录表等：
```sql
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- 实际应用中需哈希加密
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 其他表结构（如考勤记录、项目等）根据 types.ts 补充
```

### 2. 初始化本地和线上数据库
```bash
# 初始化本地数据库（用于开发测试）
wrangler d1 execute fieldlink-db --local --file=./schema.sql

# 初始化线上数据库
wrangler d1 execute fieldlink-db --remote --file=./schema.sql
```

---

## 阶段三：API 接口开发 (Pages Functions)

在项目根目录创建 `functions` 文件夹，Cloudflare Pages 会自动将其路由为 API。

### 1. 数据库连接测试接口
创建 `functions/api/test-db.ts`：
```typescript
export async function onRequest(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM users LIMIT 1").all();
    return Response.json({ success: true, data: results });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
```

### 2. 登录与注册接口
创建 `functions/api/auth/login.ts` 和 `functions/api/auth/register.ts`。
*AI IDE 提示词：请帮我用 Cloudflare Pages Functions 编写登录和注册接口，从 `env.DB` 读取和写入用户数据，并使用简单的 JWT 或 Session 机制返回 Token。*

### 3. 业务数据接口
创建如 `functions/api/records.ts` 用于处理考勤数据的增删改查。

---

## 阶段四：前端逻辑改造

当前项目使用的是 `services/mockData.ts` 进行本地数据模拟。需要将其替换为真实的 API 请求。

### 1. 修改数据保存与获取方式
将 `DataService` 中的同步方法（如 `DataService.login`）改造为异步的 `fetch` 请求。

*AI IDE 提示词：请帮我把 `services/mockData.ts` 中的本地数据操作，全部替换为调用 `/api/...` 的 `fetch` 请求，并处理好 async/await 和错误捕获。*

### 2. 修改登录逻辑 (`App.tsx`)
将 `App.tsx` 中的 `handleLogin` 和 `handleRegister` 改为异步函数：
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... 验证逻辑
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setCurrentUser(data.user);
      // 保存 token 到 localStorage
    } else {
      setAuthError(data.message);
    }
  } catch (err) {
    setAuthError('网络错误');
  }
};
```

---

## 阶段五：本地联调测试

使用 Wrangler 启动本地开发服务器，它会同时启动前端 Vite 和后端的 Functions，并绑定本地 D1 数据库：

```bash
# 构建前端
npm run build

# 使用 wrangler 启动全栈本地测试
wrangler pages dev dist
```
*注意：在开发阶段，你也可以配置 Vite 的 proxy 将 `/api` 代理到 wrangler 启动的端口，以便享受前端热更新。*

---

## 阶段六：推送到 GitHub 并部署到 Cloudflare

### 1. 提交代码到 GitHub
```bash
git add .
git commit -m "feat: migrate to Cloudflare D1 and Pages Functions"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 2. 在 Cloudflare Dashboard 中配置部署
1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
2. 点击 **Create application** -> **Pages** -> **Connect to Git**。
3. 选择你刚刚推送的 GitHub 仓库。
4. 配置构建设置：
   - **Framework preset**: `Vite` 或 `React`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **关键步骤：绑定 D1 数据库**
   - 在部署设置的下方，找到 **Environment variables** 和 **Bindings**（可能需要先保存并部署一次，然后在项目的 Settings -> Functions -> D1 database bindings 中配置）。
   - 添加一个 D1 绑定：Variable name 填 `DB`，Database 选择你之前创建的 `fieldlink-db`。
6. 重新部署（Retry deployment）。

### 3. 配置环境变量 (可选)
如果你的 API 用到了 JWT Secret 或第三方 API Key（如 Gemini API Key），请在 Cloudflare Pages 项目的 **Settings -> Environment variables** 中添加，并在代码中通过 `context.env.GEMINI_API_KEY` 获取。

---

## 给 AI IDE 的系统提示词总结

如果你使用 Cursor 或 Windsurf，可以将以下 prompt 发给 AI 助手，让它帮你一步步完成上述代码修改：

> "我需要将当前基于本地 mockData 的 React 项目重构为全栈项目，部署到 Cloudflare Pages。后端使用 Cloudflare Pages Functions，数据库使用 Cloudflare D1。
> 
> 请帮我按以下步骤执行：
> 1. 生成 `wrangler.toml` 配置文件和 `schema.sql` 数据库建表语句。
> 2. 在 `functions/api/` 目录下创建后端的登录、注册、数据增删改查接口，使用 `env.DB.prepare().bind().all()` 等 D1 API。
> 3. 重写 `services/mockData.ts`（可重命名为 `api.ts`），将所有本地数组操作替换为对 `/api/...` 的 `fetch` 异步请求。
> 4. 修改 `App.tsx` 和相关页面的状态管理，适配异步的 API 请求逻辑，并处理好 Loading 和 Error 状态。
> 5. 确保所有 TypeScript 类型定义 (`types.ts`) 前后端保持一致。"
