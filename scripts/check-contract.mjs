#!/usr/bin/env node
/**
 * check-contract.mjs — 墨线契约一致性门禁（零依赖，只读真实仓库；自检只写 .tmp 夹具）
 *
 * 依据：docs/GATES.md 第 3.4 节 MX-G-26 至 MX-G-31，
 *       契约表字段见 docs/templates/contract-table.md，
 *       五列字段见 docs/process/SPEC-STANDARD.md 第 2.3 节。
 *
 * 契约表位置：specs/contract/<域>/contract.md。每个文件按模板的六个类组解析：
 *   类 1 数据形状、类 2 状态机、类 3 错误码、类 4 事件与消息、
 *   类 5 界面几何与选择器、类 6 验收入口。
 *
 * 七条规则：
 *   MX-G-26 契约表存在；六个类组与固定列名齐全；表前状态取 草稿/冻结/已变更，
 *           已变更须写 CC-<变更号>-<序号>；Covers 中的每条 AC 在类 6 至少一行。
 *   MX-G-27 字段名一致：类 1 的字段路径按来源分流到后端与前端，归一化后与
 *           后端 spec 的请求/响应字段、前端 spec 的 props 比对；契约有而 spec
 *           缺的字段记 error，spec 多出的字段记 warn。
 *   MX-G-28 状态值一致：类 2 的状态全集与迁移同设计 spec 状态矩阵、前端 spec
 *           状态转移表比对；UI 对象的状态名限定八态，未知状态名记 error。
 *   MX-G-29 错误码一致：类 3 的 HTTP + code 组合与后端错误码表、前端错误态
 *           逐对比较；code 须匹配 ^[a-z][a-z0-9_]*$，组合不一致记 error。
 *   MX-G-30 选择器一致：类 5 的选择器与设计 spec、前端 spec 的 DOM 锚点比对；
 *           含 nth-child / nth-of-type / 纯位置路径的记 error；只有 class 且无
 *           data-* 或 role 的记 warn。
 *   MX-G-31 编号与覆盖：CT-<段>-<序号> 编号唯一；类 6 每条 AC 在产品 spec 与
 *           测试计划中存在，且能在变更包 Covers 中找到回指。
 *   MX-G-52 数值一致：类 5 的数值项按元素与属性匹配，类 1 的带单位边界值按
 *           概念匹配，五列同行出现同单位数字时与契约值比较；超出容差或集合
 *           不等记 error，类 5 缺单位记 warn。
 *
 * 缺契约表时输出一条 MX-G-26 提示并退出 1，不抛异常；某一列 spec 文件缺失时
 * 该列比对记 warn 并跳过，其余列照常执行。
 *
 * 输出：
 *   每项一行 `[GATE-CONTRACT] <path>:<line> <规则> PASS|FAIL <检查项> 期望=<...> 实际=<...>`
 *   失败细节按 GATES.md：`[GATE-CONTRACT] <path>:<line> MX-G-NN <事实>；<统一为哪一侧的哪个值>`
 *   末两行 `FAILED: <e> error(s), <w> warning(s)` 与 `N passed, M failed`。
 *   退出码 0 无 error，1 有 error，2 参数或根目录错误。
 *
 * 用法：
 *   node scripts/check-contract.mjs
 *   node scripts/check-contract.mjs --root <dir>
 *   node scripts/check-contract.mjs --domain CONV      # 只查一个域
 *   node scripts/check-contract.mjs --json
 *   node scripts/check-contract.mjs --self-test
 *   node scripts/check-contract.mjs --help
 *
 * 已知限制：字段、状态、错误码与选择器从 Markdown 表格提取，依赖五列 spec 把
 * 这些内容写成表；散文里的同义写法不纳入比对。列文件缺失时只报 warn，不推断。
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..')
const GATE = 'CONTRACT'
const AC_RE = /AC-(?:[A-Z0-9]+-){2,}\d+/g
const AC_ONE_RE = /AC-(?:[A-Z0-9]+-){2,}\d+/
const CT_ID_RE = /^CT-(?:[A-Z0-9]+-)+\d+$/
const CODE_RE = /^[a-z][a-z0-9_]*$/
const NA_RE = /N\/A\s*[:：]\s*(?:([^：:，,。；;\s]+)\s*[:：]\s*)?(.{8,})/
const UI_STATES = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'empty', 'error']
const CONTRACT_STATUS = ['草稿', '冻结', '已变更']

const CLASSES = [
  {
    key: 'fields',
    name: '类 1 数据形状',
    test: /数据形状/,
    columns: ['编号', '概念', '实体或端点', '字段路径', '类型', '可空', '默认值', '枚举取值或边界', '来源'],
  },
  {
    key: 'states',
    name: '类 2 状态机',
    test: /状态机/,
    columns: ['编号', '对象', '状态取值全集', '从状态', '到状态', '触发者', '条件与副作用', '非法迁移错误码'],
  },
  {
    key: 'errors',
    name: '类 3 错误码',
    test: /错误码/,
    columns: ['编号', '码值', 'HTTP', '触发条件', '响应附加字段', '是否泄露存在性', '客户端动作'],
  },
  {
    key: 'events',
    name: '类 4 事件与消息',
    test: /事件与消息/,
    columns: ['编号', '事件名', '触发时机', '载荷字段', '顺序依据', '去重键', '补偿方式'],
  },
  {
    key: 'selectors',
    name: '类 5 界面几何与选择器',
    test: /界面几何与选择器/,
    columns: ['编号', '元素', '选择器或aria', '属性', '数值', '单位', '断点', '容差', 'token'],
  },
  {
    key: 'acceptance',
    name: '类 6 验收入口',
    test: /验收入口/,
    columns: ['编号', 'AC编号', '判据摘要', '脚本路径', '夹具名', '证据路径', '判定人'],
  },
]

class PreflightError extends Error {}

/* ----------------------------- 通用解析 ----------------------------- */

function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function isDir(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function relPath(root, file) {
  return (relative(root, resolve(file)) || '.').split(sep).join('/')
}

function cleanInline(value) {
  return String(value ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripNumberPrefix(title) {
  return cleanInline(title)
    .replace(/^\d+(?:\.\d+)*\.?\s*/, '')
    .replace(/[：:]\s*$/, '')
    .trim()
}

function splitLines(text) {
  return String(text ?? '').split(/\r?\n/)
}

function splitRow(line) {
  let value = line.trim()
  if (value.startsWith('|')) value = value.slice(1)
  if (value.endsWith('|')) value = value.slice(0, -1)
  return value.split('|').map((cell) => cell.trim())
}

function collectSections(text) {
  const lines = splitLines(text)
  const sections = []
  let current = { title: '', line: 1, body: [], level: 0 }
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      current.body.push(line)
      continue
    }
    const heading = !inFence ? line.match(/^(#{1,6})\s+(.*)$/) : null
    if (heading) {
      sections.push(current)
      current = { title: stripNumberPrefix(heading[2]), line: index + 1, body: [], level: heading[1].length }
      continue
    }
    current.body.push(line)
  }
  sections.push(current)
  return sections
}

function parseMarkdownTables(text) {
  const lines = splitLines(text)
  const tables = []
  let inFence = false
  let heading = ''
  let headingLine = 0
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      heading = stripNumberPrefix(headingMatch[2])
      headingLine = index + 1
      continue
    }
    if (!/^\s*\|/.test(line)) continue
    if (index + 1 >= lines.length) continue
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1])) continue
    const headers = splitRow(line)
    const rows = []
    let cursor = index + 2
    for (; cursor < lines.length; cursor += 1) {
      if (!/^\s*\|/.test(lines[cursor])) break
      const cells = splitRow(lines[cursor])
      if (cells.every((cell) => !cleanInline(cell))) continue
      rows.push({ cells, line: cursor + 1 })
    }
    tables.push({ heading, headingLine, headers, rows, line: index + 1 })
    index = cursor - 1
  }
  return tables
}

function parseHeaderFields(text) {
  const lines = splitLines(text).slice(0, 40)
  const fields = new Map()
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index].replace(/^\s*[-*]\s*/, '').trim()
    if (!raw || raw.startsWith('|') || raw.startsWith('>')) continue
    const match = raw.match(/^([^:：|]{1,24})\s*[:：]\s*(.+)$/)
    if (!match) continue
    const key = cleanInline(match[1])
    if (!key || fields.has(key)) continue
    fields.set(key, { value: match[2].trim(), line: index + 1 })
  }
  return fields
}

function headerValue(fields, ...names) {
  for (const name of names) {
    const hit = fields.get(name)
    if (hit) return hit
  }
  return null
}

