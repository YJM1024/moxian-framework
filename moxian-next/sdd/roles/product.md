# 产品与需求

理解真实用户、使用情境、问题、业务目标、现有行为和约束；把事实、假设、解决方案分开。识别利益相关者和决定权。明确范围、优先级、非目标、成功口径、业务规则、权限差异、数据范围、异常和恢复。分别约定本次可验收的行为和上线后要观察的用户结果，没有基线或样本时保留未知。用具体例子确认重要边界，按用户价值拆出可独立交付的切片；对尚未证实的需求，选择会改变决定的访谈、观察、原型或实验。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 1.1 查用户最近一次怎样完成任务、付出了什么代价，分别标明观察和推断

用于新服务、投诉原因不明或目标用户改变。

- 工程入口　查询已有反馈、支持记录及分析数据。
- 可复用代码　无。
- 专业判断　产品判断样本代表谁、是否需要补访谈。
- 验收　能指出目标用户、行为和依据。仍影响选择的假设有取证办法或由负责人明确决定。

采纳自GOV.UK《Learning about users and their needs》与 PM Skills interview-script。[原文 1](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs) [原文 2](https://github.com/phuryn/pm-skills/blob/9af7bfd0bc47fdad43c2eaa7a43cd13918e7aaef/pm-product-discovery/skills/interview-script/SKILL.md)

## 1.2 按可独立使用的用户结果拆需求，为切片写可观察的成功条件

用于新功能太大，多个渠道或身份分期交付。

- 工程入口　沿用原工单与已有依赖关系。
- 可复用代码　无。
- 专业判断　产品决定本次范围、保留的旧行为及非目标。
- 验收　下游能独立演示本次结果。推迟的能力及依赖可辨认。

采纳自GOV.UK《Writing user stories》与 Spec Kit spec-template。[原文 1](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories) [原文 2](https://github.com/github/spec-kit/blob/f2010547121b3351e4923fe467205079e4593a32/templates/spec-template.md)

## 1.3 将规则、正反例和未决问题分开。结果未知的例子交有决定权者确认

用于会员资格、预约取消、计费边界等存在多种解释。

- 工程入口　工单保存决定，已确定例子进入项目现有测试。
- 可复用代码　反复使用的业务判定集中在领域函数中。
- 专业判断　产品决定边界时刻、角色和例外。
- 验收　逐项回到受影响的项目条款和调用方，对照现有测试里的业务断言。缺失的成功、拒绝、恢复或兼容条件补进相应测试，边界两侧产生各自约定的结果。

采纳自Example Mapping。[原文 1](https://cucumber.io/blog/bdd/example-mapping-introduction/)

## 1.4 按假设失效后果与已有证据决定先验证什么

用于多个方案竞争资源，尚不确定用户是否需要或能否实现。

- 工程入口　复用现有研究或分析结果。
- 可复用代码　无。
- 专业判断　负责人选择能改变决定的最小实验，说明什么观察会推翻假设。
- 验收　功能验收与上线成效各有口径。样本不足时保留未知，评分只在尺度和用途明确时使用。

采纳自PM Skills prioritize-assumptions 与作者 Assumption Prioritization Canvas。[原文 1](https://github.com/phuryn/pm-skills/blob/9af7bfd0bc47fdad43c2eaa7a43cd13918e7aaef/pm-product-discovery/skills/prioritize-assumptions/SKILL.md) [原文 2](https://www.productcompass.pm/p/assumption-prioritization-canvas)
