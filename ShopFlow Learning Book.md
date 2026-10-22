# ShopFlow Learning Book
## Project journal, product strategy, engineering guide, and audit workbook

**Project:** ShopFlow  
**Last updated:** 15 October 2026  
**Current phase:** Read-only audit and project understanding  
**Development approach:** Work directly with ChatGPT; no Codex  
**Document status:** Expanded working edition — not a completed audit or final product specification

> **Important accuracy note:** This book combines (1) information captured in the original `ShopFlow Details.docx`, (2) implementation observations recorded during an earlier inspection of a project ZIP, and (3) general engineering explanations and proposed checklists. These are deliberately distinguished. The assistant does not have continuous access to the user's local folder. Before relying on a code finding, compare it with the current project. No code changes are authorized by this document.

---

# Contents

1. How to use this book
2. Project principles and working rules
3. ShopFlow's original vision
4. Product categories: what kind of software is this?
5. The problem behind the product
6. Target customers and discovery questions
7. Indian small-business realities
8. Competitive landscape recorded in the source document
9. Differentiation: what ShopFlow must prove
10. Candidate signature workflow: supplier invoice intelligence
11. Business memory, explanations, and recommendations
12. Natural-language interface principles
13. AI safety and human approval
14. Product discovery before feature expansion
15. Candidate roadmap from the source document
16. MVP scope and explicit non-goals
17. Current implementation snapshot
18. Preliminary requirement-to-feature matrix
19. Current audit method
20. Application architecture concepts
21. Frontend and Next.js concepts
22. API routes and validation
23. Authentication, authorization, and business isolation
24. Data modeling and Prisma/PostgreSQL
25. Transactions, stock, and financial correctness
26. Purchase invoice confirmation: recorded change
27. Weighted-average purchase cost: worked example
28. Test scenario and recorded results
29. Known risks and questions to investigate
30. File map from prior inspection
31. Testing and verification handbook
32. Manual end-to-end test plans
33. Security review checklist
34. Error handling and observability
35. Documentation and Git workflow
36. Beginner glossary
37. Learning exercises using ShopFlow
38. Decision log
39. Project timeline and change log
40. Current checkpoint and next actions
41. Appendices: checklists and templates

---

# 1. How to use this book

This is the continuing project journal. It should grow as the product is audited, tested, and improved.

Use it to answer:
- What is ShopFlow trying to solve?
- Why did we make a technical decision?
- Which files were involved?
- What evidence supports a finding?
- What was actually tested?
- What remains uncertain?
- What is the next safe step?

## 1.1 Evidence labels

Use these labels consistently.

| Label | Meaning |
|---|---|
| **Source requirement** | Explicitly described in `ShopFlow Details.docx` |
| **Recorded implementation observation** | A previous inspection reported this in source code |
| **Implemented and verified** | Current code and behavior were checked with relevant evidence |
| **Implemented, not fully verified** | Code appears present, but full workflow or edge cases were not tested |
| **Partial** | Some of the intended behavior exists, but the full outcome is not present |
| **Not found in reviewed code** | Not located in the files/areas inspected; not proof that it does not exist anywhere |
| **Proposed** | A product idea, design choice, or future improvement |
| **Needs investigation** | Evidence is incomplete or a risk needs testing |
| **Blocked** | Cannot proceed until a missing dependency or decision is resolved |

Do not upgrade a status merely because the feature sounds reasonable.

## 1.2 Source boundaries

- The original requirements document provides the product vision, competitor discussion, candidate workflows, and staged roadmap.
- The earlier code inspection provides preliminary implementation observations only.
- This book adds general software-engineering explanations to make the project easier to understand. Those explanations are not proof that a particular implementation already follows them.
- External competitor information quoted in the original requirements is recorded as source-document content, not independently re-verified in this book.
- Screenshots must be inspected directly before making claims about exact layout, visual bugs, or missing controls.

## 1.3 Updating this book

For every substantial work session, append:
1. Date and goal
2. Files or source materials inspected
3. Findings and their evidence
4. Decisions and why
5. Commands executed and exact results
6. Tests completed and not completed
7. Risks or open questions
8. Next checkpoint

Never delete old entries just to make the book shorter. Correct inaccurate entries explicitly and retain the history.

---

# 2. Project principles and working rules

## 2.1 The central rule: understand before changing

The project source explicitly argues against spending weeks coding before confirming that real shops need the solution. Product discovery should precede broad feature development.

For the current phase, the practical version of that rule is:

1. Read the requirements.
2. Inspect the current code and screenshots.
3. Map each requirement to evidence.
4. Identify confirmed defects separately from possible risks.
5. Report findings.
6. Get approval for a small fix batch.
7. Implement only the approved batch.
8. Verify the behavior and document the result.

## 2.2 Small, reviewable changes

Prefer changes that:
- Solve one clear problem.
- Touch the smallest reasonable number of files.
- Preserve unrelated behavior.
- Have a testable expected result.
- Can be reverted without undoing unrelated work.

Avoid broad rewrites unless evidence proves that a smaller repair is unsuitable.

## 2.3 Explain decisions for a beginner

When making a change, explain:
- What the file is responsible for.
- What the bug or gap is.
- Why the proposed fix works.
- What alternatives exist.
- What could go wrong.
- How the user can test it locally.

## 2.4 Never overstate verification

A successful build shows that the project passed the checks performed by the build command. It does not automatically prove:
- Authentication works correctly.
- Users cannot access another business's records.
- Stock remains correct under concurrent requests.
- Payments and credit balances are accurate.
- All screens work on mobile.
- Every route handles bad input.
- Production deployment is safe.

## 2.5 Work without Codex

The chosen working method is to continue directly with ChatGPT. Do not assume Codex is part of the workflow.

## 2.6 Background work and memory

The assistant cannot independently keep working after the conversation stops. This book and explicit checkpoints are the continuity mechanism. The user should keep a copy in the project root and maintain normal Git commits for code.

## 2.7 Data safety

Do not place passwords, API keys, access tokens, real customer names paired with financial details, or other private shop data in this journal. Use synthetic records for examples and tests.

---

# 3. ShopFlow's original vision

## 3.1 The broad idea

The source document describes ShopFlow as a possible “business operating system for small shops.” It also warns that this broad label is not enough to differentiate the product.

The long-term idea is not simply to record transactions. It is to help a shop owner understand the business:
- What happened?
- Why did it happen?
- What should I investigate?
- What decision might make sense next?

The difference matters. Recording sales is a feature. Explaining why sales declined because important products were out of stock is a decision-support capability—provided the system has reliable evidence for that explanation.

## 3.2 The real problem space

Small shops may have business information distributed among:
- Billing software
- Spreadsheets
- Paper notebooks
- Supplier invoices
- WhatsApp conversations
- Phone calls
- Memory
- Payment records
- Separate customer-credit ledgers

ShopFlow's opportunity, if validated, is to reduce the effort required to connect this information and answer useful business questions.

## 3.3 A possible product promise

A product promise should be specific enough to test. A possible *research hypothesis*, not a finalized tagline, is:

> ShopFlow helps a small-shop owner spot important changes in stock, supplier costs, sales, and customer dues, and understand the evidence behind those changes.

This hypothesis must be tested with shopkeepers and compared with what existing tools already provide.

## 3.4 What is not yet settled

The source document cautions against freezing the following too early:
- The precise target customer
- The core differentiating problem
- The final MVP
- The final database schema
- The final architecture
- The product's competitive position

The existing codebase already contains implementation work, but the product strategy can still be reviewed. The current audit should not erase working code simply because earlier product discovery was incomplete.

---

# 4. Product categories: what kind of software is this?

The source document separates several categories that are often mixed together.

## 4.1 Billing / point of sale (POS)

Typical flow:

`Product → Cart → Payment → Invoice`

A billing system records what was sold and what the customer paid or owes. A POS interface is optimized for making a sale at the counter.

## 4.2 Inventory management

Typical events:
- Purchase received → stock increases.
- Sale completed → stock decreases.
- Return accepted → stock changes according to the return.
- Stock count corrected → an adjustment is recorded.
- Stock below a threshold → alert or task may be created.

Inventory is not merely a number on a product row. To explain stock changes, a system usually needs a movement history.

## 4.3 Accounting

Accounting may cover:
- Sales
- Purchases
- Expenses
- Receivables
- Payables
- Tax records
- Cash flow
- Profit and loss
- Reconciliation

A product with a sales dashboard is not automatically a complete accounting system. ShopFlow should not claim accounting completeness unless the scope and calculations are defined and verified.

## 4.4 Digital ledger / customer credit

A common workflow is:

`Customer → Credit sale → Payment received → Outstanding balance → Reminder`

This is important in many Indian shops, but the source document notes that dedicated digital-ledger products already serve this need. A credit feature alone is not enough to differentiate ShopFlow.

## 4.5 Business management

A broader business-management system may connect:
- Products
- Customers
- Suppliers
- Purchases
- Sales
- Employees
- Inventory
- Payments
- Expenses
- Reports
- Documents
- Communication

## 4.6 Business intelligence and AI

This is the intended area of particular interest:
- Explain trends and changes.
- Detect anomalies.
- Compare supplier pricing.
- Identify slow-moving stock.
- Estimate reorder needs.
- Summarize business activity in plain language.
- Help the owner investigate the reason behind a result.