function normalizeColumn(header) {
  return cleanInline(header)
    .replace(/（[^）]*）|\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function normalizeField(name) {
  return cleanInline(name)
    .split('.')
    .pop()
    .replace(/[?"'![\]]/g, '')
    .replace(/[_-]/g, '')
    .toLowerCase()
}

function normalizeSelector(value) {
  return cleanInline(value).replace(/^`|`$/g, '').trim()
}

function uniq(values) {
  return [...new Set(values)]
}

function rowObject(table, row) {
  const object = {}
  table.headers.forEach((header, index) => {
    object[normalizeColumn(header)] = cleanInline(row.cells[index] ?? '')
  })
  return object
}

function cell(rowObjectValue, ...names) {
  for (const name of names) {
    if (rowObjectValue[normalizeColumn(name)]) return rowObjectValue[normalizeColumn(name)]
  }
  return ''
}

function naReason(text, label) {
  for (const line of splitLines(text)) {
    const match = line.match(NA_RE)
    if (!match) continue
    if (label && match[1] && !match[1].includes(label)) continue
    if (cleanInline(match[2]).length >= 8) return cleanInline(match[2])
  }
  return null
}

/* ----------------------------- 结果收集 ----------------------------- */

function createRun(root, options) {
  return { root, options, checks: [], findings: [], contracts: 0 }
}

function addFinding(run, data) {
  return {
    gate: GATE,
    rule: data.rule,
    severity: data.severity ?? 'error',
    path: data.path,
    line: data.line && data.line > 0 ? data.line : 1,
    item: data.item,
    ac: data.ac ?? '',
    expected: data.expected ?? '',
    actual: data.actual ?? '',
    hint: data.hint ?? '',
    message: data.message ?? data.actual ?? '',
  }
}

function startCheck(run, rule, item, path, line, expected) {
  const check = {
    gate: GATE,
    rule,
    item,
    path,
    line: line && line > 0 ? line : 1,
    expected,
    actual: '',
    findings: [],
    errorCount: 0,
    warningCount: 0,
  }
  run.checks.push(check)
  return check
}

function record(check, run, data) {
  const finding = addFinding(run, data)
  run.findings.push(finding)
  check.findings.push(finding)
  return finding
}

function finishCheck(check, run, actual) {
  check.errorCount = check.findings.filter((finding) => finding.severity === 'error').length
  check.warningCount = check.findings.filter((finding) => finding.severity === 'warning').length
  check.actual =
    check.errorCount === 0 && check.warningCount > 0
      ? `${actual}；${check.warningCount} 条 warn`
      : check.errorCount > 0 && check.warningCount > 0
        ? `${actual}；其中 ${check.warningCount} 条 warn`
        : actual
  return check
}

/* ----------------------------- 契约表解析 ----------------------------- */

function findClassSection(sections, definition) {
  return sections.find((section) => section.title && definition.test.test(section.title)) ?? null
}

function findClassTable(tables, section, definition) {
  if (!section) return null
  const exact = tables.find((table) => table.headingLine === section.line)
  if (exact) return exact
  return tables.find((table) => definition.test.test(table.heading)) ?? null
}

function parseContract(root, path) {
  const text = readText(path) ?? ''
  const sections = collectSections(text)
  const tables = parseMarkdownTables(text)
  const parsed = { path, rel: relPath(root, path), domain: basename(dirname(path)), text, sections, tables, classes: {}, meta: {} }
  const fields = parseHeaderFields(text)
  for (const label of ['状态', '版本', '冻结日期', 'owner', '变更单号']) {
    const hit = headerValue(fields, label, label === 'owner' ? '负责人' : label)
    parsed.meta[label] = hit ? { value: cleanInline(hit.value), line: hit.line } : null
  }
  for (const definition of CLASSES) {
    const section = findClassSection(sections, definition)
    const table = findClassTable(tables, section, definition)
    parsed.classes[definition.key] = { definition, section, table }
  }
  return parsed
}

function collectContracts(root, options) {
  const base = join(root, 'specs', 'contract')
  if (!isDir(base)) return []
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .filter((domain) => !options.domain || options.domain === domain)
    .map((domain) => join(base, domain, 'contract.md'))
    .filter((path) => isFile(path))
    .map((path) => parseContract(root, path))
}

/* ----------------------------- 五列 spec 解析 ----------------------------- */

function matchDomainDir(root, column, domain) {
  const base = join(root, 'specs', column)
  if (!isDir(base)) return null
  const dirs = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  return (
    dirs.find((name) => name === domain) ??
    dirs.find((name) => name.endsWith(`-${domain}`)) ??
    dirs.find((name) => name.includes(domain)) ??
    null
  )
}

function loadColumnSpec(root, domain, column) {
  const dirName = matchDomainDir(root, column, domain)
  if (!dirName) return null
  const dir = join(root, 'specs', column, dirName)
  if (column === 'frontend' || column === 'backend') {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => join(dir, entry.name))
      .sort()
    if (files.length === 0) return null
    return {
      path: files[0],
      rel: files.map((file) => relPath(root, file)).join('; '),
      text: files.map((file) => readText(file) ?? '').join('\n\n'),
      files,
    }
  }
  const name = column === 'test' ? 'test-plan.md' : 'spec.md'
  const path = join(dir, name)
  if (!isFile(path)) return null
  return { path, rel: relPath(root, path), text: readText(path) ?? '', files: [path] }
}

function extractIdentifier(value) {
  let raw = String(value ?? '')
  const backtick = raw.match(/`([^`]+)`/)
  if (backtick) raw = backtick[1]
  else raw = raw.split(/[（(：:，,\s]/)[0]
  raw = raw.replace(/[?"'![\]]/g, '').trim()
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(raw)) return ''
  const reserved = new Set(['field', 'name', 'props', 'type', 'code', 'http', 'id', '默认值', '类型', '名称', '字段'])
  if (reserved.has(raw.toLowerCase())) return ''
  return raw
}

function extractSpecFields(text) {
  const result = new Set()
  for (const table of parseMarkdownTables(text)) {
    const headingRelevant = /字段|接口|props|组件|数据|请求|响应/i.test(table.heading)
    const headerRelevant = table.headers.some((header) => /字段|名称|props/i.test(header))
    if (!headingRelevant && !headerRelevant) continue
    let fieldIndex = table.headers.findIndex((header) => /字段|名称|props/i.test(header))
    if (fieldIndex < 0) fieldIndex = 0
    for (const row of table.rows) {
      const identifier = extractIdentifier(row.cells[fieldIndex] ?? '')
      if (identifier) result.add(normalizeField(identifier))
    }
  }
  return result
}

function extractSpecStates(text) {
  const states = new Set()
  const transitions = new Set()
  const stateToken = (value) => {
    const cleaned = cleanInline(value)
    if (!cleaned || cleaned.length > 24) return ''
    if (/[\u4e00-\u9fff]/.test(cleaned) && !UI_STATES.includes(cleaned)) return ''
    return /^(?:[a-z][a-z0-9_]*)$/.test(cleaned) ? cleaned : ''
  }
  for (const table of parseMarkdownTables(text)) {
    const headers = table.headers.map((header) => cleanInline(header))
    const fromIndex = headers.findIndex((header) => /^从状态$|^from$/i.test(header))
    const toIndex = headers.findIndex((header) => /^到状态$|^to$/i.test(header))
    if (fromIndex >= 0 && toIndex >= 0) {
      for (const row of table.rows) {
        const from = stateToken(row.cells[fromIndex])
        const to = stateToken(row.cells[toIndex])
        if (from) states.add(from)
        if (to) states.add(to)
        if (from && to) transitions.add(`${from}->${to}`)
      }
      continue
    }
    const headerStates = headers.filter((header) => UI_STATES.includes(header.toLowerCase()) || stateToken(header))
    if (headerStates.length > 0) {
      for (const header of headerStates) {
        const token = stateToken(header)
        if (token) states.add(token)
      }
      continue
    }
    const stateIndex = headers.findIndex((header) => /状态$|^状态$/.test(header))
    if (stateIndex >= 0) {
      for (const row of table.rows) {
        const token = stateToken(row.cells[stateIndex])
        if (token) states.add(token)
      }
    }
  }
  for (const line of splitLines(text)) {
    const match = line.match(/`?([a-z][a-z0-9_]*)`?\s*(?:-->|->|→)\s*`?([a-z][a-z0-9_]*)`?/)
    if (match) {
      states.add(match[1])
      states.add(match[2])
      transitions.add(`${match[1]}->${match[2]}`)
    }
  }
  return { states, transitions }
}

function extractSpecErrors(text) {
  const errors = new Set()
  for (const table of parseMarkdownTables(text)) {
    const headers = table.headers.map((header) => cleanInline(header))
    const codeIndex = headers.findIndex((header) => /错误码|码值|code/i.test(header))
    if (codeIndex < 0) continue
    const httpIndex = headers.findIndex((header) => /^HTTP$|状态码|http/i.test(header))
    for (const row of table.rows) {
      const code = extractIdentifier(row.cells[codeIndex] ?? '')
      if (!code) continue
      const http = httpIndex >= 0 ? (cleanInline(row.cells[httpIndex]).match(/\b[1-5]\d{2}\b/) ?? [])[0] ?? '' : ''
      errors.add(`${http} ${code}`.trim())
    }
  }
  return errors
}

function extractSpecSelectors(text) {
  const selectors = new Set()
  for (const table of parseMarkdownTables(text)) {
    const headerRelevant = table.headers.some((header) => /选择器|DOM锚点|锚点|selector/i.test(header))
    const headingRelevant = /选择器|DOM ?锚点|锚点|界面几何/i.test(table.heading)
    if (!headerRelevant && !headingRelevant) continue
    let index = table.headers.findIndex((header) => /选择器|DOM锚点|锚点|selector/i.test(header))
    if (index < 0) index = 0
    for (const row of table.rows) {
      const raw = String(row.cells[index] ?? '')
      const backtick = raw.match(/`([^`]+)`/)
      const selector = normalizeSelector(backtick ? backtick[1] : raw)
      if (selector && /[.#[\]a-z]/i.test(selector) && !/\s{2,}/.test(selector)) selectors.add(selector)
    }
  }
  return selectors
}

/* ----------------------------- 数值一致性 ----------------------------- */

const NUMERIC_COLUMNS = ['product', 'design', 'frontend', 'backend', 'test']

function firstNumber(text) {
  const match = String(text ?? '').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function allNumbers(text) {
  return (String(text ?? '').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
}

function lastIdentifier(value) {
  const cleaned = cleanInline(value)
  const ascii = cleaned.match(/[A-Za-z_][A-Za-z0-9_]*/g)
  if (ascii && ascii.length > 0) return ascii[ascii.length - 1]
  const cjk = cleaned.match(/[\u4e00-\u9fff]+/g)
  return cjk && cjk.length > 0 ? cjk[cjk.length - 1] : ''
}

function parseTolerance(text) {
  const match = String(text ?? '').match(/±\s*(-?\d+(?:\.\d+)?)/)
  return match ? Math.abs(Number(match[1])) : 0
}

function normalizeUnit(value) {
  return cleanInline(value).replace(/^`|`$/g, '').trim().toLowerCase()
}

function boundaryUnit(text) {
  const cleaned = cleanInline(text)
  const matches = [
    ...cleaned.matchAll(/(-?\d+(?:\.\d+)?)\s*([A-Za-z%]+|[\u4e00-\u9fff]+)/g),
  ]
  if (matches.length === 0) return ''
  const candidate = matches[matches.length - 1][2]
  if (/^(?:至|到|和|或|与|及)$/.test(candidate)) return ''
  return normalizeUnit(candidate)
}

function numbersWithUnit(text, unit) {
  const normalizedUnit = normalizeUnit(unit)
  if (!normalizedUnit) return []
  const unitPattern = normalizedUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let working = String(text ?? '')
  working = working.replace(/±\s*-?\d+(?:\.\d+)?/g, ' ')
  working = working.replace(/\b(?:CT|AC|TC|REQ|CHG|EV|PRD|TASK|CC)-[A-Za-z0-9-]+/g, ' ')
  working = working.replace(/\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?\b/g, ' ')
  working = working.replace(/\bv\d+(?:\.\d+)+\b/gi, ' ')
  const values = []
  const rangeRe = new RegExp(
    `(-?\\d+(?:\\.\\d+)?)\\s*(?:至|到|–|—|~|～|-)\\s*(-?\\d+(?:\\.\\d+)?)\\s*${unitPattern}(?![A-Za-z0-9_])`,
    'gi',
  )
  working = working.replace(rangeRe, (match, from, to) => {
    values.push(Number(from), Number(to))
    return ' '.repeat(match.length)
  })
  const singleRe = new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*${unitPattern}(?![A-Za-z0-9_])`, 'gi')
  for (const match of working.matchAll(singleRe)) values.push(Number(match[1]))
  return values
}

function collectNumericFacts(run, contract, check) {
  const facts = []
  const class5 = contract.classes.selectors?.table
  if (class5) {
    for (const row of class5.rows) {
      const object = rowObject(class5, row)
      const status = cell(object, '状态')
      if (/失效/.test(status)) continue
      const concept = cell(object, '元素')
      const valueText = cell(object, '数值')
      const value = firstNumber(valueText)
      if (!concept || value === null) continue
      const unit = normalizeUnit(cell(object, '单位'))
      const id = cell(object, '编号')
      if (!unit) {
        record(check, run, {
          rule: 'MX-G-52',
          severity: 'warning',
          path: contract.rel,
          line: row.line,
          item: '数值一致性',
          expected: '类 5 的数值项写单位',
          actual: `${id || '类 5 行'} 的数值 ${valueText} 缺单位，本条不比对`,
          hint: '在类 5 的「单位」列补 px、ms 等单位后重跑',
          message: `数值项缺单位：${concept}`,
        })
        continue
      }
      facts.push({
        id,
        kind: 'point',
        concept: cleanInline(concept),
        property: lastIdentifier(cell(object, '属性')),
        value,
        unit,
        tolerance: parseTolerance(cell(object, '容差')),
        path: contract.rel,
        line: row.line,
      })
    }
  }
  const class1 = contract.classes.fields?.table
  if (class1) {
    for (const row of class1.rows) {
      const object = rowObject(class1, row)
      if (/失效/.test(cell(object, '状态'))) continue
      const concept = cleanInline(cell(object, '概念'))
      const boundary = cell(object, '枚举取值或边界')
      const values = allNumbers(boundary)
      if (!concept || values.length === 0) continue
      const unit = boundaryUnit(boundary)
      if (!unit) continue
      facts.push({
        id: cell(object, '编号'),
        kind: 'set',
        concept,
        property: '',
        values,
        unit,
        tolerance: 0,
        path: contract.rel,
        line: row.line,
      })
    }
  }
  return facts
}

function compareNumericFact(fact, values) {
  if (fact.kind === 'point') {
    const closest = values.reduce(
      (best, value) => (Math.abs(value - fact.value) < Math.abs(best - fact.value) ? value : best),
      values[0],
    )
    if (Math.abs(closest - fact.value) <= fact.tolerance) return null
    return { expected: String(fact.value), actual: String(closest) }
  }
  const expectedSet = sortedUniqueNumbers(fact.values)
  const actualSet = sortedUniqueNumbers(values)
  if (expectedSet.length === actualSet.length && expectedSet.every((value, index) => value === actualSet[index])) {
    return null
  }
  return { expected: expectedSet.join('、'), actual: actualSet.join('、') }
}

function sortedUniqueNumbers(values) {
  return [...new Set(values)].sort((left, right) => left - right)
}

function runMxG52(run, contract) {
  const check = startCheck(
    run,
    'MX-G-52',
    '数值一致性',
    contract.rel,
    0,
    '契约表数值项与五列同单位数字一致',
  )
  const facts = collectNumericFacts(run, contract, check)
  if (facts.length === 0) {
    finishCheck(check, run, '契约表没有带单位的数值项')
    return check
  }
  let scanned = 0
  let compared = 0
  const seen = new Set()
  for (const column of NUMERIC_COLUMNS) {
    const spec = loadColumnSpec(run.root, contract.domain, column)
    if (!spec) continue
    for (const file of spec.files ?? [spec.path]) {
      const text = readText(file) ?? ''
      let inFence = false
      const lines = splitLines(text)
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        if (/^\s*```/.test(line)) {
          inFence = !inFence
          continue
        }
        if (inFence || !line.trim()) continue
        scanned += 1
        const cited = new Set(line.match(/CT-[A-Z0-9]+-\d+/g) ?? [])
        for (const fact of facts) {
          const byId = fact.id ? cited.has(fact.id) : false
          const byConcept =
            fact.kind === 'set'
              ? Boolean(fact.concept) && line.includes(fact.concept)
              : line.includes(fact.concept) && (!fact.property || line.includes(fact.property))
          if (!byId && !byConcept) continue
          const values = numbersWithUnit(line, fact.unit)
          if (values.length === 0) continue
          compared += 1
          const key = `${relPath(run.root, file)}|${index + 1}|${fact.id || fact.concept}`
          if (seen.has(key)) continue
          const mismatch = compareNumericFact(fact, values)
          if (!mismatch) continue
          seen.add(key)
          const label =
            fact.kind === 'point'
              ? `${fact.concept} 的 ${fact.property || '数值'}`
              : `${fact.concept} 的边界`
          const tolerance = fact.kind === 'point' ? `，容差 ±${fact.tolerance} ${fact.unit}` : ''
          record(check, run, {
            rule: 'MX-G-52',
            severity: 'error',
            path: relPath(run.root, file),
            line: index + 1,
            item: '数值一致性',
            expected: `${fact.path}:${fact.line} ${fact.id || ''} ${label} 为 ${mismatch.expected} ${fact.unit}`,
            actual: `${column} 列写 ${mismatch.actual} ${fact.unit}${tolerance}`,
            hint: `按契约表 ${fact.id || fact.path} 把 ${column} 列的 ${fact.concept} 改为 ${mismatch.expected}${fact.unit}，或按 MX-6-11 开契约变更单后改契约表`,
            message: `数值不一致：${fact.id || '契约项'} 中 ${label} 契约表 ${mismatch.expected} ${fact.unit}，${column} 列 ${mismatch.actual} ${fact.unit}${tolerance}；统一为 ${mismatch.expected} ${fact.unit}`,
          })
        }
      }
    }
  }
  finishCheck(check, run, `数值项 ${facts.length} 个，扫描 ${scanned} 行，比对 ${compared} 处`)
  return check
}

function changePackagesForDomain(root, domain) {
  const base = join(root, 'specs', 'changes')
  if (!isDir(base)) return []
  const packages = []
  for (const entry of readdirSync(base, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    if (/^CHG-LEGACY-/.test(entry.name)) continue
    const path = join(base, entry.name, 'spec.md')
    if (!isFile(path)) continue
    const text = readText(path) ?? ''
    const fields = parseHeaderFields(text)
    const covers = (headerValue(fields, 'Covers')?.value.match(AC_RE) ?? [])
    const domains = (headerValue(fields, 'Domains')?.value ?? '')
      .split(/[、,，\s]+/)
      .map((value) => cleanInline(value))
      .filter(Boolean)
    const domainMatch = domains.includes(domain) || covers.some((ac) => ac.split('-')[1] === domain)
    if (!domainMatch) continue
    packages.push({ id: entry.name, covers, domains })
  }
  return packages
}

/* ----------------------------- 规则实现 ----------------------------- */

function runMxG26(run, contract) {
  const check = startCheck(
    run,
    'MX-G-26',
    '契约表与覆盖',
    contract.rel,
    1,
    '六类齐全；状态合法；Covers 每条 AC 在类 6 有行',
  )
  let problems = 0
  for (const definition of CLASSES) {
    const parsed = contract.classes[definition.key]
    if (!parsed.section) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: 1,
        item: '类组',
        expected: `存在「${definition.name}」`,
        actual: '节缺失',
        hint: `按 docs/templates/contract-table.md 补${definition.name}`,
        message: `缺失类组 ${definition.name}`,
      })
      continue
    }
    if (!parsed.table) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: parsed.section.line,
        item: '类组',
        expected: `${definition.name} 下有表格`,
        actual: '无表格',
        hint: `按 docs/templates/contract-table.md 补表`,
        message: `${definition.name} 缺表`,
      })
      continue
    }
    const normalizedHeaders = parsed.table.headers.map(normalizeColumn)
    const missingColumns = definition.columns.filter((column) => !normalizedHeaders.includes(normalizeColumn(column)))
    if (missingColumns.length > 0) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: parsed.table.line,
        item: '固定列',
        expected: `${definition.name} 含列 ${definition.columns.join('、')}`,
        actual: `缺列 ${missingColumns.join('、')}`,
        hint: '按 docs/templates/contract-table.md 的固定列顺序补齐，不自行加列',
        message: `${definition.name} 缺列 ${missingColumns.join('、')}`,
      })
    }
    if (parsed.table.rows.length === 0) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: parsed.table.line,
        item: '类组数据行',
        expected: `${definition.name} 至少 1 行`,
        actual: '0 行',
        hint: '按模板填一行示例对应的真实条目',
        message: `${definition.name} 无数据行`,
      })
    }
  }

  const status = contract.meta['状态'] ? cleanInline(contract.meta['状态'].value) : ''
  const freezeDate = contract.meta['冻结日期'] ? cleanInline(contract.meta['冻结日期'].value) : ''
  if (status) {
    if (!CONTRACT_STATUS.includes(status)) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: contract.meta['状态'].line,
        item: '契约表状态',
        expected: CONTRACT_STATUS.join('/'),
        actual: status,
        hint: '按 SDD-STANDARD 第 3.3 节把契约项状态改为三值之一',
        message: `契约表状态非法：${status}`,
      })
    }
    if (status === '冻结' && !freezeDate) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: contract.meta['状态'].line,
        item: '契约表状态',
        expected: '冻结状态写冻结日期',
        actual: '缺冻结日期',
        hint: '补冻结日期与 owner',
        message: '冻结契约缺冻结日期',
      })
    }
    if (status === '已变更' && !/^CC-/.test(contract.meta['变更单号']?.value ?? '')) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-26',
        severity: 'error',
        path: contract.rel,
        line: contract.meta['状态'].line,
        item: '契约表状态',
        expected: '状态为已变更时写 CC-<变更号>-<序号>',
        actual: contract.meta['变更单号']?.value ?? '缺变更单号',
        hint: '按 docs/templates/contract-table.md 的冻结流程第 5 条补变更单号',
        message: '已变更契约缺变更单号',
      })
    }
  } else if (!freezeDate) {
    record(check, run, {
      rule: 'MX-G-26',
      severity: 'warning',
      path: contract.rel,
      line: 1,
      item: '契约表状态',
      expected: '状态：草稿/冻结/已变更',
      actual: '未写状态与冻结日期，按草稿处理',
      hint: '按模板填写状态与冻结日期',
      message: '契约表未写状态',
    })
  }

  const acceptance = contract.classes.acceptance.table
  const contractAcs = new Set()
  if (acceptance) {
    for (const row of acceptance.rows) {
      const object = rowObject(acceptance, row)
      const ac = cleanInline(cell(object, 'AC编号', 'AC'))
      if (!AC_ONE_RE.test(ac)) {
        problems += 1
        record(check, run, {
          rule: 'MX-G-26',
          severity: 'error',
          path: contract.rel,
          line: row.line,
          item: 'AC 覆盖',
          expected: '类 6 每行写合法 AC 编号',
          actual: ac || '空',
          hint: '按 AC-(?:[A-Z0-9]+-){2,}\\d+ 补编号',
          message: `类 6 第 ${row.line} 行 AC 非法`,
        })
        continue
      }
      const match = ac.match(AC_ONE_RE)
      if (match) contractAcs.add(match[0])
    }
  }
  const packages = changePackagesForDomain(run.root, contract.domain)
  if (packages.length === 0) {
    record(check, run, {
      rule: 'MX-G-26',
      severity: 'warning',
      path: contract.rel,
      line: 1,
      item: 'AC 覆盖',
      expected: `域 ${contract.domain} 有在行变更包`,
      actual: '未找到引用该域的变更包',
      hint: '确认 Domains 与 Covers 字段，或确认该域只由长期 spec 维护',
      message: '未找到引用该域的变更包',
    })
  }
  const missingByPackage = new Map()
  for (const pkg of packages) {
    for (const ac of pkg.covers) {
      if (contractAcs.has(ac)) continue
      if (!missingByPackage.has(pkg.id)) missingByPackage.set(pkg.id, [])
      missingByPackage.get(pkg.id).push(ac)
    }
  }
  for (const [pkgId, acs] of missingByPackage) {
    problems += 1
    record(check, run, {
      rule: 'MX-G-26',
      severity: 'error',
      path: `specs/changes/${pkgId}/spec.md`,
      line: 1,
      item: 'AC 覆盖',
      ac: acs[0] ?? '',
      expected: `${pkgId} 的 Covers 每条 AC 在类 6 有契约项`,
      actual: `缺契约项 ${acs.join('、')}`,
      hint: '在类 6 验收入口为每条 AC 补一行，或从 Covers 移出本域',
      message: `${pkgId} 有 ${acs.length} 条 AC 缺契约项`,
    })
  }
  return finishCheck(check, run, problems === 0 ? '六类齐全且覆盖完整' : `${problems} 处缺失`)
}

