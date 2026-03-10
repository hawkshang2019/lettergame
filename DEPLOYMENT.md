# 单词训练游戏 - 部署指南

## 项目概述
这是一个基于React + Vite构建的小学生英语单词训练游戏，支持离线使用。

## 构建状态
✅ 生产版本已构建完成
- 构建时间：2.19秒
- 输出目录：`dist/`
- 文件大小：
  - HTML: 0.81 kB (gzip: 0.49 kB)
  - CSS: 9.14 kB (gzip: 2.33 kB)
  - JS: 178.78 kB (gzip: 57.00 kB)

## 部署方式

### 1. 静态文件部署（推荐）
将 `dist/` 目录下的所有文件上传到任何静态文件托管服务：

**支持的平台：**
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- 阿里云OSS
- 腾讯云COS
- 七牛云
- 任何静态文件服务器

### 2. 本地预览生产版本
```bash
npm run preview
```

### 3. 自定义域名部署
如果需要自定义域名，确保配置正确的HTTPS（PWA功能需要HTTPS）。

## 部署步骤

### 方式一：使用Netlify（最简单）
1. 将代码推送到GitHub
2. 登录 [Netlify](https://netlify.com)
3. 连接GitHub仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 点击部署

### 方式二：使用GitHub Pages
1. 在GitHub仓库设置中启用Pages
2. 选择部署分支：`gh-pages`（需要创建）
3. 构建命令：`npm run build`
4. 部署目录：`dist`

### 方式三：手动部署到服务器
1. 将 `dist/` 目录上传到服务器
2. 配置Web服务器（如Nginx）指向该目录
3. 确保支持SPA路由（配置重定向到index.html）

## 技术特性

### PWA支持
- Service Worker已注册
- 支持离线使用
- 可安装到桌面

### 性能优化
- 代码分割和压缩
- 资源缓存策略
- 响应式设计

## 环境要求
- 现代浏览器（支持ES6+）
- HTTPS环境（PWA功能需要）
- 静态文件服务器支持

## 故障排除

### 常见问题
1. **空白页面**：检查控制台错误，确保所有资源路径正确
2. **路由问题**：配置服务器将所有路由重定向到index.html
3. **PWA不工作**：确保在HTTPS环境下部署

### 构建命令
```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview
```

## 联系方式
如有部署问题，请检查控制台错误信息或联系开发人员。