AI is not a differentiator by itself. The workflow, reliability, ease of use, and value delivered matter more than the label “AI.”

---

# 5. The problem behind the product

## 5.1 Feature thinking versus decision thinking

The source document recommends moving from “What features should the app have?” to “What difficult decision does the shopkeeper currently have to make?”

Examples from the source:

| Data or report | More useful decision question |
|---|---|
| 14 units remain | Should I buy more, and how much? |
| Supplier charged ₹840 | Why did the price rise from ₹780 to ₹840? |
| Product sold three times this month | Is it worth keeping in the shop? |
| Customer owes ₹8,500 | Which outstanding accounts need attention? |
| Stock has not sold recently | How much capital may be tied up in slow-moving items? |

These questions are hypotheses. The shopkeeper may use different language or care about different problems.

## 5.2 Why the answer needs evidence

An insight such as “profit declined because purchase costs increased” must be supported by data:
- Which period is being compared?
- Are the periods equal in length?
- Which sales and purchase costs were included?
- Were returns, discounts, taxes, and expenses handled consistently?
- Is purchase cost recorded accurately?
- Are there missing transactions?

If the data is incomplete, the interface should say so. A confident but unsupported explanation can mislead a business owner.

## 5.3 A practical discovery exercise

Before adding a new feature, ask:
1. What decision is the owner making?
2. What information do they currently use?
3. Where does that information come from?
4. How long does it take to answer the question?
5. What happens if the answer is wrong?
6. How often does the question arise?
7. How do they know whether their current answer is correct?
8. Would they trust a suggested answer, and what evidence would they need?

---

# 6. Target customers and discovery questions

The source document lists these possible shop types:
- Kirana / grocery
- Hardware
- Electronics
- Mobile
- Pharmacy
- Clothing
- Electrical
- Wholesale

They should not automatically be treated as one uniform customer segment. Their workflows can differ substantially.

## 6.1 Candidate interview questions

Ask about recent behavior rather than hypothetical interest.

1. “Can you walk me through the last time you purchased stock?”
2. “How do you compare prices between suppliers?”
3. “What do you do when a supplier sends an invoice?”
4. “How do you know which products are running low?”
5. “Tell me about the last time a product was out of stock.”
6. “How do you record credit sales and payments?”
7. “How do you decide what to reorder?”
8. “Which business question takes you the longest to answer?”
9. “What do you currently use—paper, WhatsApp, Excel, or software?”
10. “What do you dislike about the current method?”
11. “Can you show an example using fictional or safely redacted data?”
12. “What would make you stop using a new app?”

Do not lead the interview by describing the proposed solution. That can bias the answers.

## 6.2 Evidence to record

For each interview, capture:
- Shop type and approximate workflow, without unnecessary personal data
- Task being performed
- Existing tools used
- Time or effort required, if observable
- Errors or repeated work
- Consequence of the problem
- Current workaround
- Frequency of the task
- Whether the owner already tried another tool
- Follow-up questions

## 6.3 Avoid premature generalization

One shopkeeper's complaint is useful evidence, but it is not proof that every shop has the same problem. Compare patterns across multiple shops before deciding which segment and workflow to prioritize.

---

# 7. Indian small-business realities

The source document emphasizes that Indian small businesses should not be treated as miniature versions of Western businesses.

Potential realities to investigate include:
- UPI
- WhatsApp
- GST
- Informal credit / udhar
- Supplier relationships
- Paper and handwritten invoices
- Regional languages
- Mixed cash, UPI, and credit transactions
- Poor or intermittent connectivity
- Family-run shops
- Employees with different levels of technical comfort
- Multiple suppliers for similar products
- Customers who may not want to install another app

These are research prompts, not assumptions about every shop.

## 7.1 Design implications to validate

- **Minimal data entry:** Can common actions be completed without typing every detail?
- **Mobile usability:** Can the owner use the app while working at the counter?
- **Trust:** Are totals and stock changes explainable?
- **Recovery:** What happens after a network interruption or accidental action?
- **Language:** Which languages are genuinely needed for the chosen segment?
- **Offline behavior:** Is offline support essential for the target shops, and what data must be available offline?
- **Payment methods:** Are cash, UPI, partial payment, and credit represented correctly?
- **Workflow fit:** Does the software match how invoices, deliveries, and payments really happen?

Do not promise offline support or integrations until their behavior has been designed and tested.

---

# 8. Competitive landscape recorded in the source document

This section summarizes the competitor descriptions in `ShopFlow Details.docx`. The descriptions and adoption figures are from that document and have **not been independently re-verified in this book**. Product capabilities and company claims can change.

## 8.1 Vyapar

The source document describes Vyapar as focused on Indian small businesses, with capabilities including:
- Billing and GST
- Inventory
- Purchases and sales orders
- Customer and supplier management
- Receivables and payables
- Expenses and reports
- Low-stock alerts
- Barcode scanning
- Multi-user and multi-warehouse functionality
- WhatsApp integration
- Offline operation

The document notes that different company pages reported different adoption figures and cautions against treating either as a precise market-share statistic.

**Product lesson recorded in the source:** Billing plus inventory is not enough to make ShopFlow distinctive.

## 8.2 myBillBook

The source document lists:
- GST and non-GST billing
- Inventory and low-stock alerts
- Batch and expiry management
- Purchase orders and POS
- Customer and supplier management
- Payment tracking and accounting
- Multi-location inventory
- Serial/IMEI tracking
- WhatsApp alerts

The source document also mentions a company-reported user figure. Treat company-reported adoption numbers as claims, not independently verified market share.

**Product lesson recorded in the source:** A simple billing app is an already crowded concept.

## 8.3 OkCredit

The source document describes OkCredit as focused on the Indian bahi khata / udhar workflow:
- Customer credit and payments
- Customer balances
- Payment reminders
- WhatsApp reminders
- UPI payments
- Supplier accounts
- Statements and PDF reports
- Offline use
- Multiple Indian languages

**Product lesson recorded in the source:** Digitizing a paper credit notebook alone is not a unique product position.

## 8.4 Zoho Books

The source document describes Zoho Books as a broader business-software product with:
- Invoicing
- Customers and vendors
- Purchases and sales
- Inventory
- Expenses and payments
- GST
- Banking/reconciliation
- Reports
- Customer portals and reminders
- AI features, document scanning, and workflow automation

The source document also mentions plain-English questions and anomaly identification as AI capabilities described by Zoho's India site at the time the source was written.

**Product lesson recorded in the source:** Adding AI to billing and inventory alone does not prove differentiation.

## 8.5 Shopify POS

The source document uses Shopify POS as a global retail reference, connecting:
- Physical and online stores
- Orders and inventory
- Customers
- Staff
- Payments
- Analytics

**Product lesson recorded in the source:** Retail synchronization and analytics are mature categories too.

## 8.6 How to use competitor research

Competitors are research material, not enemies. For each competitor, eventually record:
- Target customer
- Primary job to be done
- Key workflow
- Data entered manually versus imported
- Reporting and explanation capabilities
- AI features and their limits
- Mobile and offline behavior
- Integration options
- Trust, recovery, and audit behavior
- Complaints or unmet needs from real users
- What is outside the product's scope

Do not assume a gap exists just because the current source document does not mention a feature. Verify the competitor's current product and test the actual workflow.

---

# 9. Differentiation: what ShopFlow must prove

## 9.1 A broad category is not a strategy

“Business OS for small shops” describes a category. It does not yet answer:
- Which customer is the first priority?
- Which problem is urgent enough to solve?
- Why are existing tools insufficient?
- Why would the customer change their current process?
- What evidence would prove ShopFlow is better?

## 9.2 A possible direction from the source

The source document suggests a system that sits above business information and helps the owner understand it. It proposes exploring a particular underserved workflow rather than immediately replacing products like Vyapar or Zoho.

One candidate is supplier-invoice and purchase intelligence:
- Capture purchase information from supplier documents.
- Normalize product, quantity, cost, tax, supplier, invoice number, and date.
- Compare prices across suppliers and across time.
- Show the evidence behind price changes.
- Help the owner make an informed purchasing decision.

This is a candidate direction, not a validated final strategy.

## 9.3 Differentiation test

Before claiming that ShopFlow is unique, complete this sentence with evidence:

> Existing products already do **[known capability]**. The target shopkeepers still struggle with **[observed problem]** because **[evidence from workflow research]**. ShopFlow focuses on **[narrow solution]**, measured by **[observable outcome]**.

If the sentence cannot be completed honestly, product discovery is not finished.

---

# 10. Candidate signature workflow: supplier invoice intelligence

This is one of the strongest concepts in the source document, but it is still a proposal that needs validation.

## 10.1 Example input

A shop may receive similar products from two suppliers:

| Product | Supplier A | Supplier B |
|---|---:|---:|
| USB cable | 100 × ₹80 | 100 × ₹72 |
| Charger | 50 × ₹240 | 50 × ₹225 |
| Adapter | 30 × ₹150 | 30 × ₹160 |

The numbers are illustrative examples from the source document, not live supplier data.

## 10.2 Candidate workflow

