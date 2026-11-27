# 墨线 · 下一版

这一版墨线从项目已有契约出发，以工程原生检查验收需求。它提供一个共同流程、11 个按需读取的专业角色、按原契约查阅条款、按 Git 变更运行工程检查的可选工具和 Go 结果检查器，以及三个能独立运行的项目示例。现有项目继续使用自己的工单、代码、契约、测试和发布平台。

[返回仓库首页](../README.md)

## 第一次使用

从仓库根目录进入 `moxian-next/`，用 Python 3.10 或更新版本运行。知识查询和结果检查只依赖标准库。

```sh
python3 -m sdd workflow
python3 -m sdd roles
python3 -m sdd topics product backend qa
python3 -m sdd topic 1.3 5.2 7.1
```

从其他工程使用时，可在已有虚拟环境中运行 `python -m pip install /实际路径/moxian-next`，也可直接安装本地 wheel。随后在任何工作目录运行 `sdd workflow`、`sdd role backend` 或 `sdd check-go --help`。源码安装的构建后端是 setuptools。离线使用可直接从源码运行，或安装预先构建的 wheel。

## 在现有工程接入

1. 在原需求中确定用户结果、要保留的行为和会改变实现的边界例子。缺陷已有复现时可直接引用它。
2. 确认项目已有的测试、契约、构建和发布入口。按本次影响读取对应角色，例如变更可选字段时查看 backend 和 data。每条能力包含来源、触发条件、原生执行、复用代码的适用条件、专业判断和验收判据。
3. 实现变更并运行工程已有的检查。普通任务可直接使用 CI 原始结果。若确实需要某个命名 Go 回归用例运行，则在原测试步骤接入下述检查器。
4. 在现有工单或 PR 对照承诺与结果。工程检查针对实际合并结果或部署产物，由既有评审完成剩余专业判断。需要发布时沿项目发布权限与观测执行。中断后核对副作用和旧结果的有效范围。

程序依赖用现有 CI 的 job/required checks 表达。接入方可把稳定的检查名列为合并条件，并在既有 CI 留存对应修订、工具版本与原始产物。检查政策应来自受保护配置。修改公共契约时由受影响的消费者验证实际语义。详情见[共同流程](sdd/skills/spec-driven-delivery/SKILL.md)。

## 工具与适用范围

| 入口 | 可观察的结果 |
|---|---|
| `sdd workflow` | 共同流程及失败恢复的边界 |
| `sdd roles`、`sdd role <slug>` | 发现角色或仅读取一个角色，条目附原始来源 |
| `sdd topics [角色 ...]`、`sdd topic 编号 [编号 ...]` | 从角色原文列出标题，按编号读取完整条目，保留适用条件、执行方式、专业判断、验收和来源。可跨角色一次查阅 |
| `sdd check-go --events PATH --exit-code N --package PKG --test NAME` | 读取已有的单次 Go JSONL 与同次进程退出码，检查包终态及精确命名的必查测试。多个必查项重复传入 `--test` |
| `sdd test-go --package PKG --test NAME -- ./...` | 工程需要本次运行且要求点名验收时，直接调用 PATH 中的 `go test -json` 一次，并核对同一子进程的退出码与用例。按需加 `--events PATH` 原样留存成功或失败的事件 |

检查器接受原生缓存输出，识别失败、必查项跳过、未命中、可检测的截断和重复运行。检查具体子测试时传 Go 输出中的完整名字。无关测试的 skip 由项目政策决定。一次输入对应一次独立的 Go 运行。报告本身不能证明产物身份、运行环境或断言充分性，这些事实由 CI 和评审建立。退出码 0 表示该命令满足判据，1 表示缺口或不能读取资源，2 表示命令参数错误。

普通包测试直接运行 `go test ./...`。已有 CI 执行且能提供精确结果时沿用该次记录。需要点名运行时，由工程维护必查项；`--` 后的包、筛选器和其他标志交给 Go。持续留存复用固定的 CI 步骤，每次运行使用独立的产物位置。

## 从项目条款到工程检查

从项目已有契约取成功、拒绝、恢复和旧行为的条件，逐项回到公开入口和实际消费者的断言。已有 JSON Schema、类型或契约套件时直接执行。对于 Markdown，`sdd contract 'specs/files.md#PRD-FILE-001' 'docs/file-api.md#1.2'` 可一次列出两个完整章节及来源行号。标识可用 ATX 标题、标题首个编号或标题后独立的 HTML id；重名或找不到时返回非零。程序准确取回已写下的条款，业务冲突的解释及断言是否充分由交付者和评审确认。

先用项目自己的 affected 命令、测试或 CI 处理影响范围。缺少现有入口且需跨需求复用时，可由工程维护一份可信 JSON 策略。下面示例中的名称和参数应替换为项目已有命令。路径以仓库根为起点，尾部斜杠匹配目录。`checks` 里要列全可能需要回退的原生检查。

```json
{
  "checks": {
    "api": {"cwd": "server", "argv": ["go", "test", "./..."]},
    "ui": {"cwd": "web", "argv": ["npm", "test"]}
  },
  "rules": [
    {"paths": ["server/"], "contracts": ["docs/file-api.md#1.2"], "checks": ["api"]},
    {"paths": ["web/"], "contracts": ["docs/file-api.md#1.2"], "checks": ["ui"]}
  ],
  "shared": [".github/workflows/"]
}
```

`sdd impact --base HEAD --policy project-checks.json` 预览当前工作树改动及所选检查，加上 `--run` 即执行。CI 传入实际对比基线。修改契约的生产方时，同一契约的消费者随之验证。变更路径未知、Git 索引仍有合并冲突或契约影响范围不清楚时，运行策略声明的全套检查。解决冲突后，按最终工作树重新选测。项目 CI 继续执行必跑的合并检查。

Go 检查失败时优先显示缺失用例、失败的包和有限的相关诊断。用 `test-go --events PATH` 可保留同次原始事件，CI 已有的报告可用 `check-go` 直接核对。

## 三条可复跑的路径

| 需求 | 选择的验证与完成条件 |
|---|---|
| [预约取消窗口](examples/reservations/README.md) | 在 Go 直接验证 24 小时边界。需要保证一个特定子测试实际执行时，复用同一个证据读取器 |
| [保存通知偏好](examples/web-preferences/README.md) | Vitest 验证存储值，Playwright 验证用户主动保存、刷新及失败恢复。使用原生服务启动与报告 |
| [工单优先级迁移](examples/sqlite-migration/README.md) | 旧新客户端与历史数据并存，直接用 SQLite 事务和两个连接验证兼容、收紧约束及失败回滚 |

在宿主支持 Agent Skills 时，可将本包的 `sdd/skills/spec-driven-delivery/` 目录作为 skill 使用。其入口与 `sdd workflow` 来自同一文件。专业角色位于 [sdd/roles](sdd/roles)，也能直接阅读。单执行者按需连续履行各角色。

## 维护和发布

知识单元的权威运行时正文位于 `sdd/roles/*.md`。更新单元时核对该单元的来源版本、原实现、适用条件和验收例子。更新 CLI 时在本 README 所在目录运行 `python3 -m unittest discover -s tests -v`。在源码外安装发行包后再读取共同流程和角色，能够发现漏打包资源。

仓库的 [墨线下一版 CI 配置](../.github/workflows/moxian-next.yml) 包含框架安装、证据检查和示例的验证步骤。三个项目样例各自复用工程原生命令。接入另一个工程时按实际风险选用对应入口。性能、发布、独立审批等专业条件以接入项目的真实环境为依据。
