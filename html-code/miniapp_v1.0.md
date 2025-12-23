# WeFix 小程序端开发与使用指南 v1.0

本文档提供 WeFix（Taro 微信小程序端）的代码构成说明、本地开发运行方式、微信开发者工具使用方法、以及按角色（客户/维修师傅）的详细使用流程。

## 目录

- [项目概览](#项目概览)
- [代码构成](#代码构成)
- [开发环境要求](#开发环境要求)
- [本地启动（小程序端）](#本地启动小程序端)
- [配置后端地址与联调](#配置后端地址与联调)
- [微信开发者工具导入与预览](#微信开发者工具导入与预览)
- [功能使用说明（详细）](#功能使用说明详细)
- [联调自检清单](#联调自检清单)
- [故障排查](#故障排查)

## 项目概览

WeFix 小程序端基于 **Taro 3.6.38 + React** 开发，核心目标是实现：

- 客户：注册/登录、提交维修工单、查看/取消/评价工单
- 维修师傅：注册/登录、查看待处理工单、接单、完工

后端默认通过 HTTP 接口提供服务（默认地址 `http://127.0.0.1:3000`）。

## 代码构成

小程序端代码位于：`html-code/taro/`

### 目录结构

```text
html-code/taro/
  config/
    index.js                  # Taro 编译配置、别名、后端地址注入（defineConstants）
  src/
    app.tsx                   # 应用入口（全局初始化）
    app.config.ts             # 小程序页面路由与 tabBar
    pages/                    # 页面（路由）
      home/                   # 首页：订单列表（按角色展示）
      create-order/           # 下单页（客户）
      order-detail/           # 订单详情页（客户可改/取消，师傅查看）
      login/                  # 登录页（选择客户/师傅身份）
      register/               # 注册页（支持注册客户/师傅）
      profile/                # 个人中心：登录状态、历史订单、退出登录
      privacy/                # 隐私页（占位）
    services/
      api.ts                  # 统一请求封装 + 业务 API（登录/注册/订单等）
      storage.ts              # 本地存储封装（set/get/remove）
    assets/                   # tabbar 图标等静态资源
  project.config.json         # 微信开发者工具项目配置（miniprogramRoot 指向 dist）
  package.json                # 脚本：dev:weapp / build:weapp
  tsconfig.json               # TS 配置与路径别名
```

### 关键文件说明

- `src/app.config.ts`
  - 声明页面路由与 tabBar（首页/下单/我的）。
- `src/services/api.ts`
  - 统一封装请求：自动注入 `Authorization: Bearer <token>`。
  - 维护登录态：token 存 `wefix_auth_token`，用户信息存 `wefix_current_user`。
- `config/index.js`
  - 通过 `defineConstants` 注入后端地址到业务代码：`process.env.VITE_API_BASE_URL`。
  - 默认值为 `http://127.0.0.1:3000`。

## 开发环境要求

### 必要软件

- **Node.js**：建议 18.x LTS
- **npm**：随 Node 安装
- **微信开发者工具**：用于预览/真机调试

### 安装依赖

在 `html-code/taro/` 目录执行：

```bash
npm install
```
## 启动小程序的操作
### 本地启动（小程序端）

在 `html-code/taro/` 目录执行(本机)：

```bash
npm run dev:weapp
```

以下为说明：

- 该命令会进入 watch 模式，持续编译到 `html-code/taro/dist/`
- 命令行里出现 `Compiled successfully` 表示前端编译成功
- 这不是后端启动日志；后端需要在 `backend_code/` 单独启动

### 远程后端启动(配置后端地址与联调)

在 `html-code/taro/` 目录执行(本机)：

```bash
npm run dev:weapp
```
 以下为说明

小程序端请求后端的地址来自 `html-code/taro/config/index.js` 的 `defineConstants`：

- `process.env.VITE_API_BASE_URL`：后端地址（本地默认 `http://127.0.0.1:3000`）
- `process.env.VITE_API_TOKEN`：预留（通常留空，实际使用登录返回的 token）

上述修改ip就为远程后端

编辑 `html-code/taro/config/index.js`：

```js
defineConstants: {
  'process.env.VITE_API_BASE_URL': JSON.stringify('http://8.138.222.237'),
  'process.env.VITE_API_TOKEN': JSON.stringify('')
}
```



## 微信开发者工具导入与预览

### 1. 导入项目

打开微信开发者工具 → **导入项目**：

- 项目目录：选择 `html-code/taro/`（不要选 dist）
- AppID：使用 `html-code/taro/project.config.json` 内的 `appid`
- 导入后工具会根据 `project.config.json` 的 `miniprogramRoot: "dist/"` 读取编译产物

### 2. 编译与预览

- 先在命令行保持 `npm run dev:weapp` 运行
- 再在微信开发者工具点击 **编译**
- 正常情况下可以看到页面渲染与 tabBar

### 3. 真机调试（可选）

微信开发者工具 → 真机调试，确保手机与电脑在同一网络环境，且后端地址可从手机访问。

## 功能使用说明（详细）

### 角色与账号说明

系统有两种角色：

- 客户：后端角色 `user`，前端展示为 `CUSTOMER`
- 维修师傅：后端角色 `staff`，前端展示为 `TECHNICIAN`

注意：

- 登录页需要选择身份；若“选择身份”与账号实际角色不一致，会提示身份不匹配。
- 注册页可以选择注册为客户或维修师傅（师傅会以 `role=staff` 写入后端）。

### 1. 注册（客户/维修师傅）

入口：登录页点击 **注册**

步骤：

1. 在注册页选择身份（客户/维修师傅）
2. 输入账号（至少 2 位）
3. 输入密码（至少 9 位）
4. 输入姓名
5. 输入手机号（11 位数字）
6. 点击 **注册**

结果：

- 注册成功后会保存 token 与当前用户信息，并跳转首页

### 2. 登录（客户/维修师傅）

入口：tabBar → 我的 → 去登录，或直接打开登录页

步骤：

1. 选择身份：
   - 我是客户：用于客户登录
   - 我是维修师傅：用于师傅登录
2. 输入账号与密码
3. 点击 **登录**

结果：

- 登录成功后进入首页，并可正常调用需要登录的接口

### 3. 客户：下单（提交工单）

入口：tabBar → 下单

步骤：

1. 确保已登录为客户（未登录会提示“请先登录”）
2. 选择分类、服务方式（上门/到店）
3. 填写服务地址与问题描述
4. 填写手机号（11 位）
5. 点击提交

结果：

- 成功后提示“下单成功”，回到首页
- 首页会显示当前进行中的订单列表

### 4. 客户：查看订单与取消/修改

入口：tabBar → 首页 → 点击订单卡片进入详情

可操作项（取决于订单状态与角色）：

- 取消订单：仅客户可取消
- 修改信息：仅客户可修改（地址/描述/联系电话）

### 5. 维修师傅：接单与完工

步骤：

1. 先注册/登录为维修师傅
2. 首页会加载工单列表（待处理等）
3. 点击某个订单并执行接单（接单动作会把工单状态改为处理中）
4. 维修完成后执行完工

说明：

- 后端 `POST /api/orders/:id/take`、`POST /api/orders/:id/finish` 需要 `staff` 角色

### 6. 个人中心：退出登录与历史订单

入口：tabBar → 我的

- 未登录：显示“去登录”
- 已登录：可退出登录；历史订单会显示已完成/已取消的记录

## 联调自检清单

按顺序检查：

1. 后端可访问：`http://127.0.0.1:3000/api/health`（或你的后端地址）
2. 小程序端已编译：命令行 `npm run dev:weapp` 显示 `Compiled successfully`
3. 微信开发者工具导入目录为 `html-code/taro/`，且可正常编译
4. 注册/登录成功后，订单接口不再返回 401

## 故障排查

### 1. 注册失败（400）

常见原因：

- 密码不足 9 位（后端会拒绝）
- 手机号格式不正确
- 用户名已存在、手机号已被注册

处理方式：

- 确认密码长度 ≥ 9
- 换一个用户名/手机号重试

### 2. 下单/拉订单失败（401 Unauthorized）

原因：

- 未登录或 token 未正确保存/注入

处理方式：

1. 在“我的”页退出登录
2. 重新登录
3. 再次进入首页刷新订单

### 3. Taro 提示全局配置不存在

现象：

```text
获取 taro 全局配置文件失败，不存在全局配置文件：...\.taro-global-config\index.json
```

说明：

- 这是提示级 warning，不影响编译与运行

### 4. 编译变慢（建议开启缓存）

可在 Taro 配置中开启持久化缓存以提升二次编译速度，参考 Taro 文档的 cache 配置说明：

- https://docs.taro.zone/docs/config-detail#cache。