1. The user uploads a supplier invoice.
2. The system extracts likely fields.
3. The user reviews the extracted values.
4. The system matches invoice lines to known products, flagging uncertain matches.
5. The user corrects mismatches.
6. The system shows quantities, prices, taxes, supplier, invoice number, and date.
7. The user confirms the draft.
8. Only after confirmation does the application update stock and purchase records.
9. The system preserves the original document and an audit trail, subject to the final storage/privacy design.
10. Price-comparison screens show how the comparison was calculated.

## 10.3 Data extraction is not the same as correct data

An OCR or AI model may confuse:
- `8` with `3`
- `0` with `O`
- Decimal points
- Product codes
- Unit quantity and pack quantity
- Tax percentage and tax amount
- Discount and final price
- Similar product names

The system should make uncertainty visible and require user confirmation before changing inventory or financial records.

## 10.4 Price comparison questions

Before comparing supplier costs, decide:
- Is the comparison before or after tax?
- Are discounts included?
- Are units and pack sizes equivalent?
- Are shipping or other charges included?
- Is the price a one-time promotion?
- Are product variants identical?
- Are old prices still relevant?
- Does the shop actually buy the same quantity from each supplier?

A lower displayed unit price is not always the best total purchasing decision.

## 10.5 Success criteria to test

Potential measures:
- Time taken to enter an invoice
- Number of fields the user must correct
- Rate of correct product matching
- Number of duplicate invoices prevented
- Frequency of stock corrections after purchase
- Whether owners understand and trust the price comparison

Do not claim these benefits until measured.

---

# 11. Business memory, explanations, and recommendations

## 11.1 Business memory

The source document imagines an owner asking, “What happened to my business last month?” The system might summarize sales, margins, inventory value, and slow-moving stock rather than requiring the owner to open multiple reports.

A narrative summary should identify:
- The time period
- The comparison period
- The most important observed changes
- Supporting metrics
- Data limitations
- A path to inspect the underlying records

## 11.2 From “what” to “why”

The source document proposes a progression:

`What happened? → Why might it have happened? → What should I investigate next?`

Example hypothesis:
1. Sales decreased.
2. A subset of important products sold less.
3. Those products had stockouts.
4. Supplier deliveries were delayed.
5. A particular supplier was associated with the delays.

Each link needs evidence. The system should not turn a correlation into a definitive causal claim without sufficient support.

## 11.3 Slow-moving stock

A possible insight is that stock has not sold within a selected period. To calculate it reliably, define:
- The observation period
- What counts as a sale
- How returns are handled
- Whether inactive or discontinued products are excluded
- Whether stock on hand is current
- How inventory value is calculated
- Whether the metric means “no sale” or merely “low sales”

A “no recorded sale” result does not prove that no real-world sale happened if transactions were not entered into the system.

## 11.4 Reorder suggestions

A reorder recommendation might use:
- Recent sales rate
- Current stock
- Incoming purchase orders
- Supplier lead time
- Safety stock
- Minimum order quantity
- Seasonal demand, if reliable history exists

A first version should explain the inputs and avoid pretending that a simple average is a guaranteed forecast.

## 11.5 Supplier price changes

To flag an increase:
- Compare equivalent products and units.
- Use consistent tax and discount treatment.
- Identify the prior and current purchase records.
- Show absolute and percentage change.
- Allow the owner to inspect the invoices.
- Avoid conclusions based on too few or incomparable purchases.

## 11.6 Customer dues

A credit summary must use a clearly defined balance:
- Credit sales
- Payments
- Returns or credit notes, if supported
- Adjustments
- Relevant opening balances
- Selected date or “as of” time

Do not confuse sales revenue with cash received or outstanding customer balance.

---

# 12. Natural-language interface principles

The source document proposes allowing users to ask questions in everyday language rather than navigating complex report menus.

Examples:
- “What do I need to buy tomorrow?”
- “Who hasn't paid me?”
- “Where am I paying too much?”
- “Which products haven't sold in 30 days?”
- “Which supplier increased prices this month?”
- “How much money is tied up in customer credit?”

## 12.1 The system must understand the question safely

A natural-language interface should:
1. Identify the user's intended question.
2. Determine which approved data sources are needed.
3. Apply the correct business and permission scope.
4. Use defined calculations, not invented arithmetic.
5. Return an answer with its period and assumptions.
6. Show supporting records or a path to them.
7. Ask a clarifying question when the request is ambiguous.
8. Say when data is missing or the answer cannot be calculated.

## 12.2 Avoid unconstrained database actions

A language model should not be allowed to run arbitrary database queries or change financial records simply because a user phrased a request in natural language. Use controlled operations and permission checks.

## 12.3 Helpful answer format

A trustworthy business answer can contain:
- **Answer:** concise result
- **Period:** exact date range
- **Basis:** calculation or records used
- **Caveat:** missing data or assumption
- **Next step:** view details or prepare a draft action

This is a proposed design pattern, not a claim about the current intelligence page.

---

# 13. AI safety and human approval

The source document explicitly warns against allowing AI to make financial or business decisions without verification.

## 13.1 Safe staged automation

`Detect → Explain → Show evidence → Draft action → Owner reviews → Owner approves → Execute`

Examples:
- Suggest a purchase order, but do not send it automatically.
- Extract an invoice into a draft, but do not update stock until confirmation.
- Flag an unusual price, but do not accuse a supplier of wrongdoing.
- Recommend contacting a customer, but do not send a message without the intended authorization and review.

## 13.2 Important safeguards

- Permission checks must happen on the server.
- AI output is untrusted input.
- Validate extracted numbers, dates, quantities, and tax fields.
- Make duplicate detection explicit.
- Preserve an audit trail for consequential actions.
- Provide a way to correct mistakes.
- Make irreversible actions difficult to trigger accidentally.
- Show when an answer is based on incomplete data.
- Do not expose one business's data to another business.
- Keep secrets and private documents out of prompts unless the architecture and provider handling have been reviewed.

## 13.3 Human confirmation is not a substitute for validation

The server still needs to reject invalid values and unauthorized actions. A user can accidentally approve a wrong extraction, so the interface should make unusual or uncertain values easy to notice.

---

# 14. Product discovery before feature expansion

The source document recommends a proper discovery phase.

## 14.1 Market research

Investigate:
- Indian competitors
- Global competitors
- Target customers
- Existing workflow coverage
- Report and AI capabilities
- Integration options
- Known limitations
- User complaints and workarounds

The aim is not merely to make a feature checklist. It is to discover which difficult workflow remains poorly served.

## 14.2 Customer research

Choose specific shop types and observe real tasks. Ask what remains difficult after they already use their current billing or accounting software.

## 14.3 Workflow mapping

The source document proposes studying a chain like:

`Supplier → Purchase → Inventory → Customer → Sale → Payment → Credit → Reports`

At each step, ask:
- What data is created?
- Who enters it?
- Where is it stored?
- Is it duplicated?
- What errors happen?
- What information is lost?
- Which later decision depends on it?

## 14.4 Validation before building more

A useful early validation could be a paper prototype, a small mock workflow, or a demonstration with synthetic data. The goal is to test whether the workflow solves a real problem before spending time on a large implementation.

---

# 15. Candidate roadmap from the source document

The following phases are from `ShopFlow Details.docx`. They describe the proposed development sequence, not proof that every phase was fully completed.

## Phase 1 — Foundation

- Project setup
- Authentication
- Shop/business account
- Dashboard
- Users and roles
- Database architecture

## Phase 2 — Products

- Add products
- Categories
- SKU
- Purchase price
- Selling price
- Stock quantity
- Low-stock threshold

## Phase 3 — Sales

- Create sale
- Customer
- Sale items
- Automatic stock reduction
- Sales history
- Basic reports

## Phase 4 — Purchases

- Suppliers
- Purchase orders
- Purchase invoices
- Stock increases
- Purchase history

## Phase 5 — Customer credit

- Customer balance
- Credit transactions
- Payments
- Outstanding amount
- Transaction history

## Phase 6 — Intelligence

Only after the foundation works:
- Invoice extraction
- Natural-language search
- Sales summaries
- Low-stock predictions
- Price-change detection
- Business insights

## Phase 7 — Real-world readiness

- Testing
- Security
- Rate limiting
- Audit logs
- Deployment
- Backups
- Monitoring
- Documentation

## 15.1 How to interpret the roadmap now

The current source code has progressed beyond the original “do not start coding yet” discovery stage. That means we must preserve and audit the existing work rather than pretend development has not begun.

The product principle still applies: do not expand the codebase without understanding the value and validating behavior.

---

# 16. MVP scope and explicit non-goals

The final MVP is **not yet formally frozen**. The following are questions and guardrails to resolve during product discovery and the audit.

## 16.1 Possible foundation scope

Potentially necessary for a coherent first version:
- Business account and secure sign-in
- Product catalogue and stock
- Sales and stock deduction
- Supplier and purchase records
- Customer records and credit, if the target workflow needs it
- Reliable history of stock and financial changes
- A few accurate, useful reports

This is a candidate list, not an authorization to add every feature.

## 16.2 Possible non-goals for the first release

Consider deliberately postponing:
- Replacing a full accounting package
- Supporting every shop category at once
- Full multi-warehouse complexity before it is needed
- Fully autonomous purchasing
- Unverified AI forecasts
- Broad integrations before the core workflow is stable
- Advanced automation without auditability
- Feature parity with large competitors

## 16.3 Definition of a useful MVP

An MVP is not simply the smallest app that compiles. It is the smallest coherent product that allows a target user to complete a valuable workflow safely and reliably.

