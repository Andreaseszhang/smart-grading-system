# AI 主观题批改系统

基于 AI 的智能主观题批改系统，采用 5 分制评分，提供升级答案建议、错题追踪和正向激励反馈。

## 功能特性

### 学生端
- ✅ **AI 智能批改**：提交答案后秒级获得 AI 批改结果
- ✅ **5 分制评分**：1-需要加强、2-及格、3-中等、4-良好、5-优秀
- ✅ **升级答案建议**：针对当前分数，提供可背诵的升级答案模板
- ✅ **详细反馈**：优点、不足、学习建议
- ✅ **正向激励**：鼓励话语、学习小贴士、进步提示
- ✅ **错题本**：自动标记 3 分及以下的题目，支持复习追踪

### 教师端
- ✅ **题目创建**：快速创建主观题，设置参考答案和评分标准
- ✅ **AI 配置**：支持 OpenAI、Claude、智谱 AI 多种模型
- ✅ **本地存储**：所有数据存储在浏览器 IndexedDB，无需服务器

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **开发语言**：TypeScript
- **UI 组件库**：DaisyUI + Tailwind CSS 4.0
- **本地数据库**：IndexedDB (通过 Dexie.js)
- **AI 服务**：
  - OpenAI (GPT-4o-mini)
  - Anthropic Claude (Claude 3.5 Sonnet)
  - 智谱 AI (GLM-4-Flash) - 待实现
- **数据验证**：Zod

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 3. 配置 AI 服务

1. 进入教师端（首页点击"进入教师端"）
2. 点击"配置 AI"按钮
3. 选择 AI 服务商并填写 API Key：

#### OpenAI 配置
- **Provider**: OpenAI
- **API Key**: 以 `sk-` 开头的密钥
- **Model** (可选): `gpt-4o-mini` (默认) 或其他模型
- **API 地址** (可选): 自定义 API 地址（使用代理时）

获取 API Key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

#### Claude 配置
- **Provider**: Claude
- **API Key**: 以 `sk-ant-` 开头的密钥
- **Model** (可选): `claude-3-5-sonnet-20241022` (默认)
- **API 地址** (可选): 自定义 API 地址

获取 API Key: [https://console.anthropic.com/](https://console.anthropic.com/)

#### 智谱 AI 配置
- **Provider**: 智谱 AI
- **API Key**: 智谱 AI 的 API Key
- **Model** (可选): `glm-4-flash` (默认)

获取 API Key: [https://open.bigmodel.cn/](https://open.bigmodel.cn/)

> 注意：智谱 AI Provider 尚未完全实现，请使用 OpenAI 或 Claude。

### 4. 创建题目

1. 在教师端填写题目信息：
   - 题目标题
   - 题目内容
   - 参考答案
   - 评分标准（可选，帮助 AI 更准确评分）
2. 点击"创建题目"

### 5. 开始答题

1. 回到首页，点击"开始答题"进入学生端
2. 选择题目
3. 输入答案
4. 提交后查看 AI 批改结果

## 项目结构

```
grading-system-v2/
├── app/
│   ├── api/
│   │   ├── grade/          # 批改 API
│   │   └── config/         # AI 配置验证 API
│   ├── student/
│   │   ├── answer/         # 学生答题页面
│   │   ├── result/[id]/    # 批改结果页面
│   │   └── wrong-report/   # 错题本页面
│   ├── teacher/
│   │   └── create/         # 教师创建题目页面
│   ├── page.tsx            # 首页
│   ├── layout.tsx          # 根布局
│   └── globals.css         # 全局样式
├── lib/
│   ├── ai/
│   │   ├── providers/      # AI 服务提供商
│   │   │   ├── openai.ts
│   │   │   └── claude.ts
│   │   └── prompts/        # AI 提示词
│   │       └── grading.ts
│   └── db/
│       └── index.ts        # IndexedDB 数据库配置
├── types/
│   └── index.ts            # TypeScript 类型定义
└── package.json
```

## 数据存储

所有数据都存储在浏览器的 IndexedDB 中，包括：

- **questions**: 题目信息
- **submissions**: 学生提交记录和批改结果
- **configs**: AI 配置信息

### 数据特点
- ✅ **本地存储**：无需服务器，数据存储在浏览器
- ✅ **隐私安全**：数据不会上传到任何服务器（除了批改时调用 AI API）
- ⚠️ **不跨设备同步**：数据仅存储在当前浏览器
- ⚠️ **清除缓存会丢失**：清除浏览器缓存会删除所有数据

## 5 分制评分标准

| 分数 | 标签 | 说明 |
|-----|------|------|
| 5 分 | 优秀 | 完全正确，论述全面深入，逻辑清晰 |
| 4 分 | 良好 | 基本正确，有一定深度，逻辑较清晰 |
| 3 分 | 中等 | 部分正确，论述一般，逻辑一般 |
| 2 分 | 及格 | 有对的内容，但问题较多 |
| 1 分 | 需要加强 | 大部分错误或严重偏题 |

**错题标记**：3 分及以下自动标记为错题，加入错题本。

## 批改结果包含

1. **分数和评级**：1-5 分及对应标签
2. **升级答案建议**：
   - 目标分数（当前分数 + 1）
   - 可背诵的答案模板
   - 关键要点列表
   - 建议背诵时间
3. **详细反馈**：
   - 优点
   - 待改进之处
   - 学习建议
4. **激励话语**：
   - 鼓励消息
   - 学习小贴士
   - 进步提示

## 常见问题

### 为什么 AI 批改失败？

1. 检查 AI 配置是否正确（教师端 -> 配置 AI）
2. 确认 API Key 是否有效且有余额
3. 检查网络连接是否正常
4. 查看浏览器控制台错误信息

### 数据能导出吗？

目前版本不支持数据导出功能。如需备份数据，建议：
- 使用浏览器的 IndexedDB 查看工具手动导出
- 或者在代码中添加导出功能

### 如何清空所有数据？

在浏览器开发者工具中：
1. 打开 Application / 应用程序 标签
2. 找到 IndexedDB -> GradingDB
3. 删除整个数据库

### 支持哪些浏览器？

支持所有现代浏览器：
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 环境变量

本项目无需配置环境变量，所有 API Key 都存储在浏览器 IndexedDB 中。

> ⚠️ 注意：这意味着 API Key 存储在客户端，请确保在可信任的环境中使用。

## 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 点击部署

### 其他平台

本项目是标准的 Next.js 14 应用，可以部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- Render
- 自托管 (使用 `npm run build && npm start`)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 作者

达鲲主观题批改系统

---

**技术支持**：基于 Next.js 14 + TypeScript + DaisyUI + IndexedDB 构建