function runMxG27(run, contract) {
  const check = startCheck(
    run,
    'MX-G-27',
    '字段名一致',
    contract.rel,
    1,
    '类 1 字段与后端请求/响应字段、前端 props 归一后一致',
  )
  const table = contract.classes.fields.table
  const byTarget = { backend: new Map(), frontend: new Map() }
  if (table) {
    for (const row of table.rows) {
      const object = rowObject(table, row)
      const raw = cell(object, '字段路径', '字段')
      const identifier = extractIdentifier(raw)
      if (!identifier) continue
      const source = `${cell(object, '来源')} ${cell(object, '实体或端点')} ${cell(object, '概念')}`
      const target = /前端|props|组件/i.test(source)
        ? 'frontend'
        : /后端|接口|\/api\//i.test(source)
          ? 'backend'
          : null
      if (!target) continue
      byTarget[target].set(normalizeField(identifier), { raw: cell(object, '字段路径') || identifier, line: row.line })
    }
  }
  let problems = 0
  const specs = {
    backend: loadColumnSpec(run.root, contract.domain, 'backend'),
    frontend: loadColumnSpec(run.root, contract.domain, 'frontend'),
  }
  const labels = { backend: '后端 spec', frontend: '前端 spec' }
  for (const target of ['backend', 'frontend']) {
    const contractFields = byTarget[target]
    if (contractFields.size === 0) {
      record(check, run, {
        rule: 'MX-G-27',
        severity: 'warning',
        path: contract.rel,
        line: 1,
        item: '字段名一致',
        expected: `类 1 有来源标注为${labels[target]}的字段行`,
        actual: '0 行',
        hint: '在来源列写清后端 spec 或前端 props，或写 N/A：<理由>',
        message: `契约表无${labels[target]}字段行`,
      })
      continue
    }
    const spec = specs[target]
    if (!spec) {
      record(check, run, {
        rule: 'MX-G-27',
        severity: 'warning',
        path: contract.rel,
        line: 1,
        item: '字段名一致',
        expected: `存在 ${labels[target]} 列文件`,
        actual: '列文件缺失，字段比对跳过',
        hint: `补 specs/${target}/<域>/ 下的列文件，或在变更包首部写 N/A：<列名>：<理由>`,
        message: `${labels[target]}文件缺失`,
      })
      continue
    }
    const specFields = extractSpecFields(spec.text)
    const missing = []
    for (const [field, info] of contractFields) {
      if (!specFields.has(field)) missing.push(info.raw)
    }
    const extra = [...specFields].filter((field) => !contractFields.has(field))
    if (missing.length > 0) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-27',
        severity: 'error',
        path: contract.rel,
        line: contractFields.get(normalizeField(missing[0]))?.line ?? 1,
        item: '字段名一致',
        expected: `${labels[target]}包含 ${missing.join('、')}`,
        actual: `${spec.rel} 缺这些字段`,
        hint: `以契约表为准，在 ${spec.rel} 补字段名与类型`,
        message: `${labels[target]}缺字段 ${missing.join('、')}`,
      })
    }
    if (extra.length > 0) {
      record(check, run, {
        rule: 'MX-G-27',
        severity: 'warning',
        path: spec.rel,
        line: 1,
        item: '字段名一致',
        expected: 'spec 字段都能回指契约表',
        actual: `多出字段 ${extra.join('、')}`,
        hint: '把字段补进契约表，或从 spec 删除；多出字段只提示不阻断',
        message: `${labels[target]}多出字段 ${extra.join('、')}`,
      })
    }
  }
  return finishCheck(check, run, problems === 0 ? '字段一致' : `${problems} 处字段缺失`)
}

