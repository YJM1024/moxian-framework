# 前端工程

实现产品与交互契约、状态结构、表单与校验、数据获取、缓存和失效、权限表现、路由和历史、下载上传、可访问语义、样式与响应式、国际化和格式、浏览器兼容及性能。分清服务端事实、用户编辑和可派生状态；避免重复状态和互相矛盾的布尔组合。

根据实际变化选用对应条目。现有工程能力足够时直接使用，复用代码栏给出重复缺口应归属的位置。

## 4.1 保留输入与选择，计算派生值，消除矛盾状态

用于多步骤表单、筛选、选择列表、草稿回显。

- 工程入口　React 状态与项目组件测试。
- 可复用代码　多界面共享同一状态转换时复用 reducer 或既有领域模块。
- 专业判断　前端区分服务器事实、本地编辑和初始默认值。
- 验收　切换、返回与刷新后显示对应选择，提交字段与界面一致。

采纳自React Choosing the State Structure。[原文 1](https://react.dev/learn/choosing-the-state-structure)

## 4.2 被替代的请求失去对同一界面的更新权

用于搜索联想、切换账户、异步预览、在途取消。

- 工程入口　优先路由或查询库的取消/失效功能，原生 fetch 与 AbortSignal 负责支持的传输中止。
- 可复用代码　现有库缺少更新保护且多处需要时，公共请求模块统一处理成功、失败和结束回调。
- 专业判断　前端与产品决定独立操作、后台继续和取消的语义。
- 验收　控制响应顺序，旧成功或旧失败不覆盖新结果，旧请求结束不提前解除新请求的等待状态。

采纳自React useEffect 的清理与 DOM AbortSignal。[原文 1](https://react.dev/reference/react/useEffect#fetching-data-with-effects) [原文 2](https://dom.spec.whatwg.org/#using-abortcontroller-and-abortsignal-objects-in-apis)

## 4.3 按数据依赖安排并行，并限定缓存键与复用范围

用于多源详情页、导航重复请求、租户切换。

- 工程入口　已有查询缓存、请求跟踪及浏览器 Network。
- 可复用代码　项目只有重复的业务缓存键或失效逻辑时才集中实现。
- 专业判断　前端与后端确定身份、时效与授权依赖。React 服务端缓存规则只用于相应运行时。
- 验收　独立请求能重叠，依赖授权的请求仍有序。切换身份后只呈现当前主体的数据。

采纳自Vercel async-dependencies、server-cache-react、client-swr-dedup。[原文 1](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/react-best-practices/SKILL.md)

## 4.4 依据观测选择延后加载或预加载

用于首屏过慢、罕用编辑器很大、交互延迟或布局偏移。

- 工程入口　查看生产构建分包、性能轨迹及已有用户侧度量。
- 可复用代码　有多个入口需要相同加载行为时复用现有加载组件。
- 专业判断　前端选择目标设备、网络条件、指标及可接受的交互代价。
- 验收　同类条件下比较改动前后，首屏和后续交互都满足已定目标。

采纳自Vercel bundle-dynamic-imports、bundle-preload 与 Web Vitals。[原文 1](https://github.com/vercel-labs/agent-skills/blob/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/react-best-practices/SKILL.md) [原文 2](https://web.dev/articles/vitals)

## 4.5 从用户可识别的入口验证可观察结果

用于交互组件、键盘操作、浏览器文件操作。

- 工程入口　角色/名称定位、自动等待、原生下载事件与文件读取。
- 可复用代码　多处流程共享相同初始化数据时复用测试夹具。
- 专业判断　前端与测试决定哪些性质必须由真实浏览器证明。
- 验收　定位的控件和最终文件或状态正确，错误路径可恢复。等待条件对应实际行为。

采纳自Testing Library About Queries 与 Playwright Downloads/Best Practices。[原文 1](https://testing-library.com/docs/queries/about/) [原文 2](https://playwright.dev/docs/downloads)
