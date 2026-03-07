# 🚀 Enterprise E-Commerce Fullstack Platform

🚀 企业级全栈电商平台 (Vue 3 + NestJS)
本项目采用标准的**领域驱动设计（DDD）**思想，通过 NestJS 的模块化架构与 Vue 3 的 Composition API 协同工作，实现从商品管理到订单支付的完整闭环。

📁 核心目录结构
Plaintext
ecommerce-fullstack/
├── frontend/                   # 前端工程 (Vue 3 + Vite)
│   ├── public/                 # 静态资源 (图标、Logo等)
│   ├── src/                    # 源码目录
│   │   ├── api/                # Axios 接口层 (authApi, productApi 等)
│   │   ├── components/         # 全局复用组件 (上传组件、商品卡片等)
│   │   ├── layout/             # 页面布局 (管理后台侧边栏、前台导航栏)
│   │   ├── router/             # Vue Router 配置 (含导航守卫与鉴权)
│   │   ├── store/              # Pinia 状态管理 (useAuthStore 等)
│   │   ├── utils/              # 工具类 (请求拦截器、格式化工具)
│   │   ├── views/              # 业务页面 (首页、商品管理、登录页等)
│   │   ├── App.vue             # 根组件
│   │   ├── main.ts             # 前端入口文件
│   │   └── style.css           # 全局样式 (含 Tailwind 引入)
│   ├── index.html              # 入口 HTML
│   └── vite.config.ts          # Vite 构建与代理配置
│
├── backend/                    # 后端工程 (NestJS)
│   ├── dist/                   # 编译后的生产代码
│   ├── node_modules/           # 后端依赖库
│   ├── prisma/                 # ORM 核心
│   │   └── schema.prisma       # 数据库模型定义 (User, Product, Order)
│   ├── src/                    # 源码目录
│   │   ├── auth/               # 认证模块 (JWT 策略、登录逻辑)
│   │   ├── common/             # 通用能力 (过滤器、拦截器、守卫)
│   │   ├── modules/            # 核心业务模块
│   │   │   ├── product/        # 商品模块 (CRUD、图片上传逻辑)
│   │   │   ├── order/          # 订单模块 (下单、支付回调模拟)
│   │   │   └── upload/         # 存储模块 (ECS 磁盘存储配置)
│   │   ├── user/               # 用户模块 (地址管理、个人中心)
│   │   ├── app.module.ts       # 根模块 (各业务模块总入口)
│   │   ├── prisma.service.ts   # Prisma 数据库服务单例
│   │   └── main.ts             # 后端入口 (静态资源挂载、CORS配置)
│   ├── uploads/                # 📂 本地图片存储目录 (ECS 硬盘挂载点)
│   ├── .env                    # 环境变量 (数据库连接串、JWT密钥)
│   ├── clean.js                # 数据清理脚本 (清理无效/幽灵订单)
│   └── package.json            # 依赖管理与脚本指令
└── README.md
🛠 技术深度特性
🛡️ 安全与健壮性
身份验证: 基于 Passport-JWT 实现，前端通过 Pinia 自动管理 Token 生命周期。

错误处理: 全局 HttpExceptionFilter 捕获所有异常，确保前端收到的响应格式统一。

数据一致性: 订单支付逻辑封装在 Prisma 的 $transaction 事务中。

📁 文件存储方案 (ECS 本地硬盘版)
存储引擎: 弃用 OSS，采用 multer 的 diskStorage 将图片保存至 backend/uploads/。

静态托管: 通过 NestJS 的 useStaticAssets 结合 Nginx 反向代理，实现高效的图片外网访问。

🏗️ 代码规范
前端: 采用 Vue 3 组合式 API + TS 类型声明，提升组件代码逻辑内聚力。

后端: 严格遵循模块化模式，通过 Dependency Injection (DI) 实现低耦合