---

# 17. Current implementation snapshot

This snapshot summarizes the earlier inspection recorded in conversation. It must be re-checked against the current local project before being treated as current truth.

## 17.1 Areas reported as present

- Authentication routes/pages for registration, login, and logout
- Business and user models
- Dashboard page and summary API/service
- User role values `OWNER`, `MANAGER`, `STAFF`
- Product/inventory/category page and API areas
- Stock quantities, thresholds, movements, and adjustment API
- Sales page/API/service and sale history models
- Supplier and purchase-order areas
- Purchase-invoice API and service
- Customer detail/credit API/service and transaction model
- Audit-log model/service
- Intelligence page

## 17.2 Areas reported as incomplete or uncertain

- Role-management UI/API was not found in the reviewed areas.
- Comprehensive reports were not established.
- AI invoice extraction was not found in inspected source.
- Natural-language smart search appeared to be marked for later connection.
- Some business-insight sections appeared as “Coming soon.”
- Rate limiting was not found in inspected code.
- A Settings navigation link existed, but a corresponding page was not found in the reviewed files.
- Categories existed in a page/API area but were not in the main navigation.
- Audit-log coverage was not verified.
- A dedicated automated test suite was not found in the earlier ZIP inspection.
- Sale unit-price override policy needs investigation.
- Credit-payment concurrency needs investigation.

“Not found” and “needs investigation” are intentionally not treated as confirmed defects.

---

# 18. Preliminary requirement-to-feature matrix

This is an audit workbook. Update the evidence column with exact current paths, route names, test cases, and results after re-inspection.

| Requirement / area | Source intent | Preliminary implementation note | Current status |
|---|---|---|---|
| Authentication | Foundation phase | Login/register/logout reported present | Needs fresh verification |
| Business account | Each shop/business has a context | Business/user models reported present | Needs fresh verification |
| Users and roles | Foundation phase; roles in user model | `OWNER`, `MANAGER`, `STAFF` reported; management UI/API not found in reviewed areas | Needs investigation |
| Dashboard | Foundation phase | Page and summary service reported | Verify calculations and empty states |
| Products | Product phase | Product pages/API reported | Verify full CRUD and validation |
| Categories | Product phase | Page/API reported; navigation visibility uncertain | Verify navigation and workflow |
| SKU | Product phase | Product model/UI reported generally; exact behavior not re-audited | Needs investigation |
| Purchase price | Product and purchase phases | Product cost and purchase invoice service discussed | Verify historical and average-cost policy |
| Selling price | Product/sales phases | Sales flow present; override policy uncertain | Needs investigation |
| Stock quantity | Product phase | Stock quantity/movements reported | Verify invariants and concurrency |
| Low-stock threshold | Product phase | Threshold/adjustment areas reported | Verify alert behavior |
| Sales | Sales phase | Page/API/service reported | Run full workflow |
| Automatic stock reduction | Sales phase | Must be verified from current service and tests | Needs investigation |
| Sales history | Sales phase | History model/page reported | Verify filters and calculations |
| Basic reports | Sales phase | Dashboard summary present; report completeness unclear | Partial/uncertain |
| Suppliers | Purchase phase | List/create and service reported | Verify update/delete/search expectations |
| Purchase orders | Purchase phase | Pages/API reported | Verify states and transitions |
| Purchase invoices | Purchase phase | API/service reviewed earlier | Re-test all invoice states |
| Stock increases on purchase | Purchase phase | Confirmation service described | Re-verify current code and edge cases |
| Purchase history | Purchase phase | Supplier detail displayed purchase invoices | Verify scoping and filtering |
| Customer credit | Credit phase | API/service/model reported | Verify balance invariants |
| Credit payments | Credit phase | Transaction model reported | Test partial/full payments and concurrency |
| Outstanding amount | Credit phase | Intended capability | Verify calculation and date basis |
| Invoice extraction | Intelligence phase | Not found in inspected source | Not found in reviewed code |
| Natural-language search | Intelligence phase | Page appeared to have placeholder text | Partial / re-check |
| Sales summaries | Intelligence phase | Some dashboard summaries exist | Verify scope and correctness |
| Low-stock prediction | Intelligence phase | Not established | Needs investigation |
| Price-change detection | Intelligence phase | Not established | Needs investigation |
| Business insights | Intelligence phase | Some placeholder sections reported | Partial / re-check |
| Security | Real-world readiness | Some auth/business scoping observed; broad review incomplete | Needs full review |
| Rate limiting | Real-world readiness | Not found in inspected areas | Needs investigation |
| Audit logs | Real-world readiness | Model/service present; coverage unknown | Needs investigation |
| Deployment | Real-world readiness | Not evaluated in this checkpoint | Not audited |
| Backups | Real-world readiness | Not evaluated | Not audited |
| Monitoring | Real-world readiness | Not evaluated | Not audited |
| Documentation | Real-world readiness | This journal is being expanded | Partial |

---

# 19. Current audit method

## 19.1 Read-only first pass

No code edits during the initial audit. Inspect:
- Project structure
- `package.json` scripts
- Prisma schema and migrations
- Navigation and page routes
- API routes
- Services and validation schemas
- Authentication and session handling
- Tests, if present
- Reference screenshots
- Requirements in `ShopFlow Details.docx`

## 19.2 Trace a workflow across layers

For a feature such as purchase confirmation, trace:

`Page/form → API route → authentication → validation → service → database transaction → audit log → response → UI refresh`

A page alone cannot prove that the operation is secure or correct.

## 19.3 Classify each finding

**Confirmed defect:** Reproduced behavior or a clear code-level violation of a stated invariant.

**Potential risk:** A credible failure scenario that has not yet been reproduced.

**Missing requirement:** The source explicitly requires it, and review shows no implementation in the relevant areas.

**Product decision:** The expected behavior is not defined yet.

**Usability observation:** A screen or workflow may be confusing, but user testing or screenshot evidence is needed to confirm impact.

## 19.4 Evidence standard

For each finding, record:
- Requirement or invariant
- Exact file/path and function or route
- What the code does
- Expected behavior
- Reproduction or test
- Impact
- Confidence
- Proposed smallest fix
- Dependencies and regression tests

## 19.5 Report before fixes

The audit report must be shown to the user before making changes. The user then chooses or approves a small first batch.

---

# 20. Application architecture concepts

This chapter explains common architecture concepts relevant to the stack named in the project. It is educational context, not proof that every part is implemented in a particular way.

## 20.1 Frontend

The frontend is the interface the user interacts with:
- Forms
- Tables
- Buttons
- Navigation
- Loading states
- Error messages
- Confirmation dialogs
- Responsive layouts

The frontend can improve usability, but it must not be trusted as the sole security boundary.

## 20.2 API layer

The API receives requests and returns responses. It should:
1. Authenticate the user.
2. Validate the request.
3. Establish the user's business scope.
4. Check permissions.
5. Call the appropriate business logic.
6. Return a safe, consistent response.

## 20.3 Service layer

A service contains business operations, such as confirming a purchase invoice. Keeping this logic out of a UI component makes it easier to test and reuse.

## 20.4 Database

PostgreSQL stores persistent records and enforces relational constraints. Prisma provides a typed application interface for many database operations, while raw SQL may still be used for specific locking behavior.

## 20.5 Why layers matter

If all logic is placed in the UI, it is easy for an API caller to bypass it. If every API route duplicates complex calculations, behavior can drift. A well-defined service layer helps keep important rules consistent.

---

# 21. Frontend and Next.js concepts

## 21.1 Pages and routes

In a Next.js App Router project, folders under `app` commonly represent URL segments. For example, a file at `app/suppliers/page.tsx` commonly defines the `/suppliers` page.

Dynamic segments such as `app/suppliers/[supplierId]/page.tsx` represent a page for a specific supplier ID.

These are common conventions; verify the current routing structure before relying on a path.

## 21.2 Client-side state

A page may keep local state for:
- Form values
- Loading indicators
- Error messages
- Search filters
- The currently selected item

Local state is useful for the interface, but the database remains the source of truth for saved business data.

## 21.3 Loading, empty, and error states

Every data-driven screen should be reviewed for:
- Initial loading
- No records yet
- Successful data load
- Validation errors
- Unauthorized access
- Network failure
- Server error
- Duplicate submission
- Stale data after an update

## 21.4 Forms

For each form, verify:
- Required fields are clear.
- Values are validated in the UI and server.
- Errors identify the field or problem.
- Double-clicking submit does not create duplicate records.
- A successful save gives clear feedback.
- The screen refreshes the correct data.
- A failed save does not falsely show success.

## 21.5 UI polish is not the same as correctness

A screen can look professional and still have a security or calculation bug. The audit should cover both usability and behavior.

---

# 22. API routes and validation

## 22.1 Why validation belongs on the server

Users can bypass the normal UI and call an API directly. Therefore, the server must validate all input even if the form already performs validation.

## 22.2 Typical validation examples

For a product:
- Name is non-empty and within an appropriate length.
- SKU follows the chosen uniqueness policy.
- Price and cost are valid non-negative values where applicable.
- Quantity follows the product's unit rules.
- Category belongs to the same business.
- Fields not intended for user control are ignored or rejected.

