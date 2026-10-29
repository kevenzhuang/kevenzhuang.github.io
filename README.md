# kevenzhuang.github.io

Personal homepage of Zijun (Keven) Zhuang.

## 部署（第一次）
1. 在 GitHub 上新建仓库，名字必须是 `kevenzhuang.github.io`（Public）。
2. 把这个文件夹里的所有文件（包括隐藏文件 `.nojekyll`）上传到仓库根目录：仓库页面 → Add file → Upload files → 拖进去 → Commit。
3. 仓库 Settings → Pages → Source 选 "Deploy from a branch"，Branch 选 `main` / `(root)` → Save。
4. 一两分钟后打开 https://kevenzhuang.github.io 。

## 以后怎么更新
| 想改什么 | 改哪里 |
|---|---|
| 头像 | 替换 `assets/img/profile.jpg`（竖版，约 4:5） |
| 简历 | 替换 `assets/cv.pdf` |
| 自我介绍 / News / 研究 / 项目 | `index.html`，每块都有注释 |
| 生活照片 | 放到 `assets/img/life/`，再在 `life.html` 里复制一段 `<figure>` 改文件名和说明 |

照片建议先压缩到宽 1600px 以内、每张 500KB 以下，网页会快很多。

## 文件
- `index.html` 主页（About, News, Research, Projects, Experience, Education, 梯度下降小游戏）
- `life.html` 生活页（照片墙）
- `404.html` 访问不存在的网址时出现的自由潜小游戏
- `assets/` 样式、脚本、图片
