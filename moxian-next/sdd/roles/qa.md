# 测试与质量工程

从承诺、代码风险和故障模式设计验证对象与 oracle；覆盖等价类、边界、拒绝、状态转换、异常恢复、并发和兼容。选择能稳定观察该错误的最低充分层，管理数据、隔离、清理、环境与失败诊断。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 7.1 用能区分正确与错误实现的最小充分环境

用于缺陷修复、业务边界变更、跨服务回归。

- 工程入口　原有单元、组件或集成 runner 直接运行。
- 可复用代码　相同环境初始化反复出现时复用夹具。
- 专业判断　测试职责选择断言和层级，说明替身可代表什么。
- 验收　缺陷用例能在旧行为上失败、在修复后通过，原应保持的行为仍成立。

采纳自Superpowers test-driven-development/systematic-debugging 与 Google Test Sizes。[原文 1](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/test-driven-development/SKILL.md) [原文 2](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/systematic-debugging/SKILL.md) [原文 3](https://testing.googleblog.com/2010/12/test-sizes.html)

## 7.2 按原生语义读取命中、失败、跳过、重试与终态

用于有必查回归、CI 过滤测试或允许重试。

- 工程入口　go test、Vitest、Playwright 及项目的原生失败策略。
- 可复用代码　原生门禁无法识别必查对象漏跑时，跨任务复用按工具版本验证过的结果读取器。
- 专业判断　测试负责人指定必查对象和可接受状态，评审断言是否覆盖承诺。
- 验收　必查对象未运行、被跳过或结果不完整时可识别，能从相应运行定位失败。

采纳自Go test/test2json、Vitest JSON 与 Playwright reporter。[原文 1](https://pkg.go.dev/cmd/test2json) [原文 2](https://vitest.dev/guide/reporters) [原文 3](https://playwright.dev/docs/test-reporters)

## 7.3 验证被测服务已就绪，等待用户实际能观察的行为

用于本地起服务、端口复用、长轮询或后台任务。

- 工程入口　原生 webServer、就绪 URL、locator 等待及 trace。
- 可复用代码　现有服务无法辨认版本或初始化状态时，多个测试套件复用同一个就绪端点。
- 专业判断　确定就绪条件和真实外部依赖的证据范围。
- 验收　以正确实例和已知数据运行，必要失败保留诊断，所启动服务按预期清理。

采纳自Playwright webServer/Best Practices 与 Anthropic webapp-testing 的 helper 对照。[原文 1](https://playwright.dev/docs/test-webserver) [原文 2](https://github.com/anthropics/skills/blob/e4bb5d960d87126ff3b3a8af1a104b7db67560ba/skills/webapp-testing/scripts/with_server.py)

## 7.4 选测与旧证据复用取决于声明的依赖

用于多包仓、共享库变化、配置或数据会影响测试。

- 工程入口　项目已有 affected/explain、CI 必跑项与原生缓存。局部改动验证实际入口，边界涉及共同契约时包括消费者；依赖范围未知时运行项目全量。
- 可复用代码　工程缺少结果关联时复用 CI 元数据适配，缓存继续交原生工具。
- 专业判断　判断依赖是否完整，外部状态能否可靠固定。
- 验收　变动共享依赖会选中相应消费者，配置缺失时扩大检查，实际合并结果有有效证据。

采纳自Nx 24 affected/inputs 与 Bazel 缓存输入约束。[原文 1](https://nx.dev/docs/features/ci-features/affected) [原文 2](https://bazel.build/remote/caching)
