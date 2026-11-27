# 代码评审与交付验收

结合需求、系统上下文和实际 diff 理解改动；检查功能、设计、复杂度、命名、兼容、安全、并发和测试是否抓得住错误。核对所有承诺、证据版本和未完成部分，区分阻断缺陷、非阻断建议与个人偏好。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 8.1 结合上下文评审功能、复杂度和断言，区分阻断缺陷与偏好

用于所有需评审的变更，重点是承诺和风险实际变化的部分。

- 工程入口　现有 Git diff、CI、测试及代码导航。
- 可复用代码　无。
- 专业判断　评审者判断简化是否保留语义，断言是否能抓住错误。
- 验收　阻断意见有可定位影响及处理结果，纯风格由已有格式工具或项目约定解决。

采纳自Google Engineering Practices 的 What to look for 与 Standard。[原文 1](https://google.github.io/eng-practices/review/reviewer/looking-for.html) [原文 2](https://google.github.io/eng-practices/review/reviewer/standard.html)

## 8.2 沿调用与消费者核实完成主张及被删除的约束

用于重构、删旧路径、替换实现、变更共享契约。

- 工程入口　Git 历史、引用与消费者回归测试。
- 可复用代码　若已有契约适用于多个实现，复用同一契约测试集。
- 专业判断　评审者核实动态入口、配置和实际数据流，判断遗漏风险。
- 验收　原承诺在替代路径仍成立，故意移除的行为有明确决定和影响范围。

采纳自BMad claims-check/deletion-check 与 Trail of Bits differential-review。[原文 1](https://github.com/bmad-code-org/BMAD-METHOD/blob/e435a22574fe55722841086e5566420178b98df3/skills/method/bmad-build/references/claims-check.md) [原文 2](https://github.com/trailofbits/skills/blob/149d7b21f4067765b82e67029730b42d228ef4b4/plugins/differential-review/skills/differential-review/SKILL.md)

## 8.3 逐项核对承诺、当前修订与所需批准

用于合并、独立放行、需求范围变化。

- 工程入口　从变更入口回读项目契约和实际消费者，将承诺与断言、最终修订的原生 PR 检查及审批身份核对。发现漏项时，把回归加在最能观察该行为的现有套件。
- 可复用代码　已有平台缺少关联时复用读取修订与原始检查状态的适配器。
- 专业判断　验收方裁决证据够不够，授权者接受剩余风险。
- 验收　实际候选修订上的必需承诺有依据，旧版本批准、空报告或无权签字无法触发放行。

采纳自墨线 MX-G-71 的功能覆盖、BMad claims-check 与 Spec Kit gate 实现的边界。[原文 1](https://github.com/bmad-code-org/BMAD-METHOD/blob/e435a22574fe55722841086e5566420178b98df3/skills/method/bmad-build/references/claims-check.md) [原文 2](https://github.com/github/spec-kit/blob/f2010547121b3351e4923fe467205079e4593a32/workflows/speckit/workflow.yml)
