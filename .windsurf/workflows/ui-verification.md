---
description: UI verification checklist
auto_execution_mode: 3
---

1. **Run automated checks**
   - From `apps/web/`, execute `npm run lint` (and `npm run test` if available).
   - If lint/test fails, capture the output, address issues if they stem from the change, or report the blocking diagnostics. Do not skip the remaining steps until the failure is acknowledged.
2. **Ensure dev server availability**
   - Check whether a dev server is already listening on port 3000 using `lsof -nP -iTCP:3000`.
   - If no server is running, start one with `npm run dev` from `apps/web/` (non-blocking). Wait for the server to compile successfully before proceeding.
   - If the server fails to start, capture the error output, attempt quick fixes if possible, otherwise report and stop.
3. **Open page in Chrome DevTools MCP**
   - Use `mcp0_list_pages` to select or `mcp0_new_page` to open `http://localhost:3000/`.
   - Confirm the page renders without 500 errors before taking snapshots.
4. **Capture desktop snapshot (1280×900)**
   - Call `mcp0_resize_page` with width `1280`, height `900`.
   - Call `mcp0_take_snapshot` to record the desktop view and review the rendered result.
5. **Capture tablet snapshot (834×1112)**
   - Call `mcp0_resize_page` with width `834`, height `1112`.
   - Call `mcp0_take_snapshot` to record the tablet view and review the rendered result.
6. **Capture mobile snapshot (390×844)**
   - Call `mcp0_resize_page` with width `390`, height `844`.
   - Call `mcp0_take_snapshot` to record the mobile view and review the rendered result.
7. **Iterative verification loop**
   - Inspect each snapshot and console output. If visuals/regressions do not meet expectations, return to code edits, then repeat steps 1–6 until resolved.
8. **Summarize findings**
   - Document lint/test status, server status, and snapshot observations.
   - Link to snapshots and describe any follow-up work or remaining issues before reporting completion.