For a purchase invoice:
- Supplier belongs to the current business.
- Product IDs belong to the same business.
- Quantity is valid and positive where required.
- Unit price and tax values follow the schema's rules.
- Invoice state permits the requested action.
- Duplicate confirmation does not apply stock twice.

## 22.3 Malformed JSON

The earlier inspection reported that malformed JSON in supplier and purchase-invoice routes may return HTTP 500. This needs re-checking. If confirmed, malformed client input should normally be treated as a client error with a consistent response, while unexpected server failures should remain server errors.

Do not change error handling until the current routes and response conventions are inspected.

## 22.4 Error responses

A useful API response should be:
- Consistent
- Clear enough for the client to react
- Free of secret/internal stack-trace details
- Specific enough to distinguish validation, authentication, authorization, not-found, conflict, and unexpected server errors

---

# 23. Authentication, authorization, and business isolation

## 23.1 Authentication versus authorization

- **Authentication:** Who is making the request?
- **Authorization:** Is that user allowed to perform this action on this record?

A logged-in user is not automatically allowed to access every business or every operation.

## 23.2 Business isolation

For a multi-business app, every record access must be scoped correctly. For example, when a supplier is requested, the server should ensure it belongs to the authenticated user's business.

Do not trust a `businessId` supplied by the browser as proof of access. The server should derive the user's business context from the authenticated session and enforce it in the query or service.

The earlier supplier-route inspection reported this pattern for supplier list/create, but the whole application has not been audited.

## 23.3 Roles

The earlier inspection reported role values `OWNER`, `MANAGER`, and `STAFF`. The existence of role values does not prove role enforcement.

For every sensitive operation, define:
- Which roles can view it?
- Which roles can create it?
- Which roles can edit it?
- Which roles can delete or reverse it?
- Which actions require owner approval?
- What should happen if a role is missing or invalid?

Enforce these rules server-side.

## 23.4 Security test idea

Create two test businesses with separate test users and records. Attempt to read, edit, or delete a record from the other business by changing the ID in the request. The expected outcome is denial without leaking the other business's data.

Use only test accounts and synthetic data.

---

# 24. Data modeling and Prisma/PostgreSQL

## 24.1 Relational modeling

A relational database separates concepts into related tables. In ShopFlow, likely concepts include:
- Business
- User
- Product
- Category
- Supplier
- Customer
- Sale and sale items
- Purchase order
- Purchase invoice and invoice items
- Inventory movement
- Credit transaction
- Audit log

This list reflects concepts reported or discussed, not a complete current schema inventory. Inspect `prisma/schema.prisma` to establish the actual models and relations.

## 24.2 Why relationships matter

A sale item should connect to the sale it belongs to. A purchase invoice item should connect to its invoice and product. A supplier should be associated with the correct business.

Database constraints can prevent some invalid states, but application logic is still needed for rules that span multiple records.

## 24.3 Historical values

A product's current selling price can change. A past sale generally needs to preserve the price used for that sale, otherwise historical reports may change unexpectedly.

Similarly, a purchase invoice should preserve the cost and quantity recorded on the invoice even if the product's current average cost changes later.

This is a design principle to verify against the current schema and service logic.

## 24.4 Migrations

A schema change may require a Prisma migration. Before running one:
- Inspect the current schema.
- Understand whether data needs backfilling.
- Review generated SQL when appropriate.
- Back up valuable data.
- Never casually reset a database containing records you need.
- Verify the migration against a development database first.

No migration was reported as necessary for the purchase-invoice service change described earlier.

---

# 25. Transactions, stock, and financial correctness

## 25.1 What is a transaction?

A database transaction groups operations so that they succeed or fail together. For example, confirming a purchase invoice may need to:
- Update stock
- Update purchase cost
- Create inventory movements
- Change invoice state
- Write an audit record

If one step fails, the transaction should avoid leaving the system half-updated.

## 25.2 Idempotency and repeated requests

A user may click twice, retry after a network timeout, or send the same request twice. A confirmation operation must not add the same stock twice.

A state transition such as `DRAFT → CONFIRMED`, combined with appropriate database checks and transaction behavior, can help. The exact implementation must be reviewed and tested.

## 25.3 Concurrency

Two requests can act on the same records at nearly the same time. A correct single-request calculation may still fail under concurrency if records are not locked or updated atomically.

Examples:
- Two purchases update the same product stock.
- Two users record payments against the same customer balance.
- Two sale requests try to sell the last unit.
- Two requests confirm the same invoice.

Concurrency risks should be tested deliberately rather than inferred from a successful happy-path test.

## 25.4 Financial precision

JavaScript `Number` uses binary floating-point representation. It can produce small precision differences for decimal values. For financial amounts, use a consistent decimal strategy, database decimal types, and appropriate rounding rules.

Do not perform a broad numeric refactor without inspecting the Prisma schema, current calculation patterns, and all dependent reports.

## 25.5 Inventory invariants

Define and test rules such as:
- Stock changes are recorded with a reason and source.
- Confirming the same invoice twice does not double stock.
- A sale cannot create invalid negative stock unless the product explicitly allows it.
- Returns and adjustments have traceable records.
- Stock movements and current stock remain consistent.
- A product belongs to the same business as the transaction.

The exact rules depend on product decisions and should be documented.

---

# 26. Purchase invoice confirmation: recorded change

**Evidence status:** The previous conversation described an implementation and targeted test. This is not a fresh inspection of the local folder.

## 26.1 Problem

When an invoice contains multiple lines for the same product at different prices, updating the product's purchase price once per line may leave it set to the last processed line's price. That does not represent the combined cost of the newly received stock.

## 26.2 File discussed

`server/services/purchase-invoice.service.ts`

## 26.3 Behavior described for the revised service

- Lock the invoice row with SQL `FOR UPDATE`.
- Load the draft invoice and items.
- Reject an empty invoice.
- Validate quantities and prices.
- Group invoice lines by product using a `Map`.
- Sum quantities and total cost for each product.
- Read existing stock and purchase price.
- Calculate a weighted-average cost.
- Update stock and purchase price once per product.
- Create an inventory movement for each original invoice line.
- Mark the invoice confirmed.
- Write an audit log inside the transaction.

## 26.4 Why grouping helps

Grouping separates two ideas:
- The invoice may have multiple lines that describe purchases of the same product.
- The product's current stock and average cost should be updated using the total received quantity and cost.

Keeping inventory movements per original invoice line can preserve invoice-level detail while grouping the stock/cost calculation.

## 26.5 Known limitations to re-check

- The described code uses JavaScript `Number` for calculations.
- The invoice row was described as locked, but product-row locking was not established.
- Full validation of tax, discounts, units, and currency treatment was not established by the recorded test.
- The exact behavior for zero stock, returns, corrections, cancellation, and duplicate confirmation needs review.
- Confirm the current code before assuming this implementation is still present.

---

# 27. Weighted-average purchase cost: worked example

## 27.1 Formula

For a product with existing stock and incoming stock:

`new average cost = (old stock × old cost + incoming total cost) ÷ (old stock + incoming quantity)`

This formula assumes that:
- The costs are comparable.
- The quantities use the same unit.
- The chosen cost basis is consistent.
- The incoming total cost has been calculated correctly.
- The denominator is greater than zero.

## 27.2 First invoice

Invoice lines:
- 2 units × ₹10 = ₹20
- 3 units × ₹5 = ₹15

Incoming quantity = 5 units  
Incoming total cost = ₹35

If starting stock is zero, the weighted-average cost for the received stock is ₹35 ÷ 5 = ₹7 per unit.

## 27.3 Second invoice in the recorded scenario

The second invoice contains the same lines:
- 2 units × ₹10 = ₹20
- 3 units × ₹5 = ₹15
- Incoming total cost = ₹35

Before the second invoice, the recorded scenario had:
- Existing stock = 5 units
- Existing cost = ₹5 per unit

Then:

`(5 × ₹5 + ₹35) ÷ (5 + 5)`

`(₹25 + ₹35) ÷ 10 = ₹6 per unit`

After receipt:
- Total stock = 10 units
- Weighted-average cost = ₹6 per unit

This calculation matches the test result recorded in the conversation. The first-invoice state above should not be inferred from the second invoice's starting cost; the earlier test history reported the prior state as stock 5 at ₹5 for the second invoice calculation.

## 27.4 Important distinction

A weighted-average purchase cost is not necessarily:
- The latest supplier price
- The selling price
- The gross margin
- A tax-inclusive cost
- The exact cost used by every accounting method

The product must define its cost policy and use it consistently.

---

# 28. Test scenario and recorded results

## 28.1 Synthetic records reported

- Supplier: `ShopFlow Test Supplier`
- Product SKU: `TEST-PROD-001`
- Invoice: `TEST-INV-001`
- Invoice: `TEST-INV-002`

These are test identifiers from the prior conversation. Check the current development database before assuming they still exist.

## 28.2 Scenario

Each invoice was described as containing:
- 2 units at ₹10
- 3 units at ₹5
- Total incoming quantity: 5
- Total incoming cost: ₹35

## 28.3 Recorded result

After confirming the second invoice:
- Stock was reported as 10 units.
- Purchase price was reported as ₹6.
- The calculation was `(5 × ₹5 + ₹35) ÷ 10 = ₹6`.
- Invoice-line price history and inventory movements were reported as retained.

## 28.4 What this test does and does not prove

It supports the weighted-average calculation for this specific scenario, as recorded.