function runMxG28(run, contract) {
  const check = startCheck(
    run,
    'MX-G-28',
    '状态值一致',
    contract.rel,
    1,
    '类 2 状态全集与迁移同设计、前端一致；UI 状态取八态',
  )
  const table = contract.classes.states.table
  const contractStates = new Set()
  const contractTransitions = new Set()
  let uiObject = false
  if (table) {
    for (const row of table.rows) {
      const object = rowObject(table, row)
      const objectName = `${cell(object, '对象')} ${cell(object, '元素')}`
      if (/按钮|卡片|卡|面板|组件|元素|详情|输入|菜单|弹窗|tab/i.test(objectName)) uiObject = true
      const setRaw = cell(object, '状态取值全集')
      for (const token of setRaw.split(/[、,，/\s]+/)) {
        const cleaned = cleanInline(token)
        if (!cleaned || cleaned === '同上' || cleaned === '无') continue
        if (/^[a-z][a-z0-9_]*$/.test(cleaned)) contractStates.add(cleaned)
      }
      const from = cleanInline(cell(object, '从状态'))
      const to = cleanInline(cell(object, '到状态'))
      for (const token of [from, to]) {
        if (/^[a-z][a-z0-9_]*$/.test(token)) contractStates.add(token)
      }
      if (/^[a-z][a-z0-9_]*$/.test(from) && /^[a-z][a-z0-9_]*$/.test(to)) {
        contractTransitions.add(`${from}->${to}`)
      }
    }
  }
  let problems = 0
  if (uiObject) {
    for (const state of contractStates) {
      if (!UI_STATES.includes(state)) {
        problems += 1
        record(check, run, {
          rule: 'MX-G-28',
          severity: 'error',
          path: contract.rel,
          line: table.rows[0]?.line ?? 1,
          item: '状态值一致',
          expected: `UI 状态取 ${UI_STATES.join('/')}`,
          actual: `未知状态名 ${state}`,
          hint: '改用八态之一；确属数据状态机时把对象改为非 UI 对象并说明',
          message: `未知 UI 状态名 ${state}`,
        })
      }
    }
  }
  const specs = {
    design: loadColumnSpec(run.root, contract.domain, 'design'),
    frontend: loadColumnSpec(run.root, contract.domain, 'frontend'),
  }
  const labels = { design: '设计 spec', frontend: '前端 spec' }
  for (const target of ['design', 'frontend']) {
    const spec = specs[target]
    if (!spec) {
      record(check, run, {
        rule: 'MX-G-28',
        severity: 'warning',
        path: contract.rel,
        line: 1,
        item: '状态值一致',
        expected: `存在 ${labels[target]} 列文件`,
        actual: '列文件缺失，状态比对跳过',
        hint: '补列文件，或在变更包首部写 N/A：<列名>：<理由>',
        message: `${labels[target]}文件缺失`,
      })
      continue
    }
    const parsed = extractSpecStates(spec.text)
    const missing = [...contractStates].filter((state) => !parsed.states.has(state))
    const extra = [...parsed.states].filter((state) => !contractStates.has(state))
    if (missing.length > 0) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-28',
        severity: 'error',
        path: spec.rel,
        line: 1,
        item: '状态值一致',
        expected: `${labels[target]}覆盖 ${missing.join('、')}`,
        actual: '状态矩阵或转移表缺这些状态',
        hint: `以契约表为准，在 ${spec.rel} 补状态与迁移`,
        message: `${labels[target]}缺状态 ${missing.join('、')}`,
      })
    }
    if (extra.length > 0) {
      record(check, run, {
        rule: 'MX-G-28',
        severity: 'warning',
        path: spec.rel,
        line: 1,
        item: '状态值一致',
        expected: 'spec 状态都能回指契约表',
        actual: `多出状态 ${extra.join('、')}`,
        hint: '把状态补进契约表，或从 spec 删除',
        message: `${labels[target]}多出状态 ${extra.join('、')}`,
      })
    }
    const missingTransitions = [...contractTransitions].filter((pair) => !parsed.transitions.has(pair))
    if (parsed.transitions.size > 0 && missingTransitions.length > 0) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-28',
        severity: 'error',
        path: spec.rel,
        line: 1,
        item: '状态迁移',
        expected: `含迁移 ${missingTransitions.join('、')}`,
        actual: '转移表缺这些迁移',
        hint: '补迁移行，或从契约表删除未实现的迁移',
        message: `${labels[target]}缺迁移 ${missingTransitions.join('、')}`,
      })
    }
  }
  return finishCheck(check, run, problems === 0 ? '状态一致' : `${problems} 处状态缺失`)
}

