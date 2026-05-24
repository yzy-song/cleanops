# CleanOps 功能清单

最后更新: 2026-05-24

## 已完成功能

### 1. 认证与权限 (Auth)

- JWT 登录/注册，角色区分 ADMIN / MANAGER / WORKER
- 客户 Magic Link 免密登录（30 分钟有效期）
- 全局 Throttle 限流（60s 内 100 次）

| 端点 | 说明 |
|------|------|
| `POST /auth/login` | 后台用户登录 |
| `POST /auth/register` | 注册新公司 + 管理员 |
| `POST /portal/send-link` | 客户 Magic Link 发送 |
| `POST /portal/verify` | Token 验证 |
| `GET /portal/me` | 客户个人信息 |

---

### 2. 公司管理 (Company)

- 公司 Profile 管理，基础时薪配置
- Stripe Connect OAuth 入网（接收收款）
- Xero OAuth 会计同步连接
- 14 天试用期 + 试用守卫（TrialGuard / @TrialBypass）

| 端点 | 说明 |
|------|------|
| `GET /company/stripe/connect` | 获取 Stripe Connect OAuth URL |
| `GET /company/stripe/callback` | OAuth 回调 |
| `GET /company/stripe/status` | Stripe 账户状态 |
| `GET /company/xero/connect` | 获取 Xero OAuth URL |
| `GET /company/xero/callback` | Xero 回调 |
| `GET /company/xero/status` | Xero 连接状态 |

---

### 3. 客户管理 (Customer)

- CRUD + 列表，支持名称/邮箱搜索
- 爱尔兰 Eircode + Access Code 字段
- 商业/住宅区分（影响 VAT）

| 端点 | 说明 |
|------|------|
| `GET /customer` | 客户列表 |
| `POST /customer` | 新建客户 |
| `GET /customer/:id` | 客户详情 |
| `PATCH /customer/:id` | 更新客户 |
| `DELETE /customer/:id` | 删除客户 |

---

### 4. 任务调度 (Job)

- 任务 CRUD + 状态机：PENDING → IN_PROGRESS → COMPLETED / ISSUE / CANCELLED
- Worker 分配（多对多中间表 JobAssignment）
- GPS 围栏打卡（start/end 位置 + 时间）
- 现场照片（BEFORE / AFTER / CHECKIN，Cloudinary 存储）
- 定金管理：生成 Stripe 支付链接 / 标记已付

| 端点 | 说明 |
|------|------|
| `GET /jobs` | 任务列表 |
| `POST /jobs` | 创建任务 |
| `GET /jobs/:id` | 任务详情 |
| `PATCH /jobs/:id` | 更新任务 |
| `POST /jobs/:id/deposit-link` | 生成定金支付链接 |
| `PATCH /jobs/:id/mark-deposit-paid` | 手动标记定金已付 |

---

### 5. 报价系统 (Quote)

- Quote 状态机：DRAFT → SENT → ACCEPTED / DECLINED / EXPIRED
- 7 种服务类型 × 8 种物业规模 × 4 种频率 → 自动定价
- 爱尔兰 VAT（住宅 13.5% / 商业 23%）
- 大额一次性订单自动要求 25% 定金
- Admin 后台：手动创建/发送/转为任务/拒绝
- 公开端：客户通过 token 链接查看报价、接受/拒绝
- **接受时如需定金自动生成 Stripe Connect 支付链接**

| 管理端点 | 说明 |
|------|------|
| `POST /quote` | 创建报价 |
| `GET /quote` | 报价列表 |
| `GET /quote/:id` | 报价详情 |
| `PATCH /quote/:id` | 更新报价 (DRAFT) |
| `POST /quote/:id/send` | 发送报价 (DRAFT→SENT) |
| `POST /quote/:id/convert` | 转为任务 (ACCEPTED→Job) |
| `POST /quote/:id/decline` | 拒绝报价 |

| 公开端点 | 说明 |
|------|------|
| `POST /portal/quote/calculate` | 实时定价计算 |
| `POST /portal/quote` | 公开表单创建报价 |
| `GET /portal/quote/:token` | 查看报价 |
| `POST /portal/quote/:token/accept` | 接受报价 → 创建任务 + 生成定金链接 |
| `POST /portal/quote/:token/decline` | 拒绝报价 |
| `GET /portal/quotes` | 客户自己的报价列表 |