It does not prove:
- Every invoice state is correct.
- Concurrent confirmations are safe.
- Floating-point edge cases are safe.
- All invalid inputs are rejected.
- Cross-business access is prevented.
- UI workflows are fully correct.
- Production deployment is ready.

## 28.5 Retest checklist

- [ ] Inspect current `confirmPurchaseInvoice`.
- [ ] Confirm test database and seed data.
- [ ] Verify starting stock and cost.
- [ ] Confirm invoice once.
- [ ] Verify stock, average cost, movements, and invoice state.
- [ ] Attempt to confirm it again and verify no duplicate stock.
- [ ] Test invalid product/business association.
- [ ] Test invalid quantity/price.
- [ ] Test empty invoice.
- [ ] Test simultaneous confirmations if a safe concurrency test can be run.
- [ ] Record exact command and output.

---

# 29. Known risks and questions to investigate

These are audit leads, not all confirmed bugs.

## 29.1 Decimal arithmetic

**Question:** Are money and quantity calculations consistent with the Prisma/database decimal types?

**Why it matters:** Rounding differences can accumulate and cause mismatched totals.

**Next evidence:** Inspect schema types, calculation utilities, invoice totals, sale totals, tax calculations, and reports.

## 29.2 Concurrent purchase confirmations

**Question:** Can two invoices update the same product simultaneously without losing stock or producing an inconsistent average cost?

**Why it matters:** A transaction that reads old stock and then writes a new value can be vulnerable if concurrent operations are not coordinated.

**Next evidence:** Inspect the transaction, SQL locks, product update pattern, and concurrency behavior.

## 29.3 Sale price override

**Question:** Is the client allowed to submit a custom unit price? If yes, which roles can do it, and should the override be audited?

**Why it matters:** A client-side price field must not become an unrestricted way to alter sales totals.

**Next evidence:** Inspect sale schema, route validation, service calculations, role checks, and UI.

## 29.4 Credit payment concurrency

**Question:** Can two simultaneous payments or credit transactions cause a balance to be calculated incorrectly?

**Next evidence:** Inspect transaction design and whether balances are computed from immutable transactions or updated as a mutable total.

## 29.5 Malformed JSON

**Question:** Do supplier and purchase-invoice routes return a 500 for malformed JSON?

**Next evidence:** Inspect current route handlers and test invalid request bodies.

## 29.6 Settings route

**Question:** Does the Settings navigation link lead to a valid page?

**Next evidence:** Inspect the navigation component, `app` routes, route groups, and runtime behavior.

## 29.7 Categories navigation

**Question:** Should users be able to reach the category page through the main navigation?

**Next evidence:** Compare the requirements and screenshots with the actual page and navigation.

## 29.8 Role management

**Question:** Are role values used for authorization, and can an owner manage team access?

**Next evidence:** Trace all sensitive routes and inspect role-management pages/APIs.

## 29.9 Audit logs

**Question:** Which operations write audit records, and can users modify or access logs improperly?

**Next evidence:** Trace sensitive services and inspect audit-log authorization.

## 29.10 Rate limiting

**Question:** Is rate limiting required for authentication, expensive operations, and AI endpoints, and is any protection already present?

**Next evidence:** Inspect middleware, route handlers, infrastructure configuration, and dependencies. Absence in a few reviewed files is not proof of absence across the system.

## 29.11 Tests

**Question:** What scripts and test tools currently exist?

**Next evidence:** Inspect `package.json`, test files, CI configuration, and any manual test documentation.

---

# 30. File map from prior inspection

These paths were discussed in the earlier audit. Re-check that they still exist and have the same behavior.

| File | Responsibility described earlier | Review focus |
|---|---|---|
| `app/suppliers/page.tsx` | Supplier list/create UI | Loading, errors, duplicate submits, search/edit/delete expectations |
| `app/api/suppliers/route.ts` | Supplier list/create API | Authentication, business scope, schema validation, malformed JSON |
| `server/services/supplier.service.ts` | Supplier business logic | Business isolation, transactions, audit logging |
| `app/suppliers/[supplierId]/page.tsx` | Supplier detail and purchase history | Not-found handling, data scoping, performance, correct invoice filtering |
| `app/api/suppliers/[supplierId]/purchase-invoices/route.ts` | Supplier purchase-invoice route | Authorization and business scoping |
| `app/api/purchase-invoices/route.ts` | Purchase invoice list/create API | Validation, state rules, malformed JSON |
| `server/services/purchase-invoice.service.ts` | Purchase invoice business logic | Transactions, stock, weighted average, duplicate confirmation, audit logs |

## 30.1 Earlier observations to re-check

- Supplier list/create was described as business-scoped using the authenticated user's `businessId`.
- The supplier creation route was described as not trusting a client-supplied business ID.
- Supplier creation was described as transactional with an audit log.
- Supplier detail fetched suppliers and purchase invoices and filtered invoices client-side.
- A few `setTimeout(..., 0)` calls in effects were noted as potentially unnecessary, not confirmed defects.
- Malformed JSON handling in supplier and purchase-invoice routes was noted as a possible 500 response.

Do not edit these files merely because they appear in this list. First verify current behavior and requirements.

---

# 31. Testing and verification handbook

## 31.1 Find the commands that really exist

The prior record says `npm run typecheck` failed because no `typecheck` script was defined. Before running commands in future:
1. Open `package.json`.
2. Read the `scripts` section.
3. Use the commands actually present.
4. Record the exact command and result.

Do not invent script names.

## 31.2 Build result recorded earlier

A previous `npm run build` was reported successful on Next.js 16.3.7. The TypeScript stage passed and 35 static pages were generated.

This is a historical result, not a fresh build at the current checkpoint.

## 31.3 Test levels

### Static inspection
Read code and trace behavior. Useful, but cannot prove runtime behavior for every path.

### Type checking / build
Catches many syntax, type, import, and framework errors. Does not prove all business rules.

### Unit tests
Test small calculations and pure functions, such as weighted-average cost and validation.

### Integration tests
Test interactions between API routes, services, and the database.

### End-to-end tests
Exercise a real user workflow through the UI.

### Manual exploratory tests
Useful for responsive layouts, confusing flows, and unusual inputs, but should be recorded so they can be repeated.

## 31.4 A test record template

For each test, record:

- **Test ID:**
- **Date:**
- **Feature:**
- **Preconditions:**
- **Input:**
- **Steps:**
- **Expected result:**
- **Actual result:**
- **Pass/fail:**
- **Evidence/log:**
- **Environment:**
- **Follow-up:**

## 31.5 Test data discipline

Use synthetic names, emails, products, invoices, and customers. Keep test records clearly identifiable. Do not accidentally use production data for destructive tests.

## 31.6 Resetting test data

Before deleting or resetting records:
- Confirm the database connection string points to the development database.
- Confirm the data is disposable.
- Prefer a transaction, test fixture, or targeted cleanup where possible.
- Never run a broad reset command without understanding its effect.

---

# 32. Manual end-to-end test plans

These are proposed plans. They have not all been executed.

## 32.1 Authentication

- [ ] Register a new test user.
- [ ] Verify required fields.
- [ ] Verify duplicate account handling.
- [ ] Log in with correct credentials.
- [ ] Verify incorrect credentials do not disclose unnecessary details.
- [ ] Log out.
- [ ] Try accessing a protected page while logged out.
- [ ] Verify session behavior after refresh.
- [ ] Verify session expiry and invalid-session handling where applicable.

## 32.2 Business isolation

- [ ] Create test Business A and Business B.
- [ ] Create a product and supplier in Business A.
- [ ] Sign in as Business B.
- [ ] Try to read Business A records through UI and direct API requests.
- [ ] Try to update or delete a record by substituting its ID.
- [ ] Confirm no data is leaked or changed.
- [ ] Repeat for sales, purchases, customers, credit, and reports.

## 32.3 Products and inventory

- [ ] Create a product with valid values.
- [ ] Try invalid/empty values.
- [ ] Try duplicate SKU according to the intended uniqueness rule.
- [ ] Verify category/business association.
- [ ] Adjust stock with a reason.
- [ ] Verify current stock and movement history.
- [ ] Test low-stock threshold behavior.
- [ ] Test zero stock and negative stock rules.

## 32.4 Sales

- [ ] Create a sale with one item.
- [ ] Create a sale with multiple items.
- [ ] Verify totals and any taxes/discounts.
- [ ] Verify stock deduction.
- [ ] Verify the recorded unit price remains historically correct.
- [ ] Test partial payment or credit if supported.
- [ ] Test invalid product IDs and cross-business IDs.
- [ ] Test repeated submission.
- [ ] Verify sale history and dashboard totals.
- [ ] Test cancellation/return only if the current requirements support it.

## 32.5 Suppliers and purchases

- [ ] Create a supplier.
- [ ] Verify supplier list and detail.
- [ ] Create a purchase order if supported.
- [ ] Create a purchase invoice.
- [ ] Verify draft state.
- [ ] Confirm the invoice.
- [ ] Verify stock and purchase cost.
- [ ] Verify movement history and audit record.
- [ ] Attempt duplicate confirmation.
- [ ] Test invalid product and supplier associations.
- [ ] Verify purchase history.
- [ ] Test malformed request bodies.

## 32.6 Customer credit

