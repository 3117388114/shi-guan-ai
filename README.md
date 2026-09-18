# 食管癌防治早筛平台（Web MVP）

这是一个健康科普与风险评估研究/演示原型，不用于临床诊断，不代表医疗建议。

## 启动

后端（局域网可访问）：`cd backend`，`pip install -r requirements.txt`，`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

前端（局域网可访问）：`cd frontend`，`npm install`，`npm run dev`。Vite 已固定监听 `0.0.0.0:5173`。

访问 Vite 输出的地址。接口：`GET /api/health`、`GET /api/questionnaire`、`POST /api/assessment`。

## 模型说明

当前为透明的规则评分原型，变量与分值仅用于演示产品流程，未声明为经临床验证的中国人群模型。后续应由专业团队完成变量确认、数据治理、外部验证和伦理合规。

## 开源参考与版权

需求中列出的 Smart Forms、Frankr22、EAST、YOHO 本版本未直接复制代码，因当前未进行许可证核验；它们只能作为后续研究入口。接入前需逐一确认 LICENSE、版权声明与再分发条件。

## 医疗免责声明

平台内容用于健康教育与风险沟通。出现持续或明显不适时应咨询专业医疗人员，不能以本平台结果替代检查、诊断或治疗。

## 公网部署

推荐：前端使用 Vercel，后端使用 Render Docker Web Service。两者都有免费入门方案，且支持 HTTPS。

1. 将本目录推送到 GitHub。
2. 在 Render 创建 Web Service，连接仓库，Dockerfile 选择 `backend/Dockerfile`，Docker context 选择 `backend`。健康检查路径填 `/api/health`。
3. Render 环境变量设置 `CORS_ORIGINS=https://你的-vercel-域名.vercel.app,http://localhost:5173`。部署后得到 `https://xxx.onrender.com`。
4. 在 Vercel 导入同一仓库，Root Directory 选择 `frontend`，Build Command 为 `npm run build`，Output Directory 为 `dist`。
5. Vercel 环境变量设置 `VITE_API_URL=https://xxx.onrender.com`，然后重新部署。

Vercel 部署后的域名就是公网前端地址，手机和电脑直接通过该 HTTPS 地址访问。PWA 在 HTTPS 域名下可重新“添加到主屏幕”。首次访问 Render 免费实例可能有冷启动延迟。

### 推送 GitHub

```powershell
git add .
git commit -m "prepare production deployment"
git branch -M main
git remote add origin https://github.com/你的用户名/esophageal-screening.git
git push -u origin main
```

不要提交 `.env`、密钥、密码、`node_modules` 或 Python 虚拟环境；仓库已包含 `.gitignore` 和 `.env.example`。
