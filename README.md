# 月满 · 中秋祝福

一个以月下庭院为灵感的动态中秋祝福页，使用 Vite + React + TypeScript 构建。

当前版本使用 5 张竖屏参考图制作成一页一页的沉浸式章节体验，并包含接月饼小游戏、祝福切换、灯笼按钮和音乐控制。

## 本地运行

```bash
npm install
npm run dev
```

## 添加中秋音乐

将合法来源的音频文件放入：

```text
public/audio/mid-autumn.mp3
```

页面右上角的音乐按钮会在用户点击后播放。浏览器通常会阻止页面自动播放声音，因此需要用户主动点击开启。

## 构建部署

```bash
npm run build
```

`dist` 目录可以直接用于 GitHub Pages、Cloudflare Pages 或其他静态托管服务。