- [ ] Create a customer.
- [ ] Record a credit sale if supported.
- [ ] Verify outstanding balance.
- [ ] Record a partial payment.
- [ ] Verify the remaining balance.
- [ ] Record full settlement.
- [ ] Verify the transaction history.
- [ ] Test invalid payment amounts.
- [ ] Test duplicate payment submission.
- [ ] Investigate concurrent payments.
- [ ] Verify one business cannot access another business's customer data.

## 32.7 Dashboard and reports

- [ ] Record the starting state.
- [ ] Create a controlled sale.
- [ ] Create a controlled purchase.
- [ ] Record a credit transaction.
- [ ] Compare dashboard numbers to source records.
- [ ] Check date boundaries and time zones.
- [ ] Verify empty-state behavior.
- [ ] Confirm reports do not mix businesses.
- [ ] Verify the definition of sales, profit, stock value, and outstanding credit.

## 32.8 Intelligence page

- [ ] Identify which elements are functional versus placeholders.
- [ ] Record exact text and expected behavior.
- [ ] Check whether queries use real data or sample content.
- [ ] Confirm permission and business scoping if any data access exists.
- [ ] Do not claim AI features are complete until a full workflow has been tested.

---

# 33. Security review checklist

This is a review checklist, not a statement that every item is currently broken or missing.

## 33.1 Identity and access
- [ ] Protected pages require authentication.
- [ ] Protected APIs require authentication.
- [ ] Server-side role checks exist where needed.
- [ ] Business IDs are derived or validated securely.
- [ ] Direct object ID substitution cannot cross business boundaries.
- [ ] Sensitive actions are restricted appropriately.

## 33.2 Input and validation
- [ ] Server validates every request.
- [ ] IDs are checked for ownership/business association.
- [ ] Numeric values have appropriate ranges.
- [ ] Money uses a consistent precision strategy.
- [ ] Unexpected fields cannot override protected values.
- [ ] Malformed JSON returns a consistent client error.
- [ ] Error messages do not expose stack traces or secrets.

## 33.3 Data integrity
- [ ] Important multi-step changes use transactions.
- [ ] Duplicate requests do not double-apply effects.
- [ ] Concurrent updates are handled.
- [ ] Historical sale and purchase values remain stable.
- [ ] Inventory movements reconcile with stock.
- [ ] Credit transactions reconcile with balances.
- [ ] Audit logs capture important changes.

## 33.4 Operational security
- [ ] Secrets are not committed to source control.
- [ ] Environment files are excluded appropriately.
- [ ] Dependencies are reviewed and updated deliberately.
- [ ] Rate limiting is evaluated for sensitive/expensive routes.
- [ ] Backups and recovery are designed before production use.
- [ ] Logs do not contain passwords or unnecessary personal/financial data.
- [ ] Upload handling validates file type, size, and access.
- [ ] AI/document-processing features are isolated and permission-checked.

## 33.5 Security finding format

For each concern, document:
- Severity and rationale
- Evidence
- Whether it is confirmed or only a risk
- Reproduction steps
- Impact
- Smallest suitable fix
- Verification plan

Do not label something a confirmed vulnerability without evidence.

---

# 34. Error handling and observability

## 34.1 Errors should help users recover

A useful error tells the user what failed and, where possible, what they can do next. It should not expose internal stack traces.

## 34.2 Logs should help developers diagnose failures

Useful diagnostic information may include:
- Request or correlation ID
- Route/operation
- Error category
- Safe technical context
- Timestamp

Avoid logging credentials, tokens, and unnecessary private customer data.

## 34.3 Audit logs versus application logs

These serve different purposes:
- **Application logs** help developers understand system behavior and failures.
- **Audit logs** record meaningful business actions, such as confirming a purchase invoice or changing a sensitive record.

A log entry is not automatically a full audit trail. The design should specify who did what, to which record, when, and what changed, subject to privacy and storage decisions.

## 34.4 Recovery

For a failed purchase confirmation, the expected outcome should be clear:
- Was stock changed?
- Was the invoice left in draft?
- Were movements written?
- Was the audit event written?
- Can the user safely retry?

The transaction and state model should make these outcomes predictable.

---

# 35. Documentation and Git workflow

## 35.1 Git commits

A useful commit should represent one logical change. Before committing:
- Review `git status`.
- Inspect the diff.
- Check that secrets and local data are not included.
- Run relevant tests.
- Use a clear message describing the change.

Do not overwrite unrelated work or reset the repository without checking what would be lost.

## 35.2 Suggested commit message examples

- `fix: calculate weighted-average purchase cost`
- `test: cover duplicate purchase invoice confirmation`
- `docs: record supplier workflow audit`
- `fix: return validation error for malformed invoice JSON`

These are examples only; do not claim any such commits exist unless they were actually made.

## 35.3 Change record template

### Date — Short title
- **Reason:**
- **Evidence:**
- **Files changed:**
- **Behavior before:**
- **Behavior after:**
- **Tests run:**
- **Results:**
- **Risks/trade-offs:**
- **Rollback note:**
- **Next step:**

## 35.4 Preserve context

At the end of each session, record the exact next task and what must not happen yet. For ShopFlow, the current rule is to complete and report the audit before code changes.

---

# 36. Beginner glossary

**API:** A defined way for one part of the system to request data or an operation from another part.

**Authentication:** Checking who the user is.

**Authorization:** Checking what the user is allowed to do.

**Audit log:** A record of meaningful actions in the application.

**Business isolation:** Ensuring one business cannot read or change another business's data.

**Client:** The browser/UI or other caller making a request.

**Concurrency:** Multiple operations happening at the same time.

**Database transaction:** A group of database operations that should succeed or fail together.

**Endpoint/route:** A URL and handler that responds to a request.

**Idempotency:** Repeating an operation should not unintentionally apply its effect more than once.

**Inventory movement:** A record of a stock increase, decrease, or adjustment.

**MVP:** The smallest coherent product that delivers a valuable workflow to a chosen user.

**ORM:** A library that maps application-level objects and operations to database records; Prisma is used in this project stack.

**POS:** Point of sale; the workflow/interface used to complete sales.

**Prisma schema:** The model definition used by Prisma to describe database entities and relationships.

**RBAC:** Role-based access control; permissions depend partly on the user's role.

**SKU:** A stock-keeping unit, usually an identifier used to distinguish a product or variant.

**Service layer:** Code that implements business operations independently from the UI.

**Weighted average cost:** A cost calculated by combining existing stock value and incoming stock value, divided by total quantity.

**Validation:** Checking whether input is acceptable before acting on it.

**Regression:** A previously working behavior that breaks after a change. Use this term only when there is evidence of the prior working state and the new failure.

---

# 37. Learning exercises using ShopFlow

These exercises are for understanding the project. They are not instructions to modify production data.

## Exercise 1 — Trace a supplier request

1. Find the supplier page.
2. Identify the URL it calls.
3. Find the matching API route.
4. Identify where authentication is checked.
5. Find the service method.
6. Find the database query.
7. Explain how the current user's business is applied.

**Goal:** Understand the path from a button to the database.

## Exercise 2 — Trace a purchase invoice

Draw the flow:

`UI → API → validation → service → transaction → stock update → movement → invoice state → response`

For each step, write the file and function responsible.

**Goal:** Understand where business rules should live.

## Exercise 3 — Explain the weighted-average calculation

Use:
- Existing stock: 8 units
- Existing cost: ₹12 per unit
- Incoming stock: 4 units
- Incoming total cost: ₹56

Calculate the new average cost:

`(8 × ₹12 + ₹56) ÷ (8 + 4) = ₹152 ÷ 12 ≈ ₹12.6667`

Then decide and document how the application should round/display/store that result. Do not change code until the current decimal policy is known.

## Exercise 4 — Find a business-isolation test

Create two synthetic businesses and explain how you would test whether a user in Business B can access a supplier from Business A.

**Goal:** Understand why hiding a button is not sufficient authorization.

## Exercise 5 — Separate a bug from a risk

Example: “The code uses `Number` for money.”

This is a risk worth investigating, but it does not by itself prove a user-visible error occurred. To confirm a defect, identify a concrete input and observed incorrect result.

**Goal:** Use evidence-based engineering language.

## Exercise 6 — Define a business insight

Choose one question such as “Which supplier increased prices?” Define:
- Exact period
- Product matching rules
- Tax/discount treatment
- Required data
- Calculation
- Supporting evidence
- Missing-data behavior
- What the system must not claim

**Goal:** Turn an AI idea into a testable product requirement.

---

# 38. Decision log

| Decision / principle | Reason | Status |
|---|---|---|
| Continue without Codex | User chose direct work with ChatGPT | Current working method |
| Audit before more code changes | Avoid unverified fixes and preserve current functionality | Active rule |
| Report findings before implementing fixes | User should choose/approve the first batch | Active rule |
| Keep the project journal in Markdown | Portable, readable, easy to keep in the project root | Active rule |
| Separate source facts from proposals | Avoid confusing the product vision with implemented features | Active rule |
| Do not treat “AI” alone as differentiation | Source document notes mature competitors already have AI/analytics | Product principle |
| Validate the target shop and workflow | Avoid building a large app without proving the need | Product principle |
| Require human approval for consequential AI actions | Source document emphasizes safe financial/business decisions | Product principle |
| Treat weighted-average purchase-cost work as requiring a fresh check | Earlier result is recorded, but current files have not been reverified | Pending re-verification |

