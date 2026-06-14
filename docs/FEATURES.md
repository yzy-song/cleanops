# CleanOps Features / 功能清单

> Last updated / 最后更新: 2026-06-14

---

## 1. Auth & Permissions / 认证与权限

| Feature / 功能 | Status |
|---|---|
| JWT login/register, roles: ADMIN / MANAGER / WORKER | ✅ |
| Customer Magic Link (30-min TTL) / 客户免密登录 | ✅ |
| Global Throttle (100 req/60s) / 全局限流 | ✅ |
| @Auth() decorator with role guards / 角色守卫 | ✅ |
| Worker restricted from Customers/Reports/Invoices/Workers | ✅ |
| Manager: Automations, Worker deactivation restored | ✅ |

## 2. Company & Settings / 公司管理

| Feature / 功能 | Status |
|---|---|
| Company profile, base hourly rate, VAT number | ✅ |
| Per-company Stripe secret key (NOT Connect) / 公司自有密钥 | ✅ |
| Stripe key input with show/hide in Settings | ✅ |
| Xero OAuth2 connection + token refresh cron / 自动刷新 | ✅ |
| 14-day trial + TrialGuard / 14天试用 | ✅ |
| Stripe Billing webhook for subscriptions / 订阅支付回调 | ✅ |
| Setup checklist: Stripe/Xero/VAT status badges | ✅ |

## 3. Customer Management / 客户管理

| Feature / 功能 | Status |
|---|---|
| CRUD + list with search / 列表搜索 | ✅ |
| Irish Eircode + Access Code fields | ✅ |
| Commercial/Residential distinction (affects VAT) | ✅ |
| Credit risk list + summary per customer / 信用风险 | ✅ |
| Customer slide-out sheet (NewCustomerSheet) | ✅ |
| Auto-geocode: Eircode → Google Geocoding → lat/lng | ✅ |
| Filter by type: All / Commercial / Residential | ✅ |

## 4. Worker Management / 工人管理

| Feature / 功能 | Status |
|---|---|
| CRUD + list with deactivation / 停用 | ✅ |
| Worker slide-out sheet (NewWorkerSheet) | ✅ |
| Hourly rate, skills, work days / 工作日设置 | ✅ |
| Pay models: HOURLY | PER_JOB (commission % or flat €) / 提成制 | ✅ |
| Worker self-service: /worker/me/jobs, /worker/me/earnings | ✅ |
| Eircode → backend geocodes to lat/lng for routing | ✅ |

## 5. Job Management / 工单管理

| Feature / 功能 | Status |
|---|---|
| CRUD + list with status filter (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) | ✅ |
| Create Job slide-out sheet / 右侧滑出 | ✅ |
| Quick date filters: Today / Tomorrow / This Week / All Dates | ✅ |
| Client-side search by customer name/address/notes | ✅ |
| Calendar view: Day/Week/Month with drag-to-reschedule | ✅ |
| Drag job onto worker in sidebar to assign / 拖拽分配工人 | ✅ |
| GPS check-in/out with 200m geofencing / 地理围栏 | ✅ |
| Auto-complete on check-out / 签退自动完成 | ✅ |
| Recurring jobs: WEEKLY/BI-WEEKLY + daily 6AM auto-generation cron | ✅ |
| Batch assign, batch invoice, batch cancel | ✅ |
| CSV export (464 lines verified) | ✅ |

## 6. Scheduling & Routing / 排班与路线

| Feature / 功能 | Status |
|---|---|
| Auto-schedule: preview + apply / 自动排班预览+确认 | ✅ |
| Date validation (reject endDate < startDate) | ✅ |
| Nearest-neighbor TSP route optimization / 最近邻路线 | ✅ |
| Google Directions API: real road distance + driving time | ✅ |
| POST /jobs/optimize-route with polyline response | ✅ |
| Worker route polylines on map / 工人路线连线 | ✅ |

## 7. Map / 地图调度台

| Feature / 功能 | Status |
|---|---|
| Google Maps with markers (blue=assigned, gray=unassigned) | ✅ |
| Date navigation: prev/next day + date picker + Today | ✅ |
| InfoWindow: job details + worker assignment dropdown | ✅ |
| Worker route polylines with direction arrows | ✅ |
| Worker panel: availability status, assigned count | ✅ |
| Navigate button → Google Maps directions | ✅ |

## 8. Invoices & Payments / 发票与收款

| Feature / 功能 | Status |
|---|---|
| Auto-generate invoice on job complete / 完工自动开票 | ✅ |
| Invoice PDF: Irish-compliant VAT INVOICE / 合规发票 | ✅ |
| Invoice PDF: VAT Reg No, IBAN/BIC, 30-day terms | ✅ |
| Invoice list: Overdue/Unpaid/Paid summary cards | ✅ |
| One-click PDF download from list view | ✅ |
| Xero sync badge on synced invoices | ✅ |
| Stripe Payment Link per invoice / 支付链接 | ✅ |
| Generate, mark-paid, void, send reminder | ✅ |
| Xero auto-sync on create/paid/void (non-blocking) | ✅ |
| Stripe webhook: auto-mark-paid on checkout.session.completed | ✅ |

