# 架构与技术统筹

查清现有模块、真实调用链、消费者、领域模型、数据和部署边界；识别复用位置、变更热点、约束、容量和失效模式。决定职责、依赖、接口、同步/异步边界、状态归属、可逆性、迁移顺序和受影响方。比较选项的实际后果，避免增加无用户价值的抽象层。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 3.1 从真实调用方、变化热点和领域词义决定模块责任

用于规则在多处重复、模块拆分、团队对同一状态理解不同。

- 工程入口　Git 历史、引用搜索、类型与调用方测试。
- 可复用代码　有共同业务语义时，把规则放到拥有该语义的模块。
- 专业判断　架构与产品确认术语、状态归属及例外。
- 验收　用两个实际调用场景检查边界，调用方依赖的语义在变更后仍成立。

采纳自Matt Pocock improve-codebase-architecture 与 domain-modeling。[原文 1](https://github.com/mattpocock/skills/blob/6f7f7831a625f040a8e06a0e7954826b87ce775a/skills/engineering/improve-codebase-architecture/SKILL.md) [原文 2](https://github.com/mattpocock/skills/blob/6f7f7831a625f040a8e06a0e7954826b87ce775a/skills/engineering/domain-modeling/SKILL.md)

## 3.2 按需要说明参与方、部署边界及调用时序

用于服务拆分、队列接入、外部回调、多个系统同时写入。

- 工程入口　查看现有路由、部署与消息配置。
- 可复用代码　已有边界检查无法表达稳定的禁止依赖时才补项目规则。
- 专业判断　架构判断调用方向、信任边界、超时和副作用归属。
- 验收　实现方能沿实际路径说明谁写入、失败由谁处理。跨服务契约由对应集成检查验证。

采纳自C4 System Context、Container、Dynamic。[原文 1](https://c4model.com/diagrams)

## 3.3 重大取舍保存上下文、候选和后果

用于独立部署、数据格式、共享存储等难以逆转的决定。

- 工程入口　复用现有 PR 或 ADR，已有构建与基准检验技术前提。
- 可复用代码　无框架适配。
- 专业判断　负责人比较调用负担、运行成本、过渡版本、数据可逆性和重新评估条件。
- 验收　能从原记录解释为何选择该方案，迁移或回退所依赖的关键前提有证据。

采纳自MADR 4.0.0 minimal 与 codebase-design/DESIGN-IT-TWICE。[原文 1](https://adr.github.io/madr/) [原文 2](https://github.com/mattpocock/skills/blob/6f7f7831a625f040a8e06a0e7954826b87ce775a/skills/engineering/codebase-design/DESIGN-IT-TWICE.md)
