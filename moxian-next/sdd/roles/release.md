# 基础设施、构建与发布

负责工程环境、依赖、可重复构建、配置与秘密管理、权限、部署拓扑、版本关联、迁移顺序、发布策略、停止条件、回退和清理。确保被验证与被部署的是相应同一产物，避免环境错配。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 10.1 验证和部署关联到同一产物

用于容器、二进制、静态包或部署配置发布。

- 工程入口　现有构建、制品库摘要、CI 与部署平台。
- 可复用代码　平台缺少产物和部署关联时，复用一次构建元数据映射。
- 专业判断　发布负责人确定哪些配置和迁移版本必须配套。
- 验收　从实际部署能定位到通过验证的产物及适用配置，错版本结果不能放行。

采纳自Google SRE Workbook 第 16 章 Canarying Releases 的构建发布前提。[原文 1](https://sre.google/workbook/canarying-releases/)

## 10.2 分别验证配置表达式和真实 provider 行为

用于模块输入约束、网络或权限配置、资源声明变更。

- 工程入口　terraform validate、test、plan 与已有隔离环境。
- 可复用代码　多个模块共用一项组织约束时复用 IaC 模块或测试输入。
- 专业判断　平台负责人判断 mock 能证明哪些条件、何时需经授权的真实资源验证。
- 验收　输入错误时有对应失败，真实权限或连通性只有在实际环境取得证据才判定通过。

采纳自HashiCorp terraform-test、MOCK_PROVIDERS 与官方 test/mocking。[原文 1](https://github.com/hashicorp/agent-skills/blob/5e30fa5c867ba6777c37e4206babfd08049c396f/plugins/terraform/skills/terraform-test/SKILL.md) [原文 2](https://developer.hashicorp.com/terraform/language/tests/mocking)

## 10.3 核对文件筛选、执行结果及残留资源

用于CI 选择部分测试、创建临时基础设施、运行异常中止。

- 工程入口　使用该版本的文件过滤参数、CLI 最终状态及原生清理记录。
- 可复用代码　平台未保留必要 cleanup 事件时复用结果解析器。
- 专业判断　负责人确认残留归属、是否能安全清理或重试。
- 验收　预期文件确实运行，清理失败保持失败，残留资源通过原生状态确认已处理。

采纳自Terraform 1.17.2 test 参数解析与 JSON test_cleanup。[原文 1](https://developer.hashicorp.com/terraform/internals/machine-readable-ui#test-cleanup) [原文 2](https://github.com/hashicorp/terraform/blob/v1.17.2/internal/command/arguments/test.go)

## 10.4 发布按依赖分阶段，分别处理代码、数据和外部动作的恢复

用于滚动升级、特性开关、新旧版本与共享数据同时存在。

- 工程入口　发布平台的阶段控制、迁移状态与原生暂停/回退。
- 可复用代码　确有数据副作用时复用幂等迁移或补偿入口。
- 专业判断　发布与数据负责人确认停止条件及最后可逆步骤。
- 验收　混合版本可工作，停止后流量和数据处于已知状态，需要恢复的数据在对应环境验证。

采纳自SRE Canarying Releases 与 PostgreSQL ALTER TABLE 的适用条件。[原文 1](https://sre.google/workbook/canarying-releases/) [原文 2](https://www.postgresql.org/docs/18/sql-altertable.html)