function runMxG29(run, contract) {
  const check = startCheck(
    run,
    'MX-G-29',
    '错误码一致',
    contract.rel,
    1,
    '类 3 的 HTTP + code 与后端错误码表、前端错误态一致',
  )
  const table = contract.classes.errors.table
  const contractErrors = new Map()
  const issues = []
  if (table) {
    for (const row of table.rows) {
      const object = rowObject(table, row)
      const code = extractIdentifier(cell(object, '码值', 'code'))
      const http = (cell(object, 'HTTP', '状态码').match(/\b[1-5]\d{2}\b/) ?? [])[0] ?? ''
      if (code && !CODE_RE.test(code)) {
        issues.push(`类 3 第 ${row.line} 行 code 格式非法：${code}`)
      }
      if (!code || !http) {
        issues.push(`类 3 第 ${row.line} 行缺码值或 HTTP`)
        continue
      }
      contractErrors.set(code, { http, line: row.line })
    }
  }
  const specs = {
    backend: loadColumnSpec(run.root, contract.domain, 'backend'),
    frontend: loadColumnSpec(run.root, contract.domain, 'frontend'),
  }
  const labels = { backend: '后端 spec', frontend: '前端 spec' }
  for (const target of ['backend', 'frontend']) {
    const spec = specs[target]
    if (!spec) {
      record(check, run, {
        rule: 'MX-G-29',
        severity: 'warning',
        path: contract.rel,
        line: 1,
        item: '错误码一致',
        expected: `存在 ${labels[target]} 列文件`,
        actual: '列文件缺失，错误码比对跳过',
        hint: '补列文件，或在变更包首部写 N/A：<列名>：<理由>',
        message: `${labels[target]}文件缺失`,
      })
      continue
    }
    const specErrors = extractSpecErrors(spec.text)
    if (specErrors.size === 0) {
      record(check, run, {
        rule: 'MX-G-29',
        severity: 'warning',
        path: spec.rel,
        line: 1,
        item: '错误码一致',
        expected: '含错误码表',
        actual: '未找到错误码表，比对跳过',
        hint: '按 SPEC-STANDARD 第 2.3 节写 HTTP 状态与 code 成对表',
        message: `${labels[target]}无错误码表`,
      })
      continue
    }
    const specCodes = new Map()
    for (const pair of specErrors) {
      const match = pair.match(/^(\d{3})?\s*([a-z][a-z0-9_]*)$/)
      if (match) specCodes.set(match[2], match[1] ?? '')
    }
    const specByHttp = new Map()
    for (const [code, http] of specCodes) {
      if (!specByHttp.has(http)) specByHttp.set(http, code)
    }
    for (const [code, info] of contractErrors) {
      if (!specCodes.has(code)) {
        const other = specByHttp.get(info.http)
        issues.push(
          other
            ? `契约表 ${info.http} ${code}，${labels[target]} ${info.http} ${other}`
            : `契约表 ${info.http} ${code}，${labels[target]}无此码`,
        )
      } else if (specCodes.get(code) !== info.http) {
        issues.push(`契约表 ${info.http} ${code}，${labels[target]} ${specCodes.get(code)} ${code}`)
      }
    }
    for (const [code, http] of specCodes) {
      if (contractErrors.has(code)) continue
      const sameHttp = [...contractErrors.entries()].find(([, info]) => info.http === http)
      if (!sameHttp) {
        record(check, run, {
          rule: 'MX-G-29',
          severity: 'warning',
          path: spec.rel,
          line: 1,
          item: '错误码一致',
          expected: 'spec 错误码都能回指契约表',
          actual: `多出 ${http} ${code}`,
          hint: '把错误码补进契约表，或从 spec 删除',
          message: `${labels[target]}多出错误码 ${http} ${code}`,
        })
      } else if (specCodes.has(sameHttp[0])) {
        issues.push(
          `${labels[target]}同一 HTTP ${http} 同时有 ${sameHttp[0]} 与 ${code}`,
        )
      }
    }
  }
  if (issues.length > 0) {
    record(check, run, {
      rule: 'MX-G-29',
      severity: 'error',
      path: contract.rel,
      line: contractErrors.values().next().value?.line ?? 1,
      item: '错误码一致',
      expected: '契约表、后端、前端三处的 HTTP + code 逐对相同',
      actual: issues.join('；'),
      hint: '以契约表为准统一码值与 HTTP 状态；同一 HTTP 只对应一个 code',
      message: `错误码不一致：${issues.join('；')}`,
    })
  }
  return finishCheck(check, run, issues.length === 0 ? '错误码一致' : `${issues.length} 处不一致`)
}

