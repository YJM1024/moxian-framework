# 通知偏好示例

这个示例演示如何用现有前端工具验收一条小需求。用户可以设置每周提醒偏好，勾选只修改当前页面，点击「保存偏好」才会写入当前浏览器的本地存储。写入失败时页面给出可见反馈，保留勾选值供重试。

| 验收条目 | 原生证据 |
|---|---|
| AC-save · 只有主动保存的值才在刷新后恢复 | Playwright 打开真实 Vite 页面，验证未提交的修改随刷新丢弃，提交后页面报告成功且刷新保留选中值。Vitest 验证开和关两种值，以及缺失或无法识别的值按关闭处理 |
| AC-retry · 写入失败时保留选择，之后可以重新保存 | Playwright 在真实浏览器让首次本地存储写入抛错，检查错误反馈与选择保留，然后重试并刷新验证保存结果 |

## 本地复跑

在本目录使用 Node.js 22.12+（22.x）、24.x 或 26+ 和 npm。首次使用 Playwright 自带 Chromium 时安装它。

```sh
npm ci
npm exec -- playwright install chromium
npm exec -- vitest run tests/unit
npm exec -- playwright test
```

也可以把 `PREFS_CHROME_EXECUTABLE` 设为已安装 Chrome 的可执行文件路径，省去 Chromium 安装。浏览器测试通过 Playwright 的 `webServer` 启停 Vite，使用本机 4173 端口。已有服务占用端口会使测试失败。

## 留存原生结果

```sh
mkdir -p artifacts
npm exec -- vitest run tests/unit --reporter=json --outputFile=artifacts/vitest.json
PLAYWRIGHT_JSON_OUTPUT_FILE=artifacts/playwright.json npm exec -- playwright test --reporter=json
```

直接检查退出状态、命名用例及两份 JSON 中的实际结果。本例的两套 runner 能直接执行并提供所需证据，无需额外适配器或测试报告。证据覆盖当前浏览器中的偏好存取和失败恢复。实际提醒投递、跨设备同步和读屏公告属于其他验收环境。
