# 小学数学计算题闯关游戏

> 基于 Vue 3 + Vite + Pinia + Supabase 的 H5 闯关游戏

## 快速启动

```bash
cd math-game
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`

## 环境变量

项目根目录 `.env`：

```env
VITE_SUPABASE_URL=https://jajxhtlwxphlpevmxewk.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

**注意：** Supabase key 需要从 Supabase Dashboard 获取。

## 技术栈

- **前端：** Vue 3 + Vite + Pinia + Vue Router + Element Plus
- **后端：** Supabase（PostgreSQL + REST API + Auth）
- **部署：** Vercel / 静态托管

## 项目结构

```
src/
├── views/
│   ├── SelectView.vue      # 年级选择（1~6年级）
│   ├── MapView.vue           # 地图关卡（SVG路线+关卡点）
│   ├── PlayView.vue          # 答题页（4种题型）
│   ├── ResultView.vue        # 结果页（得分+星星+用时）
│   └── TeacherView.vue       # 教师端统计（班级数据）
├── components/
│   ├── LevelNode.vue         # 地图关卡点（锁定/解锁/通关）
│   └── MathBlank.vue         # 数学填空输入框
├── stores/
│   ├── auth.js               # 登录状态（学生信息）
│   ├── game.js               # 游戏状态（答题进度、结果）
│   └── progress.js           # 闯关进度（解锁逻辑）
├── lib/
│   ├── supabase.js           # Supabase 客户端
│   └── api.js                # API 封装层
└── router/
    └── index.js              # 路由配置
```

## 数据库表结构

| 表 | 说明 |
|----|------|
| `classes` | 班级信息 |
| `students` | 学生信息（班级码+昵称）|
| `questions` | 题库（12册，JSONB格式）|
| `progress` | 闯关记录（成绩、用时、错题）|

## 题型支持

| 题型 | 组件 | 适用年级 |
|------|------|---------|
| `oral` | 口算 | 1~2年级 |
| `vertical` | 竖式计算 | 3~4年级 |
| `step` | 脱式计算 | 4~5年级 |
| `equation` | 方程 | 5~6年级 |

## 已完成的文档

- `任务拆解.md` — 10天完整任务清单
- `接口契约.md` — 数据格式 + API 接口 + 子任务分工
- `README.md` — 本文件

## 关键修复记录

| 日期 | 问题 | 修复 |
|------|------|------|
| 7/8 | Supabase URL 多了 `db.` 前缀 | 去掉 `db.` |
| 7/8 | 地图关卡写死为5关 | 改为从数据库动态生成 |
| 7/8 | `answers` 用 `ref({})` 不响应 | 改为 `reactive({})` |
| 7/8 | 所有题 blank ID 重复导致答案覆盖 | 每道题答案独立存储 |
| 7/8 | `history.state` 刷新丢失 | 改用 Pinia `gameStore.lastResult` |
| 7/8 | `gameStore.js` 重复代码 | 清理重写 |

## 已知问题

1. 教师端统计页只有基础框架，聚合查询待完善
2. 主题切换（长城/西游记）尚未实现
3. 题库只插入了30道测试题（3年级×3册），需要生成12册完整题库
4. 竖式计算题（vertical）的 DOM 对齐待优化
5. 音效/动画反馈尚未添加

## 下一步（优先级）

1. **M4：教师端统计页** — 完善班级正确率、薄弱知识点、易错题排行
2. **M5：主题切换** — 长城/西游记两套主题（CSS变量+图标切换）
3. **M6：题库生成脚本** — Python + AI 批量生成12册3500道题
4. **M7：集成测试 + 部署** — 全链路测试后部署到 Vercel

## 子任务可外包项

| 任务 | 交付物 | 输入文档 |
|------|--------|---------|
| 题库生成（12册）| 12个 JSON 文件 | `接口契约.md` 第1.1/1.2节 |
| 主题美术素材 | 背景图+关卡图标（AI生成）| 设计稿 |
| 教师端统计页 | `TeacherView.vue` | `接口契约.md` 第2.2节 |
| 音效素材 | 答对/通关/错误音效 | 需求描述 |

## 联系/继续

- 项目根目录：`D:\Dekstop\practice\game\math-game\`
- Supabase 项目：`jajxhtlwxphlpevmxewk`
- 当前运行：`npm run dev` → `http://localhost:3000`