---

# 39. Project timeline and change log

## 39.1 Earlier product-discovery direction

The original requirements document discussed:
- Defining the exact problem and target shop before coding.
- Studying competitor products.
- Investigating Indian shop workflows.
- Finding a specific underserved workflow.
- Validating the product before committing to a broad feature list.

## 39.2 Earlier implementation inspection

The project ZIP was previously inspected for selected supplier and purchase-invoice workflows. That inspection reported pages, API routes, services, and models described in the earlier sections.

## 39.3 Purchase-invoice service change

The previous conversation recorded a revision to `server/services/purchase-invoice.service.ts` to group repeated product lines and calculate weighted-average cost. A targeted scenario was reported to pass. The current local file and database still need re-verification.

## 39.4 Build result

The prior record says `npm run build` succeeded on Next.js 16.3.7, with the TypeScript stage passing and 35 static pages generated. This result is historical.

## 39.5 Typecheck script note

The prior record says `npm run typecheck` could not run because the script did not exist. This does not mean the TypeScript stage failed.

## 39.6 15 October 2026 — Expanded journal

This edition expands the earlier checkpoint with product strategy, architecture explanations, audit procedures, test plans, security review questions, and learning exercises.

**Important:** The journal expansion does not itself modify ShopFlow application code and does not complete the code audit.

---

# 40. Current checkpoint and next actions

## 40.1 Current phase

**Read-only audit of current code against the original requirements and reference screenshots.**

## 40.2 Next actions in order

1. Confirm the current project files are available for review.
2. Inspect `ShopFlow Details.docx` and any reference screenshots.
3. Inspect the current repository structure and `package.json`.
4. Review the Prisma schema and migrations.
5. Build a requirement-to-feature matrix with exact code evidence.
6. Trace the primary workflows: authentication, products/stock, sales, suppliers/purchases, customer credit, dashboard/reports.
7. Review business scoping and role enforcement.
8. Re-check the recorded purchase-invoice change.
9. Separate confirmed defects, potential risks, missing requirements, and product decisions.
10. Present the findings and recommend a small first fix batch.
11. Wait for user approval before editing application code.
12. After approved fixes, run relevant tests and update this book.

## 40.3 Do not do yet

- Do not rebuild the app from scratch.
- Do not silently remove or replace existing features.
- Do not add AI features just because they are in the long-term vision.
- Do not call preliminary audit leads confirmed bugs without evidence.
- Do not assume an earlier build or test result still represents the current code.
- Do not change application code before the audit findings are reported and the user approves a batch.

---

# 41. Appendices: checklists and templates

## Appendix A — Audit finding template

### Finding ID: SF-AUDIT-###
- **Title:**
- **Category:** confirmed defect / potential risk / missing requirement / product decision / usability observation
- **Requirement:**
- **Evidence (file, function, route, screenshot):**
- **Observed behavior:**
- **Expected behavior:**
- **Reproduction steps:**
- **Impact:**
- **Confidence:**
- **Suggested minimal fix:**
- **Regression tests:**
- **User decision needed:**
- **Status:**

## Appendix B — Feature verification template

### Feature:
- **Requirement source:**
- **UI page:**
- **API route:**
- **Service:**
- **Database models:**
- **Authorization rule:**
- **Validation rule:**
- **Happy-path test:**
- **Failure-path test:**
- **Concurrency/duplicate test:**
- **Evidence:**
- **Status:**
- **Open questions:**

## Appendix C — Session checkpoint template

### Date:
**Goal:**

**Files/sources inspected:**

**Findings:**
1.
2.
3.

**Changes made:**
- None / list exact files

**Commands run and results:**

**Tests passed:**

**Tests not run:**

**Open risks/questions:**

**What must not happen next:**

**Next action:**

## Appendix D — Business insight specification

- **User question:**
- **Target user/shop type:**
- **Business decision supported:**
- **Time period:**
- **Required data:**
- **Calculation:**
- **Assumptions:**
- **Missing-data behavior:**
- **Supporting records shown:**
- **Permission requirements:**
- **Action proposed, if any:**
- **Human approval required:**
- **Success measure:**
- **Failure modes to test:**

## Appendix E — Pre-release checklist

- [ ] Main workflows tested end to end
- [ ] Business isolation tested
- [ ] Role-based authorization reviewed
- [ ] Money and quantity calculations reviewed
- [ ] Transactions and concurrency reviewed
- [ ] Duplicate submissions tested
- [ ] Error responses reviewed
- [ ] Audit-log coverage reviewed
- [ ] Backups and recovery plan documented
- [ ] Secrets and environment configuration checked
- [ ] Upload and file-access rules reviewed, if uploads exist
- [ ] Monitoring/logging plan documented
- [ ] Deployment process tested
- [ ] User-facing documentation updated
- [ ] Known limitations documented
- [ ] No claim of completeness without evidence

---

## Final note

This is an expanded working guide, not a claim that every planned feature exists or that ShopFlow is production-ready. Its purpose is to preserve the product reasoning, help the developer learn, and make each future code change traceable to evidence and a clear business goal.

---

# 42. Work Session Checkpoint — 16 October 2026

### 42.1 Date & Goal
- **Date:** 16 October 2026
- **Goal:** Audit current codebase against reference screenshots in `c:\Users\krish\Pictures`, resolve reported UI/validation defects, establish a unified Aura-inspired sidebar shell, implement missing `/settings` route, upgrade Products/Inventory and Intelligence, and add printable receipt capabilities.

### 42.2 Source Materials & Files Inspected
- `c:\Users\krish\Pictures`:
  - `Screenshot 2026-10-15 204027.png` (Aura-inspired vertical icon sidebar and dashboard layout)
  - `Screenshot 2026-10-15 204042.png` (Modern Inventory table design with valuation, stock badges, tabs)
  - `Screenshot 2026-10-13 213524.png` (Product creation 400 Bad Request error `TEST-PROD-001`)
  - `Screenshot 2026-10-13 211042.png` & `211313.png` (White-on-white text contrast bugs on Purchases and Suppliers headers)
- `c:\Users\krish\Documents\shopflow`:
  - `prisma/schema.prisma`
  - `app/api/products/route.ts` & `server/validation/product.validation.ts`
  - `app/api/auth/`
  - `components/app-shell.tsx`, `components/sidebar.tsx`, `components/dashboard-sidebar.tsx`
  - `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
  - `app/inventory/page.tsx`, `app/sales/[saleId]/page.tsx`, `app/suppliers/page.tsx`, `app/purchases/page.tsx`, `app/customers/page.tsx`, `app/categories/page.tsx`, `app/intelligence/page.tsx`

### 42.3 Findings & Evidence
1. **Product creation 400 Bad Request defect (SF-AUDIT-001):**
   - *Evidence:* `server/validation/product.validation.ts` had required `businessId: z.string().uuid()` in `createProductSchema` while `app/api/products/route.ts` expected `body` to validate without it, injecting `businessId` from the authenticated session.
   - *Status:* Verified fixed. `createProductSchema` validates client fields; `businessId` attached server-side from session.
2. **Text contrast & white-on-white bleaching bug (SF-AUDIT-002):**
   - *Evidence:* `app/suppliers/page.tsx`, `app/purchases/page.tsx`, `app/customers/page.tsx`, `app/sales/[saleId]/page.tsx`, `app/categories/page.tsx` contained hardcoded `text-white` headings on a light body background (`#e9ece5`).
   - *Status:* Verified fixed across all pages using `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, and `shopflow-glass`.
3. **Missing `/settings` page (SF-AUDIT-003):**
   - *Evidence:* Navigation linked to `/settings`, but directory did not exist.
   - *Status:* Implemented at `app/settings/page.tsx` with business profile, user role badge, system health, and sign-out controls.
4. **AppShell & Navigation unification (SF-AUDIT-004):**
   - *Evidence:* Previously, `/dashboard` had a different navigation bar than the rest of the app, and the sidebar from reference screenshots was not unified.
   - *Status:* Created `components/sidebar.tsx` with responsive drawer and unified `components/app-shell.tsx`.
5. **Printable Bill / Retail Invoice (SF-AUDIT-005):**
   - *Evidence:* `app/sales/[saleId]/page.tsx` lacked printing and invoice formatting for retail counters.
   - *Status:* Implemented print-ready Tax Invoice / Retail Bill layout with `window.print()` trigger and formatted line items.
6. **Intelligence Page Activation (SF-AUDIT-006):**
   - *Evidence:* `app/intelligence/page.tsx` was a static placeholder with non-functional search.
   - *Status:* Created `app/api/intelligence/route.ts` and interactive NLP query search bar with real database metrics (valuation, low stock, customer credit).

### 42.4 Commands Executed & Exact Results
- `npm run build`: Exited 0. Turbopack generated 38 static/dynamic routes in 1.2s with 0 TypeScript errors.
- `npm run lint`: Exited 0 with 0 errors and 0 warnings.
- `node scripts/inspect-all-stock.mjs`: Exited 0. All 7 product stock counts completely reconciled with inventory movements.

### 42.5 Next Checkpoint
- Perform interactive browser verification with the Next.js dev server.
- Proceed to Phase 6 long-term differentiator: AI supplier invoice extraction pipeline (OCR/PDF ingestion).