## 9. Quotes / 报价

| Feature / 功能 | Status |
|---|---|
| CRUD with status filter (DRAFT/SENT/ACCEPTED/DECLINED/EXPIRED) | ✅ |
| Pricing calculator / 计价器 | ✅ |
| Send, accept, decline, convert to job | ✅ |
| Status counts + pending pipeline value / pipeline金额汇总 | ✅ |

## 10. Pipeline / 销售看板

| Feature / 功能 | Status |
|---|---|
| Kanban board: Preparing/Sent/Won/Lost/Expired / 看板 | ✅ |
| Drag-to-move quotes between stages / 拖拽换状态 | ✅ |
| Valid transitions enforced (e.g. SENT→ACCEPTED, not SENT→DRAFT) | ✅ |
| Per-column revenue totals / 每列金额汇总 | ✅ |
| Drag overlay during move | ✅ |

## 11. Reports / 报表

| Feature / 功能 | Status |
|---|---|
| Payroll: per-worker earnings, hours, PAYE/PRSI/pension | ✅ |
| Payroll: bar chart + detail table + KPI cards | ✅ |
| VAT: residential (13.5%) vs commercial (23%) pie chart | ✅ |
| Timesheet: hours worked per worker, date range filter | ✅ |
| Profitability: revenue vs labor cost per job, margin % | ✅ |
| Profitability: bar chart + KPI (revenue/labor/profit/margin) / 毛利图表 | ✅ |

## 12. PDFs / PDF文档

| Feature / 功能 | Status |
|---|---|
| Irish VAT Invoice PDF (pdfmake) / 增值税发票 | ✅ |
| Irish Payslip PDF: PAYE + PRSI + USC + YTD / 工资条 | ✅ |
| GET /report/payslip/:workerId/pdf | ✅ |
| pdfmake v0.3.x API migration completed | ✅ |

## 13. Customer Portal / 客户门户

| Feature / 功能 | Status |
|---|---|
| Magic Link login / 免密登录 | ✅ |
| View own jobs, invoices / 查看自己的工单和发票 | ✅ |
| Book a service / 在线预约 | ✅ |
| Accept/decline quotes / 接受/拒绝报价 | ✅ |
| Leave review / 评价 | ✅ |
| Public booking page: /book/[company-slug] / 公开预约页 | ✅ |

## 14. Xero Integration / Xero集成

| Feature / 功能 | Status |
|---|---|
| OAuth2 connection with offline_access / 离线token | ✅ |
| Auto-sync invoice on create → Xero AUTHORISED invoice | ✅ |
| Auto-update Xero status on paid/void | ✅ |
| Auto-sync GPS work hours → Xero Payroll Timesheets / 工时同步 | ✅ |
| Token refresh cron (every 25 min) / Token自动刷新 | ✅ |
| New granular scopes: accounting.invoices + contacts + settings | ✅ |
| TokenSet properly set via setTokenSet() (xero-node v17 fix) | ✅ |

## 15. Google Maps / 谷歌地图

| Feature / 功能 | Status |
|---|---|
| Geocoding: Eircode → lat/lng (backend proxied) / 地址转坐标 | ✅ |
| Directions API: real road optimization + polyline / 道路优化 | ✅ |
| Map display: frontend key (HTTP restricted) / 地图显示 | ✅ |
| Backend key (IP restricted) for Geocoding + Directions / 后端Key | ✅ |

## 16. PWA / 渐进式Web应用

| Feature / 功能 | Status |
|---|---|
| manifest.json: CleanOps branding, standalone mode, start /dashboard | ✅ |
| iOS meta tags: apple-mobile-web-app-capable | ✅ |
| Workbox service worker with precaching + offline cache | ✅ |
| Install to home screen from any mobile browser / 安装到桌面 | ✅ |

## 17. Dev Infrastructure / 开发基础设施

| Feature / 功能 | Status |
|---|---|
| CI/CD: GitHub Actions → Oracle Cloud deploy | ✅ |
| CI: pnpm --filter @cleanops/db exec prisma migrate deploy / 数据库迁移 | ✅ |
| Migration: 2 files, database schema up to date | ✅ |
| CodeGraph: 2,791 nodes, 5,049 edges pre-indexed | ✅ |
| CLAUDE.md: bilingual root + apps/api + apps/web | ✅ |
| Docs: bilingual, organized in /docs | ✅ |

---

## Priority Gaps / 待做

| # | Feature / 功能 | Priority |
|---|---------|---------|
| 1 | **Offline mode** for workers in basements/rural / 离线模式 | 🔴 |
| 2 | **SMS notifications** for schedule changes / 排班短信通知 | 🔴 |
| 3 | **Job photos** — before/after images / 现场拍照 | 🟡 |
| 4 | **Mobile-friendly worker dashboard** — larger touch targets | 🟡 |
| 5 | **Client messaging** — in-app chat / 客户沟通 | 🟢 |
| 6 | **Forms/checklists** — job completion sign-off / 完工确认表 | 🟢 |
