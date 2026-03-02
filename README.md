# 🚀 Enterprise E-Commerce Fullstack Platform

基于 Vue 3 + NestJS 构建的企业级全栈电商平台。采用标准的领域驱动设计（DDD）思想，支持高可扩展的业务模块，包含完整的 C 端购物流程与核心的后端 API 服务。

## 🛠 技术栈选型

### 前端 (Frontend)
- **核心框架**: Vue 3 (Composition API) + `<script setup>`
- **语言**: TypeScript (严格模式)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **网络请求**: Axios (企业级二次封装)
- **UI 组件库**: Element Plus / Tailwind CSS

### 后端 (Backend)
- **核心框架**: NestJS (模块化架构)
- **语言**: TypeScript
- **ORM 框架**: Prisma (强类型数据库操作)
- **数据库**: MySQL / PostgreSQL
- **参数校验**: class-validator & class-transformer

## 📁 目录结构

```text
ecommerce-fullstack/
├── frontend/               # Vue 3 前端工程
│   ├── src/
│   │   ├── api/            # 接口统一定义
│   │   ├── components/     # 全局复用组件
│   │   ├── router/         # 路由配置 (含权限拦截)
│   │   ├── store/          # Pinia 状态
│   │   ├── utils/          # 工具类 (request.ts 等)
│   │   └── views/          # 视图层 (C端模块、用户中心等)
├── backend/                # NestJS 后端工程
│   ├── prisma/             # 数据库模型与迁移文件
│   └── src/
│       ├── common/         # 全局拦截器、过滤器、守卫
│       ├── modules/        # 业务模块 (Auth, Product, Order 等)
│       └── main.ts         # 后端入口
└── README.md