function runMxG30(run, contract) {
  const check = startCheck(
    run,
    'MX-G-30',
    '选择器一致',
    contract.rel,
    1,
    '类 5 选择器与设计、前端一致；稳定锚点优先 data-* 或 role',
  )
  const table = contract.classes.selectors.table
  const contractSelectors = new Map()
  const issues = []
  if (table) {
    for (const row of table.rows) {
      const object = rowObject(table, row)
      const raw = cell(object, '选择器或aria', '选择器')
      if (!raw) continue
      const selector = normalizeSelector(raw)
      if (!selector) continue
      contractSelectors.set(selector, row.line)
      if (/nth-child|nth-of-type|:nth-/i.test(selector) || /^[a-z]+(?:\s*>\s*[a-z]+)+$/i.test(selector)) {
        issues.push(`契约表 ${selector} 含位置路径`)
      } else if (/^\.[A-Za-z_-][\w-]*$/.test(selector)) {
        record(check, run, {
          rule: 'MX-G-30',
          severity: 'warning',
          path: contract.rel,
          line: row.line,
          item: '选择器稳定',
          expected: 'class 选择器带 data-* 或 role',
          actual: selector,
          hint: '补 data-* 或 role 锚点；只有 class 的定位在样式重构后会失效',
          message: `选择器只有 class：${selector}`,
        })
      }
    }
  }
  const specs = {
    design: loadColumnSpec(run.root, contract.domain, 'design'),
    frontend: loadColumnSpec(run.root, contract.domain, 'frontend'),
  }
  const labels = { design: '设计 spec', frontend: '前端 spec' }
  for (const target of ['design', 'frontend']) {
    const spec = specs[target]
    if (!spec) {
      record(check, run, {
        rule: 'MX-G-30',
        severity: 'warning',
        path: contract.rel,
        line: 1,
        item: '选择器一致',
        expected: `存在 ${labels[target]} 列文件`,
        actual: '列文件缺失，选择器比对跳过',
        hint: '补列文件，或在变更包首部写 N/A：<列名>：<理由>',
        message: `${labels[target]}文件缺失`,
      })
      continue
    }
    const specSelectors = extractSpecSelectors(spec.text)
    if (specSelectors.size === 0) {
      record(check, run, {
        rule: 'MX-G-30',
        severity: 'warning',
        path: spec.rel,
        line: 1,
        item: '选择器一致',
        expected: '含选择器或 DOM 锚点表',
        actual: '未找到选择器，比对跳过',
        hint: '按 SPEC-STANDARD 第 2.3 节写选择器与 DOM 锚点',
        message: `${labels[target]}无选择器表`,
      })
      continue
    }
    const missing = [...contractSelectors.keys()].filter((selector) => !specSelectors.has(selector))
    const extra = [...specSelectors].filter((selector) => !contractSelectors.has(selector))
    if (missing.length > 0) {
      issues.push(`契约表 ${missing.join('、')}，${labels[target]} ${[...specSelectors].join('、')}`)
    }
    if (extra.length > 0) {
      record(check, run, {
        rule: 'MX-G-30',
        severity: 'warning',
        path: spec.rel,
        line: 1,
        item: '选择器一致',
        expected: 'spec 选择器都能回指契约表',
        actual: `多出 ${extra.join('、')}`,
        hint: '把选择器补进契约表，或改用契约表锚点',
        message: `${labels[target]}多出选择器 ${extra.join('、')}`,
      })
    }
  }
  if (issues.length > 0) {
    record(check, run, {
      rule: 'MX-G-30',
      severity: 'error',
      path: contract.rel,
      line: contractSelectors.values().next().value ?? 1,
      item: '选择器一致',
      expected: '三处选择器一致且不用位置路径',
      actual: issues.join('；'),
      hint: '以契约表为准统一为 [data-*] 或 role 稳定锚点；先改契约表，再改设计与前端',
      message: `选择器不一致：${issues.join('；')}`,
    })
  }
  return finishCheck(check, run, issues.length === 0 ? '选择器一致' : `${issues.length} 处不一致`)
}

function runMxG31(run, contract) {
  const check = startCheck(
    run,
    'MX-G-31',
    '编号与覆盖',
    contract.rel,
    1,
    'CT 编号唯一且格式合法；类 6 AC 在产品与测试计划中存在并有变更包回指',
  )
  let problems = 0
  const ids = new Map()
  for (const definition of CLASSES) {
    const table = contract.classes[definition.key].table
    if (!table) continue
    for (const row of table.rows) {
      const object = rowObject(table, row)
      const id = cleanInline(cell(object, '编号'))
      if (!id) continue
      if (!CT_ID_RE.test(id)) {
        problems += 1
        record(check, run, {
          rule: 'MX-G-31',
          severity: 'error',
          path: contract.rel,
          line: row.line,
          item: '契约编号',
          expected: '编号匹配 CT-<段>-<序号>',
          actual: id,
          hint: '按 docs/templates/contract-table.md 写编号，域码去批次前缀',
          message: `契约编号格式非法：${id}`,
        })
      }
      if (ids.has(id)) {
        problems += 1
        record(check, run, {
          rule: 'MX-G-31',
          severity: 'error',
          path: contract.rel,
          line: row.line,
          item: '契约编号',
          expected: `编号 ${id} 唯一`,
          actual: `重复，首次出现在第 ${ids.get(id)} 行`,
          hint: '删除重复行或顺延新编号；删除的编号留空不复用',
          message: `契约编号重复：${id}`,
        })
      } else {
        ids.set(id, row.line)
      }
    }
  }

  const acceptance = contract.classes.acceptance.table
  const contractAcs = new Set()
  if (acceptance) {
    for (const row of acceptance.rows) {
      const object = rowObject(acceptance, row)
      const raw = cleanInline(cell(object, 'AC编号', 'AC'))
      const match = raw.match(AC_ONE_RE)
      if (!match) {
        problems += 1
        record(check, run, {
          rule: 'MX-G-31',
          severity: 'error',
          path: contract.rel,
          line: row.line,
          item: 'AC 覆盖',
          expected: '类 6 每行写合法 AC 编号',
          actual: raw || '空',
          hint: '按 AC-(?:[A-Z0-9]+-){2,}\\d+ 补编号',
          message: `类 6 第 ${row.line} 行 AC 非法`,
        })
        continue
      }
      contractAcs.add(match[0])
    }
  }

  const product = loadColumnSpec(run.root, contract.domain, 'product')
  const test = loadColumnSpec(run.root, contract.domain, 'test')
  const productAcs = new Set(product ? (product.text.match(AC_RE) ?? []) : [])
  const testAcs = new Set(test ? (test.text.match(AC_RE) ?? []) : [])
  const allCovers = new Set(changePackagesForDomain(run.root, contract.domain).flatMap((pkg) => pkg.covers))
  if (!product) {
    record(check, run, {
      rule: 'MX-G-31',
      severity: 'warning',
      path: contract.rel,
      line: 1,
      item: 'AC 覆盖',
      expected: '存在产品 spec',
      actual: '产品列文件缺失，AC 回指检查跳过',
      hint: '补 specs/product/<域>/spec.md',
      message: '产品 spec 缺失',
    })
  }
  if (!test) {
    record(check, run, {
      rule: 'MX-G-31',
      severity: 'warning',
      path: contract.rel,
      line: 1,
      item: 'AC 覆盖',
      expected: '存在测试计划',
      actual: '测试列文件缺失，TC 回指检查跳过',
      hint: '补 specs/test/<域>/test-plan.md',
      message: '测试计划缺失',
    })
  }
  for (const ac of contractAcs) {
    if (product && !productAcs.has(ac)) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-31',
        severity: 'error',
        path: contract.rel,
        line: 1,
        item: 'AC 覆盖',
        ac,
        expected: `产品 spec 有 ${ac}`,
        actual: `${product.rel} 未找到该编号`,
        hint: '补产品 spec 的 AC 定义，或修正契约表编号',
        message: `${ac} 不在产品 spec 中`,
      })
    }
    if (test && !testAcs.has(ac)) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-31',
        severity: 'error',
        path: contract.rel,
        line: 1,
        item: 'AC 覆盖',
        ac,
        expected: `测试计划有 ${ac}`,
        actual: `${test.rel} 未找到该编号`,
        hint: '在测试计划补 AC → TC 映射',
        message: `${ac} 不在测试计划中`,
      })
    }
    if (!allCovers.has(ac)) {
      problems += 1
      record(check, run, {
        rule: 'MX-G-31',
        severity: 'error',
        path: contract.rel,
        line: 1,
        item: 'AC 覆盖',
        ac,
        expected: `${ac} 能回指某个变更包 Covers`,
        actual: '未找到回指',
        hint: '确认 AC 来源变更包，或从契约表删除孤儿 AC',
        message: `${ac} 没有变更包回指`,
      })
    }
  }
  return finishCheck(check, run, problems === 0 ? '编号与覆盖一致' : `${problems} 处不一致`)
}

/* ----------------------------- 主流程 ----------------------------- */

function runContract(root, options) {
  const run = createRun(root, options)
  const contracts = collectContracts(root, options)
  if (contracts.length === 0) {
    const check = startCheck(
      run,
      'MX-G-26',
      '契约表存在',
      'specs/contract',
      0,
      'specs/contract/<域>/contract.md 至少 1 份',
    )
    record(check, run, {
      rule: 'MX-G-26',
      severity: 'error',
      path: 'specs/contract',
      line: 1,
      item: '契约表存在',
      expected: 'specs/contract/<域>/contract.md 至少 1 份',
      actual: '未找到契约表；契约门禁无输入',
      hint: '按 docs/templates/contract-table.md 建立域契约表；纯文档包在变更包写 N/A：<理由>',
      message: '缺少域契约表',
    })
    finishCheck(check, run, '未找到契约表')
    return run
  }
  for (const contract of contracts) {
    run.contracts += 1
    for (const rule of [runMxG26, runMxG27, runMxG28, runMxG29, runMxG30, runMxG31, runMxG52]) {
      rule(run, contract)
    }
  }
  return run
}

