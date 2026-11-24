# Kitchen Workspace

当前范围：菜品首页、添加菜品页面。

## 当前技术架构

- GitHub：代码仓库和版本管理
- Cloudflare Pages：前端静态页面托管
- Cloudflare Pages Functions：菜品和照片 API
- Cloudflare D1：菜品记录
- Cloudflare R2：成品照片

当前项目原本是纯静态 HTML/CSS/JS，没有 Next.js、TypeScript 或服务端运行需求。当前范围优先采用 Cloudflare 原生静态部署，不强行迁移到 Next.js。需要云端数据时，通过 Pages Functions 访问 D1/R2，而不是让浏览器直接访问数据库或对象存储。

## 代码结构

- `outputs/home.html` / `outputs/home.css`：菜品首页
- `outputs/home.js`：首页渲染与标签筛选
- `outputs/index.html` / `outputs/styles.css`：添加菜品页面
- `outputs/app.js`：表单交互、校验和保存编排
- `outputs/js/dish-repository.js`：Demo / Cloudflare D1 菜品保存接口
- `outputs/js/photo-uploader.js`：照片预览 / Cloudflare R2 上传接口
- `outputs/js/demo-data.js`：本地 Demo 数据
- `functions/api/dishes.js`：D1 菜品 API
- `functions/api/photos.js`：R2 照片上传与读取 API
- `schema.sql`：D1 数据表结构
- `wrangler.example.toml`：Cloudflare Pages、D1、R2 绑定示例

页面组件不直接处理数据库细节，数据保存和照片上传都通过独立接口完成。

## Demo 与 Cloudflare 模式

默认 `apiEnabled` 未开启时，页面使用内存 Demo 状态：

- 不使用 `localStorage`
- 不上传照片
- 不写入云端
- 刷新页面后新建记录不会保留
- 页面会明确提示当前是本地 Demo

配置 `window.__KITCHEN_CONFIG__ = { apiEnabled: true, apiBaseUrl: '/api' }` 后，页面会调用 Cloudflare API：

- `POST /api/photos`：上传图片到 R2
- `GET /api/photos?key=...`：读取 R2 图片
- `GET /api/dishes`：从 D1 读取菜品
- `POST /api/dishes`：将菜品记录写入 D1

当前 API 示例未加入用户认证和权限隔离。正式多人使用前，需要增加 Cloudflare Access、Workers/Pages Functions 身份校验或其他认证方案，并在 D1 中增加用户标识。

## Cloudflare 初始化

1. 创建 D1 数据库和 R2 bucket。
2. 将 `wrangler.example.toml` 复制为自己的 Wrangler 配置，并填入真实 D1 database ID。
3. 在 Cloudflare D1 控制台执行 `migrations/0001_create_dishes.sql`。
4. 在 Cloudflare Pages 项目的 Settings → Functions → Bindings 中添加：
   - D1 Database：变量名 `DB`
   - R2 Bucket：变量名 `PHOTOS`
5. 当前 `outputs/runtime-config.js` 已默认开启 `apiEnabled: true`。
6. 重新部署 Pages，让 `functions/api` 与 `outputs` 一起发布。

如果使用 Wrangler，也可以执行等价的 D1 迁移命令：

```bash
wrangler d1 execute kitchen-workspace --remote --file=./migrations/0001_create_dishes.sql
```

D1/R2 绑定由 Cloudflare 服务端提供，前端不需要也不应该持有数据库密钥、R2 密钥或任何 Service Token。当前 API 没有用户认证，部署前应确认站点访问范围；否则任何能访问页面的人都可能调用写入接口。

## GitHub 与 Cloudflare Pages

1. 将项目提交到 GitHub。
2. 在 Cloudflare Pages 选择 **Connect to Git**。
3. 连接 GitHub 仓库。
4. 如果使用 `wrangler.example.toml` 对应的 Pages 配置，输出目录为 `outputs`。
5. 静态文件无需 Next.js 构建命令；如果未来引入构建工具，再补充 build command。
6. 配置 D1/R2 绑定后，每次 push 会自动部署。

## 手机浏览器测试

启动本地静态服务：

```bash
python3 -m http.server 4173 --bind 0.0.0.0 --directory outputs
```

电脑和手机连接同一个 Wi‑Fi 后，在手机访问：

```text
http://电脑局域网IP:4173/home.html
```

首页的“添加菜品”按钮会跳转到 `index.html`。本地测试默认是 Demo 模式；Cloudflare API 需要部署 Functions 并启用 `apiEnabled` 后才会真正写入 D1/R2。