| 前端页面 | 路径 |
|------|------|
| 报价列表 | `/quotes` |
| 创建报价 | `/quotes/new` |
| 报价详情 | `/quotes/[id]` |
| 公开报价页 | `/portal/quote/[token]` |

**关键文件**: `apps/api/src/quote/pricing.service.ts` (定价引擎), `apps/api/src/quote/quote.service.ts`, `apps/web/src/hooks/use-quotes.ts`

---

### 6. 账单系统 (Invoice)

- 任务完成自动生成账单
- VAT 计算（13.5% / 23%）
- Stripe Connect 支付链接（资金直达 Connected Account，平台收 1% 手续费）
- 手动标记已付 / 作废 / 催款邮件
- PDF 生成 + 下载
- Xero 同步（创建 Contact + Invoice）
- WhatsApp 分享支付链接

| 端点 | 说明 |
|------|------|
| `GET /invoice` | 账单列表 |
| `POST /invoice` | 创建账单 |
| `GET /invoice/:id` | 账单详情 |
| `PATCH /invoice/:id` | 更新账单 |
| `POST /invoice/:id/pay` | 生成 Stripe 支付链接 |
| `PATCH /invoice/:id/mark-paid` | 手动标记已付 |
| `PATCH /invoice/:id/void` | 作废 |
| `POST /invoice/:id/remind` | 发送催款邮件 |
| `GET /invoice/:id/pdf` | 下载 PDF |

| 前端页面 | 路径 |
|------|------|
| 账单列表 | `/invoices` |
| 账单详情 | `/invoices/[id]` |

---

### 7. SaaS 订阅计费 (Billing)

- 14 天试用 → 3 档订阅：STARTER / PRO / BUSINESS
- Stripe Customer Portal 管理订阅
- 试用守卫：全场强制试用检查，webhook/公开端点豁免

| 端点 | 说明 |
|------|------|
| `GET /billing/subscription` | 订阅状态 |
| `POST /billing/checkout` | 创建结账会话 |
| `POST /billing/portal` | 客户门户 |
| `POST /billing/webhook` | Stripe 订阅 webhook |

---

### 8. 客户自助门户 (Customer Portal)

- 客户查看自己的 Job 列表、发票列表
- Magic Link 免密登录
- 在线预约（book）
- 报价浏览与接受

| 前端页面 | 路径 |
|------|------|
| 门户首页 | `/portal` |
| 登录 | `/portal/login` |
| Token 验证 | `/portal/verify` |
| 在线预约 | `/book` |
| 报价查看 | `/portal/quote/[token]` |

---

### 9. 工人管理 (Worker)

- CRUD + 列表
- 关联 User（后台登录），关联 JobAssignment
- 个体时薪配置

---

### 10. 报表 (Report)

- 工时代报：Worker × 日期范围 × 工时汇总
- 发薪报：Worker 时薪 × 工时 × 金额
- VAT 报：按时期汇总 subtotal / VAT

---

### 11. Stripe 支付基础设施

- **SaaS 订阅**: Stripe Billing (checkout.session.completed, customer.subscription.updated/deleted)
- **Stripe Connect**: OAuth 入网，Connected Account 收款
- **发票支付**: Connect 结账会话 + 平台 1% 手续费
- **定金支付**: Job 定金 + Quote 接受时自动定金
- **Webhook**: 3 条管道（订阅/发票支付/Connect 账户状态）
- **退款**: `charge.refunded` 事件接收，反向转账退回手续费

---

## 待开发

| 功能 | 优先级 | 备注 |
|------|--------|------|
| 公开预订表单改造 | 高 | `/book` 加入服务选择 + 定价预览，对标 Spotless |
| 循环任务 (Recurring Jobs) | 高 | 按 WEEKLY / BI-WEEKLY 自动排班 |
| 客户门户发票支付 | 中 | 暴露支付链接到客户门户 |
| Stripe Elements 前端 | 低 | 目前用 Stripe 托管结账页，已可用 |
| 自动排班引擎 | 低 | 基于 Workers × Skills × Availability × Distance |

---

## 约定

- 金额统一用 cents (Int) 存储，显示时 `/ 100`
- 时间统一 UTC 存储，`date-fns-tz` 展示
- API 响应格式: `{ data, meta?: { total, page, limit } }`
- 前端数据用 React Query hooks，`useQuery` + `useMutation` + `invalidateQueries`
- Git 提交: `<type>: <描述>` (feat / fix / refactor / chore)