/* ----------------------------- 输出 ----------------------------- */

function checkStatus(check) {
  return check.errorCount > 0 ? 'FAIL' : 'PASS'
}

function printText(run) {
  for (const check of run.checks) {
    console.log(
      `[GATE-${GATE}] ${check.path}:${check.line} ${check.rule} ${checkStatus(check)} ${check.item} 期望=${check.expected} 实际=${check.actual}`,
    )
    for (const finding of check.findings) {
      if (finding.severity === 'error') {
        console.log(
          `[GATE-${GATE}] ${finding.path}:${finding.line} ${finding.rule} ${finding.message}；${finding.hint}`,
        )
      } else {
        console.log(
          `[GATE-${GATE}] ${finding.path}:${finding.line} ${finding.rule} WARN ${finding.message}；${finding.hint}`,
        )
      }
    }
  }
  const errors = run.findings.filter((finding) => finding.severity === 'error').length
  const warnings = run.findings.filter((finding) => finding.severity === 'warning').length
  const failed = run.checks.filter((check) => check.errorCount > 0).length
  const passed = run.checks.length - failed
  if (errors === 0) {
    console.log(`PASS (gate: contract, checks: ${run.checks.length}, warnings: ${warnings})`)
  } else {
    console.log(`FAILED: ${errors} error(s), ${warnings} warning(s)`)
  }
  console.log(`${passed} passed, ${failed} failed`)
}

function toJson(run) {
  const errors = run.findings.filter((finding) => finding.severity === 'error')
  const warnings = run.findings.filter((finding) => finding.severity === 'warning')
  const failed = run.checks.filter((check) => check.errorCount > 0).length
  return {
    gate: 'contract',
    root: run.root,
    contracts: run.contracts,
    ok: errors.length === 0,
    passed: run.checks.length - failed,
    failed,
    errors: errors.length,
    warnings: warnings.length,
    checks: run.checks.map((check) => ({
      rule: check.rule,
      item: check.item,
      path: check.path,
      line: check.line,
      status: checkStatus(check),
      expected: check.expected,
      actual: check.actual,
      errorCount: check.errorCount,
      warningCount: check.warningCount,
    })),
    findings: run.findings.map((finding) => ({
      gate: finding.gate,
      rule: finding.rule,
      severity: finding.severity,
      path: finding.path,
      line: finding.line,
      ac: finding.ac,
      item: finding.item,
      expected: finding.expected,
      actual: finding.actual,
      hint: finding.hint,
      message: finding.message,
    })),
  }
}

/* ----------------------------- 自检夹具 ----------------------------- */

function writeFixture(root, relativePath, content) {
  const path = join(root, relativePath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

function contractFixture(options = {}) {
  const errorCode = options.errorCode ?? 'conflict'
  const selector = options.selector ?? '[data-task-id]'
  const width = options.width ?? 320
  return `# 契约表 · CONV

状态：冻结
版本：v1.0
冻结日期：2026-11-24
owner：设计
变更单号：无

## 类 1 数据形状

| 编号 | 概念 | 实体或端点 | 字段路径 | 类型 | 可空 | 默认值 | 枚举取值或边界 | 来源 |
|---|---|---|---|---|---|---|---|---|
| CT-CONV-001 | 任务投影 | GET /api/tasks 的 task | \`taskId\` | string | 否 | 无 | 1–64 字 | 后端 spec §2 |
| CT-CONV-002 | 任务投影 | GET /api/tasks 的 task | \`displayStatus\` | string | 否 | 无 | pending、running | 后端 spec §2 |
| CT-CONV-003 | 任务卡 props | 前端 TaskCard 的 props | \`taskId\` | string | 否 | 无 | 1–64 字 | 前端 spec props |
| CT-CONV-004 | 任务卡 props | 前端 TaskCard 的 props | \`statusText\` | string | 否 | 无 | 非空 | 前端 spec props |

## 类 2 状态机

| 编号 | 对象 | 状态取值全集 | 从状态 | 到状态 | 触发者 | 条件与副作用 | 非法迁移错误码 |
|---|---|---|---|---|---|---|---|
| CT-CONV-011 | 任务卡 | default、hover、focus、active、disabled、loading、empty、error | default | hover | 用户 | 指针进入 | 无 |
| CT-CONV-012 | 任务卡 | 同上 | hover | default | 用户 | 指针离开 | 无 |

## 类 3 错误码

| 编号 | 码值 | HTTP | 触发条件 | 响应附加字段 | 是否泄露存在性 | 客户端动作 |
|---|---|---|---|---|---|---|
| CT-CONV-021 | \`${errorCode}\` | 409 | 任务被占用时点击 | 无 | 否 | 提示并刷新 |

## 类 4 事件与消息

| 编号 | 事件名 | 触发时机 | 载荷字段 | 顺序依据 | 去重键 | 补偿方式 |
|---|---|---|---|---|---|---|
| CT-CONV-031 | \`task.trace\` | 追加轨迹 | \`id\`、\`stepId\` | 日志 id 递增 | \`id\` | 重拉最近 200 条 |

## 类 5 界面几何与选择器

| 编号 | 元素 | 选择器或 aria | 属性 | 数值 | 单位 | 断点 | 容差 | token |
|---|---|---|---|---|---|---|---|---|
| CT-CONV-041 | 任务卡 | \`${selector}\` | width | ${width} | px | 全档 | ±1 | --sp-2 |

## 类 6 验收入口

| 编号 | AC 编号 | 判据摘要 | 脚本路径 | 夹具名 | 证据路径 | 判定人 |
|---|---|---|---|---|---|---|
| CT-CONV-051 | \`AC-CONV-001-01\` | 点击后显示 1 个详情 | \`scripts/ac/AC-CONV-001-01.mjs\` | task-card | \`.tmp/ac/AC-CONV-001-01.json\` | 自动 |
`
}

function writeContractFixtureSpecs(root, options = {}) {
  const errorCode = options.errorCode ?? 'conflict'
  const width = options.width ?? 320
  const boundaryMax = options.boundaryMax ?? 64
  writeFixture(root, 'specs/product/P1-CONV/spec.md', `# 产品 spec · P1-CONV

## 1 目标

任务卡可打开详情。

## 2 验收标准

- \`AC-CONV-001-01\` 点击任务卡后显示 1 个详情，脚本 \`scripts/ac/AC-CONV-001-01.mjs\`。

卡片横向占位 ${width} px，依据 CT-CONV-041。
`)
  writeFixture(root, 'specs/design/P1-CONV/spec.md', `# 设计 spec · P1-CONV

## 1 状态矩阵

| 元素 | default | hover | focus | active | disabled | loading | empty | error |
|---|---|---|---|---|---|---|---|---|
| 任务卡 | 白 | 浅灰 | 蓝 | 深蓝 | 灰 | 转圈 | 空 | 红 |

## 2 选择器

| 元素 | 选择器 |
|---|---|
| 任务卡 | \`[data-task-id]\` |

## 3 数值

| 元素 | 属性 | 数值 |
|---|---|---|
| 任务卡 | width | ${width}px |

任务投影名称长度 1 至 ${boundaryMax} 字，依据 CT-CONV-001。
`)
  writeFixture(root, 'specs/frontend/P1-CONV/task-panel.md', `# 前端 spec · 任务面板

## 1 组件与 props

| 名称 | 类型 | 默认值 | 是否必填 |
|---|---|---|---|
| \`taskId\` | string | 无 | 是 |
| \`statusText\` | string | 无 | 是 |

## 2 状态矩阵

| 元素 | default | hover | focus | active | disabled | loading | empty | error |
|---|---|---|---|---|---|---|---|---|
| 任务卡 | 白 | 浅灰 | 蓝 | 深蓝 | 灰 | 转圈 | 空 | 红 |

## 3 状态转移

| 从状态 | 到状态 | 事件 |
|---|---|---|
| default | hover | 指针进入 |
| hover | default | 指针离开 |

## 4 DOM 锚点

| 元素 | 选择器 |
|---|---|
| 任务卡 | \`[data-task-id]\` |

## 5 错误态

| 错误码 | HTTP | 反馈 |
|---|---|---|
| \`${errorCode}\` | 409 | 提示并刷新 |
`)
  writeFixture(root, 'specs/backend/P1-CONV/task-api.md', `# 后端 spec · 任务接口

## 1 请求字段

| 字段 | 类型 | 必填 |
|---|---|---|
| \`taskId\` | string | 是 |

## 2 响应字段

| 字段 | 类型 |
|---|---|
| \`taskId\` | string |
| \`displayStatus\` | string |

## 3 错误码

| 错误码 | HTTP | 触发条件 |
|---|---|---|
| \`${errorCode}\` | 409 | 任务被占用 |
`)
  writeFixture(root, 'specs/test/P1-CONV/test-plan.md', `# 测试计划 · P1-CONV

Covers: \`AC-CONV-001-01\`

## 1 AC → 测试映射

| AC | TC | 用例 | 期望 | 证据 |
|---|---|---|---|---|
| \`AC-CONV-001-01\` | \`TC-CONV-001-01\` | 点击任务卡 | 显示 1 个详情 | \`.tmp/ac/AC-CONV-001-01.json\` |
`)
  writeFixture(root, 'specs/changes/CHG-GATE-201/spec.md', `# CHG-GATE-201 · 契约门禁夹具

状态：**进行中**（2026-11-24）
Implements: PRD-CONV-001
Covers: \`AC-CONV-001-01\`
Domains: \`CONV\`
Change: CHG-GATE-201
变更类型：**新功能**
Owner：测试
`)
}

function buildContractFixtures(base) {
  const pass = join(base, 'pass')
  writeFixture(pass, 'specs/contract/CONV/contract.md', contractFixture())
  writeContractFixtureSpecs(pass)
  const underscore = join(base, 'pass-underscore')
  writeFixture(underscore, 'specs/contract/CONV/contract.md', contractFixture({ errorCode: 'task_locked' }))
  writeContractFixtureSpecs(underscore, { errorCode: 'task_locked' })
  const fail = join(base, 'fail')
  writeFixture(fail, 'specs/contract/CONV/contract.md', contractFixture({ errorCode: 'conflict', selector: '.task-card:nth-child(2)' }))
  writeContractFixtureSpecs(fail, { errorCode: 'task_locked', width: 360, boundaryMax: 72 })
  const empty = join(base, 'empty')
  writeFixture(empty, 'specs/README.md', '# 空夹具\n')
}

function signature(run) {
  return run.findings
    .map((finding) => `${finding.rule}|${finding.path}|${finding.line}|${finding.severity}|${finding.message}`)
    .sort()
    .join('\n')
}

function runSelfTest(options = {}) {
  const base = join(DEFAULT_ROOT, '.tmp', 'gate-self-test', 'contract')
  const passRoot = join(base, 'pass')
  const failRoot = join(base, 'fail')
  const emptyRoot = join(base, 'empty')
  const assertions = []
  const line = (passed, text) => {
    assertions.push({ passed, text })
    console.log(`${passed ? 'PASS' : 'FAIL'} ${text}`)
  }
  try {
    buildContractFixtures(base)

    const passRun = runContract(passRoot, { domain: null })
    const passErrors = passRun.findings.filter((finding) => finding.severity === 'error').length
    line(passErrors === 0, `通过样例 error 数 期望 0 实际 ${passErrors}`)
    line(passRun.checks.length === 7, `通过样例检查项 期望 7 实际 ${passRun.checks.length}`)
    line(passRun.contracts === 1, `通过样例契约表数 期望 1 实际 ${passRun.contracts}`)
    const passNumeric = passRun.findings.filter((finding) => finding.rule === 'MX-G-52')
    line(passNumeric.length === 0, `通过样例 MX-G-52 命中数 期望 0 实际 ${passNumeric.length}`)

    const underscoreRun = runContract(join(base, 'pass-underscore'), { domain: null })
    const underscoreErrors = underscoreRun.findings.filter((finding) => finding.severity === 'error').length
    line(underscoreErrors === 0, `下划线错误码样例 error 数 期望 0 实际 ${underscoreErrors}`)

    const failRun = runContract(failRoot, { domain: null })
    const failedRules = [...new Set(failRun.findings.filter((finding) => finding.severity === 'error').map((finding) => finding.rule))].sort()
    line(
      failedRules.join(',') === 'MX-G-29,MX-G-30,MX-G-52',
      `失败样例命中规则 期望 MX-G-29、MX-G-30、MX-G-52 实际 ${failedRules.join('、')}`,
    )
    const failNumeric = failRun.findings.filter((finding) => finding.rule === 'MX-G-52' && finding.severity === 'error')
    line(failNumeric.length === 3, `失败样例 MX-G-52 命中数 期望 3 实际 ${failNumeric.length}`)
    const numericPaths = [...new Set(failNumeric.map((finding) => finding.path))].sort()
    line(numericPaths.length === 2, `失败样例 MX-G-52 覆盖两列 期望 2 实际 ${numericPaths.length}`)
    const second = runContract(failRoot, { domain: null })
    line(signature(failRun) === signature(second), '同一失败样例连续两次输出 期望 相同 实际 相同')
    const third = runContract(failRoot, { domain: null })
    line(signature(failRun) === signature(third), '同一失败样例连续三次输出 期望 相同 实际 相同')

    const emptyRun = runContract(emptyRoot, { domain: null })
    const emptyErrors = emptyRun.findings.filter((finding) => finding.severity === 'error').length
    line(emptyErrors === 1, `缺契约表 error 数 期望 1 实际 ${emptyErrors}`)
    line(
      emptyRun.findings.some((finding) => /建立域契约表/.test(finding.hint)),
      '缺契约表 期望 输出建表提示 实际 有提示',
    )

    const json = toJson(passRun)
    line(json.gate === 'contract' && Array.isArray(json.findings), '--json 结构 期望 gate=contract 且 findings 为数组 实际 符合')
    const filtered = runContract(passRoot, { domain: 'CONV' })
    line(filtered.contracts === 1, `--domain CONV 契约表数 期望 1 实际 ${filtered.contracts}`)
  } finally {
    // 自检夹具是本进程在 .tmp/gate-self-test/contract 下新建的临时产物，按任务
    // 要求跑完清理；路径守卫保证只删这一棵自检目录，不触碰仓库文件。
    if (options.keepFixtures) {
      console.log(`INFO 自检夹具保留在 ${relPath(DEFAULT_ROOT, base)}`)
    } else if (existsSync(base)) {
      const resolved = resolve(base)
      const guard = resolve(DEFAULT_ROOT, '.tmp', 'gate-self-test', 'contract')
      if (resolved.startsWith(guard + sep) || resolved === guard) {
        rmSync(resolved, { recursive: true, force: true })
      }
    }
  }
  const failed = assertions.filter((entry) => !entry.passed)
  if (failed.length > 0) {
    console.log(`SELF-TEST FAILED (${failed.length}/${assertions.length} assertions failed)`)
    return 1
  }
  console.log(`SELF-TEST PASS (${assertions.length} assertions)`)
  return 0
}

/* ----------------------------- 入口 ----------------------------- */

function printHelp() {
  console.log(`check-contract.mjs — 墨线契约一致性门禁（MX-G-26 至 MX-G-31、MX-G-52）

用法：
  node scripts/check-contract.mjs                   扫描 specs/contract/*/contract.md
  node scripts/check-contract.mjs --root <dir>      指定仓库根
  node scripts/check-contract.mjs --domain CONV     只查一个域
  node scripts/check-contract.mjs --json            机器可读输出
  node scripts/check-contract.mjs --self-test       生成 .tmp 夹具自检，跑完清理
  node scripts/check-contract.mjs --self-test --keep-fixtures  自检后保留夹具（调试用）
  node scripts/check-contract.mjs --help

检查项：
  MX-G-26 六类组、固定列、表前状态与冻结信息；Covers 每条 AC 在类 6 有契约项
  MX-G-27 类 1 字段与后端请求/响应字段、前端 props 归一后一致
  MX-G-28 类 2 状态全集与迁移同设计、前端一致；UI 状态限定八态
  MX-G-29 类 3 HTTP + code 与后端错误码表、前端错误态一致
  MX-G-30 类 5 选择器与设计、前端一致；禁止 nth-child 与位置路径
  MX-G-31 CT 编号唯一；类 6 AC 在产品 spec、测试计划中存在并有变更包回指
  MX-G-52 类 5 数值项与类 1 带单位边界值在五列同单位数字中保持一致；超出容差或集合不等记 error

口径：
  契约表路径 specs/contract/<域>/contract.md，域与 specs 下 P1-CONV 这类目录
  按后缀匹配。字段、状态、错误码、选择器从 Markdown 表格提取；某列文件缺失时
  该列记 warn 跳过。缺契约表时输出一条 MX-G-26 提示并退出 1，不抛异常。

输出：
  每项一行 PASS/FAIL 检查项 期望 实际；失败细节按 GATES.md 的
  \`[GATE-CONTRACT] path:line MX-G-NN 事实；统一为哪一侧的哪个值\` 输出；
  末两行 \`FAILED: <e> error(s), <w> warning(s)\` 与 \`<p> passed, <f> failed\`。
  退出码 0 无 error，1 有 error，2 参数或根目录错误。
`)
}

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, json: false, selfTest: false, help: false, domain: null, keepFixtures: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') options.json = true
    else if (arg === '--self-test') options.selfTest = true
    else if (arg === '--keep-fixtures') options.keepFixtures = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--root') {
      const value = argv[index + 1]
      if (!value) return { error: '--root 缺少目录参数' }
      options.root = resolve(value)
      index += 1
    } else if (arg === '--domain') {
      const value = argv[index + 1]
      if (!value) return { error: '--domain 缺少域代号' }
      options.domain = value
      index += 1
    } else {
      return { error: `未知参数 ${arg}` }
    }
  }
  return options
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.error) {
    console.error(options.error)
    process.exit(2)
  }
  if (options.help) {
    printHelp()
    process.exit(0)
  }
  if (options.selfTest) process.exit(runSelfTest(options))
  if (!isDir(options.root)) {
    console.error(`根目录不可读：${options.root}`)
    process.exit(2)
  }
  try {
    const run = runContract(options.root, options)
    if (options.json) console.log(JSON.stringify(toJson(run), null, 2))
    else printText(run)
    const errors = run.findings.filter((finding) => finding.severity === 'error').length
    process.exit(errors > 0 ? 1 : 0)
  } catch (error) {
    if (error instanceof PreflightError) {
      console.error(error.message)
      process.exit(2)
    }
    throw error
  }
}

main()
