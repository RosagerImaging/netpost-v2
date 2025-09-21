#Deployment Errors Prompt
 
##Your Task

i want you to act as the orchestrator agent and use sub-agents with the goal of cleaning up our code and getting it to the point that we can successfully deploy to vercel. 
  
###Execution / Workflow:
start by invoking the @error-detective agent first and give them the prompt i will provide you with at the end of this document, and the @test-automator afterward as you see fit. otherwise use any agents or custom slash commands you wish, and make sure everyone has access to all MCP servers and all of their respective tools. I am going to provide you with the exact prompt that i want you to give the @error-detective sub-agent to have them look over the code searching specifically for errors keeping us from deploying. i will also provide you with some context which you can pass along to the @error-detective in the form of the latest build logs and hash summary so you can see the errors and warnings as a starting point. 

**PROACTIVELY** use the playwright mcp to start a test environment to view your changes in a browser and ensure everything is as you intend!

**IMPORTANT** always start every prompt that you give the sub-agents or that you use yourself with the "/go" custom slash command!

###Context:

**latest build logs:**

  00:28:49.758 Running build in Washington, D.C., USA (East) – iad1
00:28:49.758 Build machine configuration: 2 cores, 8 GB
00:28:49.831 Cloning github.com/RosagerImaging/netpost-v2 (Branch: main, Commit: 30e04fd)
00:28:50.245 Previous build caches not available
00:28:52.306 Warning: Failed to fetch one or more git submodules
00:28:52.307 Cloning completed: 2.475s
00:28:53.103 Running "vercel build"
00:28:53.502 Vercel CLI 48.0.2
00:28:53.675 > Detected Turbo. Adjusting default settings...
00:28:54.138 Running "install" command: `npm install --prefix=../..`...
00:29:00.477 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
00:29:02.054 npm warn deprecated lodash.get@4.4.2: This package is deprecated. Use the optional chaining (?.) operator instead.
00:29:02.769 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
00:29:02.956 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
00:29:03.849 npm warn deprecated domexception@4.0.0: Use your platform's native DOMException instead
00:29:04.749 npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
00:29:07.267 npm warn deprecated @testing-library/jest-native@5.4.3: DEPRECATED: This package is no longer maintained.
00:29:07.268 npm warn deprecated Please use the built-in Jest matchers available in @testing-library/react-native v12.4+.
00:29:07.269 npm warn deprecated
00:29:07.269 npm warn deprecated See migration guide: https://callstack.github.io/react-native-testing-library/docs/migration/jest-matchers
00:29:10.267 npm warn deprecated rimraf@2.6.3: Rimraf versions prior to v4 are no longer supported
00:29:11.458 npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
00:29:20.831 npm warn deprecated @opentelemetry/otlp-proto-exporter-base@0.41.2: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
00:29:56.383 
00:29:56.383 added 2400 packages, and audited 2406 packages in 1m
00:29:56.384 
00:29:56.384 290 packages are looking for funding
00:29:56.384   run `npm fund` for details
00:29:56.395 
00:29:56.395 5 low severity vulnerabilities
00:29:56.395 
00:29:56.395 Some issues need review, and may require choosing
00:29:56.397 a different dependency.
00:29:56.397 
00:29:56.397 Run `npm audit` for details.
00:29:56.673 
00:29:56.673 Attention:
00:29:56.673 Turborepo now collects completely anonymous telemetry regarding usage.
00:29:56.675 This information is used to shape the Turborepo roadmap and prioritize features.
00:29:56.675 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
00:29:56.675 https://turbo.build/repo/docs/telemetry
00:29:56.675 
00:29:56.732 • Packages in scope: web
00:29:56.732 • Running build in 1 packages
00:29:56.732 • Remote caching enabled
00:29:56.887 @netpost/shared-types:build: cache hit, replaying logs bc5fb07cb736a0e1
00:29:56.888 @netpost/config:build: cache hit, replaying logs ec90eef6ac790f15
00:29:56.888 @netpost/config:build: 
00:29:56.888 @netpost/config:build: > @netpost/config@0.1.0 build
00:29:56.888 @netpost/config:build: > tsup
00:29:56.888 @netpost/config:build: 
00:29:56.889 @netpost/config:build: [34mCLI[39m Building entry: src/index.ts
00:29:56.889 @netpost/config:build: [34mCLI[39m Using tsconfig: tsconfig.json
00:29:56.889 @netpost/config:build: [34mCLI[39m tsup v8.5.0
00:29:56.889 @netpost/config:build: [34mCLI[39m Using tsup config: /vercel/path0/packages/config/tsup.config.ts
00:29:56.889 @netpost/config:build: [34mCLI[39m Target: es2020
00:29:56.889 @netpost/config:build: [34mCLI[39m Cleaning output folder
00:29:56.889 @netpost/config:build: [34mCJS[39m Build start
00:29:56.889 @netpost/config:build: [34mESM[39m Build start
00:29:56.889 @netpost/config:build: [32mESM[39m [1mdist/index.js     [22m[32m4.84 KB[39m
00:29:56.889 @netpost/config:build: [32mESM[39m [1mdist/index.js.map [22m[32m8.14 KB[39m
00:29:56.889 @netpost/config:build: [32mESM[39m ⚡️ Build success in 31ms
00:29:56.889 @netpost/config:build: [32mCJS[39m [1mdist/index.cjs     [22m[32m6.05 KB[39m
00:29:56.889 @netpost/config:build: [32mCJS[39m [1mdist/index.cjs.map [22m[32m8.50 KB[39m
00:29:56.890 @netpost/config:build: [32mCJS[39m ⚡️ Build success in 31ms
00:29:56.890 @netpost/config:build: [34mDTS[39m Build start
00:29:56.890 @netpost/config:build: [32mDTS[39m ⚡️ Build success in 5907ms
00:29:56.890 @netpost/config:build: [32mDTS[39m [1mdist/index.d.cts [22m[32m2.86 KB[39m
00:29:56.890 @netpost/config:build: [32mDTS[39m [1mdist/index.d.ts  [22m[32m2.86 KB[39m
00:29:56.890 @netpost/shared-types:build: 
00:29:56.890 @netpost/shared-types:build: > @netpost/shared-types@0.1.0 build
00:29:56.890 @netpost/shared-types:build: > tsup
00:29:56.890 @netpost/shared-types:build: 
00:29:56.890 @netpost/shared-types:build: [34mCLI[39m Building entry: src/index.ts
00:29:56.890 @netpost/shared-types:build: [34mCLI[39m Using tsconfig: tsconfig.json
00:29:56.890 @netpost/shared-types:build: [34mCLI[39m tsup v8.5.0
00:29:56.890 @netpost/shared-types:build: [34mCLI[39m Using tsup config: /vercel/path0/packages/shared-types/tsup.config.ts
00:29:56.890 @netpost/shared-types:build: [34mCLI[39m Target: es2020
00:29:56.891 @netpost/shared-types:build: [34mCLI[39m Cleaning output folder
00:29:56.891 @netpost/shared-types:build: [34mCJS[39m Build start
00:29:56.891 @netpost/shared-types:build: [34mESM[39m Build start
00:29:56.891 @netpost/shared-types:build: [32mESM[39m [1mdist/index.js     [22m[32m4.74 KB[39m
00:29:56.891 @netpost/shared-types:build: [32mESM[39m [1mdist/index.js.map [22m[32m24.53 KB[39m
00:29:56.891 @netpost/shared-types:build: [32mESM[39m ⚡️ Build success in 28ms
00:29:56.891 @netpost/shared-types:build: [32mCJS[39m [1mdist/index.cjs     [22m[32m6.45 KB[39m
00:29:56.891 @netpost/shared-types:build: [32mCJS[39m [1mdist/index.cjs.map [22m[32m27.49 KB[39m
00:29:56.891 @netpost/shared-types:build: [32mCJS[39m ⚡️ Build success in 42ms
00:29:56.891 @netpost/shared-types:build: [34mDTS[39m Build start
00:29:56.891 @netpost/shared-types:build: [32mDTS[39m ⚡️ Build success in 2658ms
00:29:56.892 @netpost/shared-types:build: [32mDTS[39m [1mdist/index.d.cts [22m[32m49.64 KB[39m
00:29:56.892 @netpost/shared-types:build: [32mDTS[39m [1mdist/index.d.ts  [22m[32m49.64 KB[39m
00:29:56.897 @netpost/ui:build: cache hit, replaying logs 604d30114296f35a
00:29:56.899 @netpost/ui:build: 
00:29:56.899 @netpost/ui:build: > @netpost/ui@0.1.0 build
00:29:56.899 @netpost/ui:build: > tsup
00:29:56.899 @netpost/ui:build: 
00:29:56.899 @netpost/ui:build: [34mCLI[39m Building entry: src/index.ts
00:29:56.900 @netpost/ui:build: [34mCLI[39m Using tsconfig: tsconfig.json
00:29:56.900 @netpost/ui:build: [34mCLI[39m tsup v8.5.0
00:29:56.900 @netpost/ui:build: [34mCLI[39m Using tsup config: /vercel/path0/packages/ui/tsup.config.ts
00:29:56.900 @netpost/ui:build: [34mCLI[39m Target: es2020
00:29:56.900 @netpost/ui:build: [34mCLI[39m Cleaning output folder
00:29:56.900 @netpost/ui:build: [34mCJS[39m Build start
00:29:56.900 @netpost/ui:build: [34mESM[39m Build start
00:29:56.900 @netpost/ui:build: [32mCJS[39m [1mdist/index.cjs     [22m[32m29.17 KB[39m
00:29:56.900 @netpost/ui:build: [32mCJS[39m [1mdist/index.cjs.map [22m[32m41.83 KB[39m
00:29:56.900 @netpost/ui:build: [32mCJS[39m ⚡️ Build success in 65ms
00:29:56.900 @netpost/ui:build: [32mESM[39m [1mdist/index.js     [22m[32m24.33 KB[39m
00:29:56.900 @netpost/ui:build: [32mESM[39m [1mdist/index.js.map [22m[32m40.62 KB[39m
00:29:56.900 @netpost/ui:build: [32mESM[39m ⚡️ Build success in 68ms
00:29:56.901 @netpost/ui:build: [34mDTS[39m Build start
00:29:56.901 @netpost/ui:build: [32mDTS[39m ⚡️ Build success in 7224ms
00:29:56.901 @netpost/ui:build: [32mDTS[39m [1mdist/index.d.cts [22m[32m7.99 KB[39m
00:29:56.903 @netpost/ui:build: [32mDTS[39m [1mdist/index.d.ts  [22m[32m7.99 KB[39m
00:29:56.992 web:build: cache miss, executing a6eef260d9a4d7e5
00:29:57.130 web:build: 
00:29:57.130 web:build: > web@0.1.0 build
00:29:57.130 web:build: > next build
00:29:57.130 web:build: 
00:29:58.041 web:build: Attention: Next.js now collects completely anonymous telemetry regarding usage.
00:29:58.041 web:build: This information is used to shape Next.js' roadmap and prioritize features.
00:29:58.042 web:build: You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
00:29:58.042 web:build: https://nextjs.org/telemetry
00:29:58.042 web:build: 
00:29:58.106 web:build:    ▲ Next.js 15.5.3
00:29:58.106 web:build:    - Experiments (use with caution):
00:29:58.107 web:build:      · optimizePackageImports
00:29:58.107 web:build: 
00:29:58.201 web:build:    Creating an optimized production build ...
00:30:21.701 web:build:  ✓ Compiled successfully in 20.9s
00:30:21.706 web:build:    Linting and checking validity of types ...
00:30:34.027 web:build: 
00:30:34.027 web:build: ./lib/auth/auth-utils.ts
00:30:34.028 web:build: 16:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.028 web:build: 33:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.028 web:build: 68:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.028 web:build: 84:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.029 web:build: 100:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.029 web:build: 117:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.029 web:build: 134:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.029 web:build: 
00:30:34.029 web:build: ./lib/providers/query-provider.tsx
00:30:34.030 web:build: 14:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.030 web:build: 
00:30:34.030 web:build: ./lib/supabase/inventory.ts
00:30:34.030 web:build: 5:3  Warning: 'InventoryItemSortOptions' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.030 web:build: 389:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.031 web:build: 390:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.031 web:build: 391:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.031 web:build: 
00:30:34.031 web:build: ./src/app/(auth)/forgot-password/page.tsx
00:30:34.031 web:build: 50:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.032 web:build: 
00:30:34.032 web:build: ./src/app/(auth)/login/page.tsx
00:30:34.033 web:build: 56:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.033 web:build: 74:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.033 web:build: 
00:30:34.033 web:build: ./src/app/(auth)/register/page.tsx
00:30:34.033 web:build: 78:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.034 web:build: 103:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.034 web:build: 
00:30:34.034 web:build: ./src/app/(auth)/reset-password/page.tsx
00:30:34.034 web:build: 78:14  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.036 web:build: 
00:30:34.036 web:build: ./src/app/(dashboard)/connections/components/ApiKeyForm.tsx
00:30:34.036 web:build: 43:9  Warning: 'marketplaceConfig' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.037 web:build: 
00:30:34.037 web:build: ./src/app/(dashboard)/connections/components/ConnectionSuccess.tsx
00:30:34.037 web:build: 113:18  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.037 web:build: 145:36  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.038 web:build: 
00:30:34.038 web:build: ./src/app/(dashboard)/connections/components/OAuthFlow.tsx
00:30:34.038 web:build: 57:6  Warning: React Hook useEffect has a missing dependency: 'handleCompleteOAuth'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
00:30:34.038 web:build: 147:21  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.038 web:build: 147:37  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.038 web:build: 148:18  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.038 web:build: 150:18  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.039 web:build: 234:52  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.039 web:build: 234:88  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.039 web:build: 286:67  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.039 web:build: 
00:30:34.039 web:build: ./src/app/(dashboard)/dashboard/page.tsx
00:30:34.039 web:build: 17:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.040 web:build: 58:17  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.040 web:build: 58:24  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.040 web:build: 198:24  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.041 web:build: 
00:30:34.041 web:build: ./src/app/(dashboard)/delisting/components/DelistingJobsTable.tsx
00:30:34.041 web:build: 14:10  Warning: 'Alert' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.041 web:build: 14:17  Warning: 'AlertDescription' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.041 web:build: 23:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 25:3  Warning: 'Play' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 28:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 29:3  Warning: 'Download' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 77:10  Warning: 'showConfirmDialog' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 77:29  Warning: 'setShowConfirmDialog' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.043 web:build: 
00:30:34.043 web:build: ./src/app/(dashboard)/delisting/components/DelistingPreferences.tsx
00:30:34.044 web:build: 8:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.046 web:build: 22:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.046 web:build: 23:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.046 web:build: 25:3  Warning: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.046 web:build: 
00:30:34.046 web:build: ./src/app/(dashboard)/delisting/components/ManualDelistingPanel.tsx
00:30:34.046 web:build: 7:27  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 19:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 22:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 24:3  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 26:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 58:10  Warning: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 58:19  Warning: 'setLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.047 web:build: 366:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.048 web:build: 
00:30:34.056 web:build: ./src/app/(dashboard)/delisting/components/RecentActivity.tsx
00:30:34.056 web:build: 22:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.057 web:build: 98:43  Warning: 'status' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.057 web:build: 
00:30:34.057 web:build: ./src/app/(dashboard)/delisting/page.tsx
00:30:34.057 web:build: 21:3  Warning: 'Pause' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.057 web:build: 23:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.057 web:build: 24:3  Warning: 'Search' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.057 web:build: 25:3  Warning: 'Download' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.058 web:build: 
00:30:34.058 web:build: ./src/app/(dashboard)/inventory/components/DeleteConfirmDialog.tsx
00:30:34.058 web:build: 3:20  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.058 web:build: 141:15  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.058 web:build: 141:27  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.058 web:build: 
00:30:34.058 web:build: ./src/app/(dashboard)/inventory/components/EmptyState.tsx
00:30:34.059 web:build: 8:28  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.059 web:build: 48:58  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.059 web:build: 
00:30:34.059 web:build: ./src/app/(dashboard)/inventory/components/InventoryGrid.tsx
00:30:34.059 web:build: 8:15  Warning: 'InventoryItemRecord' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.059 web:build: 
00:30:34.059 web:build: ./src/app/(dashboard)/inventory/components/ItemDetail.tsx
00:30:34.060 web:build: 17:3  Warning: 'ArrowsRightLeftIcon' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.060 web:build: 
00:30:34.060 web:build: ./src/app/(dashboard)/inventory/components/SearchFilters.tsx
00:30:34.060 web:build: 21:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.060 web:build: 22:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.060 web:build: 57:51  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.060 web:build: 
00:30:34.061 web:build: ./src/app/(dashboard)/inventory/hooks/useInventory.ts
00:30:34.061 web:build: 65:76  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.061 web:build: 88:76  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.061 web:build: 91:53  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.061 web:build: 106:78  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.061 web:build: 109:55  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.062 web:build: 
00:30:34.062 web:build: ./src/app/(dashboard)/inventory/page.tsx
00:30:34.062 web:build: 22:3  Warning: 'Search' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.062 web:build: 23:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.062 web:build: 48:17  Warning: 'setItems' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.062 web:build: 
00:30:34.062 web:build: ./src/app/(dashboard)/listings/create/components/ItemSelection.tsx
00:30:34.063 web:build: 151:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.063 web:build: 
00:30:34.063 web:build: ./src/app/(dashboard)/listings/create/components/ListingForm.tsx
00:30:34.063 web:build: 28:3  Warning: 'selectedItem' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.063 web:build: 30:3  Warning: 'onUpdateMarketplaceCustomization' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.063 web:build: 102:53  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.063 web:build: 193:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.064 web:build: 236:93  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.064 web:build: 251:93  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.064 web:build: 266:93  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.064 web:build: 
00:30:34.064 web:build: ./src/app/(dashboard)/listings/create/components/ListingPreview.tsx
00:30:34.064 web:build: 20:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.065 web:build: 23:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.065 web:build: 28:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.065 web:build: 29:17  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.065 web:build: 30:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.065 web:build: 142:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.065 web:build: 175:114  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.065 web:build: 175:135  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.066 web:build: 229:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.066 web:build: 
00:30:34.066 web:build: ./src/app/(dashboard)/listings/create/components/MarketplaceSelection.tsx
00:30:34.066 web:build: 115:39  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.066 web:build: 115:61  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
00:30:34.066 web:build: 
00:30:34.066 web:build: ./src/app/(dashboard)/listings/create/components/SubmissionSuccess.tsx
00:30:34.066 web:build: 13:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.067 web:build: 26:11  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.067 web:build: 27:17  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.067 web:build: 56:31  Warning: 'marketplace' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.067 web:build: 124:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
00:30:34.067 web:build: 154:53  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.067 web:build: 198:17  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.067 web:build: 201:17  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
00:30:34.068 web:build: 
00:30:34.068 web:build: ./src/app/(dashboard)/listings/create/page.tsx
00:30:34.068 web:build: 30:60  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.068 web:build: 37:5  Warning: 'addMarketplace' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.068 web:build: 38:5  Warning: 'removeMarketplace' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.068 web:build: 97:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.068 web:build: 156:25  Warning: 'isUpcomingStep' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.069 web:build: 
00:30:34.069 web:build: ./src/app/(dashboard)/listings/page.tsx
00:30:34.069 web:build: 8:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.069 web:build: 10:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.069 web:build: 23:24  Warning: 'ListingStatus' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.069 web:build: 23:39  Warning: 'MarketplaceType' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.069 web:build: 459:35  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
00:30:34.069 web:build: 
00:30:34.070 web:build: ./src/app/api/delisting/process-job/route.ts
00:30:34.070 web:build: 72:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.070 web:build: 74:11  Warning: 'supabase' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.070 web:build: 
00:30:34.070 web:build: ./src/app/api/delisting/test-sale-detection/route.ts
00:30:34.070 web:build: 134:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.070 web:build: 
00:30:34.071 web:build: ./src/app/api/webhooks/stripe/route.ts
00:30:34.071 web:build: 117:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.071 web:build: 143:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.071 web:build: 
00:30:34.071 web:build: ./src/app/global-error.tsx
00:30:34.071 web:build: 4:10  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.071 web:build: 
00:30:34.071 web:build: ./src/components/sourcing/add-sourcing-item-form.tsx
00:30:34.072 web:build: 7:3  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.074 web:build: 8:3  Warning: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.074 web:build: 21:22  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.074 web:build: 134:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.075 web:build: 155:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.075 web:build: 
00:30:34.075 web:build: ./src/components/ui/input.tsx
00:30:34.075 web:build: 4:18  Warning: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type
00:30:34.075 web:build: 
00:30:34.075 web:build: ./src/lib/delisting/__tests__/delisting-engine.test.ts
00:30:34.076 web:build: 37:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.076 web:build: 307:88  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.076 web:build: 332:88  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.076 web:build: 
00:30:34.076 web:build: ./src/lib/delisting/delisting-engine.ts
00:30:34.076 web:build: 18:3  Warning: 'isRetryableError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.077 web:build: 26:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 131:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 137:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 217:14  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 239:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 246:70  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.077 web:build: 251:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.078 web:build: 322:33  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.079 web:build: 327:19  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.080 web:build: 337:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.080 web:build: 350:12  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.080 web:build: 352:14  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.080 web:build: 355:9  Warning: 'message' is never reassigned. Use 'const' instead.  prefer-const
00:30:34.081 web:build: 387:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.081 web:build: 404:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.082 web:build: 428:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.082 web:build: 429:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.082 web:build: 474:18  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.083 web:build: 
00:30:34.083 web:build: ./src/lib/hooks/useCrossListing.ts
00:30:34.083 web:build: 107:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.083 web:build: 159:12  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.084 web:build: 160:10  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.084 web:build: 176:41  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.084 web:build: 
00:30:34.084 web:build: ./src/lib/hooks/useMarketplaceConnections.ts
00:30:34.084 web:build: 10:3  Warning: 'MarketplaceConnectionSafe' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.084 web:build: 117:18  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.092 web:build: 
00:30:34.093 web:build: ./src/lib/marketplaces/adapter-registry.ts
00:30:34.093 web:build: 60:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.093 web:build: 295:16  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.093 web:build: 
00:30:34.093 web:build: ./src/lib/marketplaces/base-adapter.ts
00:30:34.094 web:build: 24:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.094 web:build: 40:37  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.094 web:build: 58:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.094 web:build: 182:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.096 web:build: 185:12  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.096 web:build: 276:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.096 web:build: 320:75  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.099 web:build: 
00:30:34.100 web:build: ./src/lib/marketplaces/ebay-adapter.ts
00:30:34.100 web:build: 31:11  Warning: 'EBayCategory' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.100 web:build: 39:11  Warning: 'EBayShippingPolicy' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 48:11  Warning: 'EBayItemSpecific' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 69:11  Warning: 'EBayError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 99:67  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 139:41  Warning: 'state' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 487:62  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 517:57  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 533:39  Warning: 'listingId' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 610:55  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 634:13  Warning: 'response' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.103 web:build: 788:62  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 810:61  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.103 web:build: 811:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 857:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 869:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 896:48  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 917:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 920:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 929:55  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 
00:30:34.104 web:build: ./src/lib/marketplaces/facebook-adapter.ts
00:30:34.104 web:build: 31:11  Warning: 'FacebookCategory' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.104 web:build: 56:11  Warning: 'FacebookError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.104 web:build: 133:41  Warning: 'state' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.104 web:build: 484:39  Warning: 'listingId' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.104 web:build: 565:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.104 web:build: 592:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 593:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 611:40  Warning: 'options' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.105 web:build: 755:80  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 779:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 785:65  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 786:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 812:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.105 web:build: 
00:30:34.105 web:build: ./src/lib/marketplaces/poshmark-adapter.ts
00:30:34.105 web:build: 27:3  Warning: 'ApiKeyCredentials' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.105 web:build: 32:11  Warning: 'PoshmarkBrand' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.105 web:build: 46:11  Warning: 'PoshmarkSize' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.105 web:build: 62:11  Warning: 'PoshmarkError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.105 web:build: 65:28  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.106 web:build: 129:41  Warning: 'state' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.106 web:build: 582:49  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.106 web:build: 769:80  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.106 web:build: 786:65  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.106 web:build: 787:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.106 web:build: 844:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.108 web:build: 
00:30:34.108 web:build: ./src/lib/middleware/subscription-middleware-react.tsx
00:30:34.108 web:build: 7:3  Warning: 'options' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.108 web:build: 
00:30:34.108 web:build: ./src/lib/middleware/subscription-middleware.ts
00:30:34.108 web:build: 29:17  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.108 web:build: 137:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.108 web:build: 159:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.109 web:build: 176:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.109 web:build: 182:71  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.109 web:build: 191:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.109 web:build: 221:13  Warning: 'token' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 240:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 240:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 256:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 256:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 261:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 261:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 266:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 266:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 275:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 275:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 284:37  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.109 web:build: 284:46  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 
00:30:34.110 web:build: ./src/lib/polling/sale-poller.ts
00:30:34.110 web:build: 12:3  Warning: 'SaleEvent' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 15:3  Warning: 'PollingResult' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 17:15  Warning: 'ListingRecord' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 47:11  Warning: 'PollingState' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 80:16  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 463:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 468:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 497:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 501:15  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.110 web:build: 515:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 530:12  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.110 web:build: 
00:30:34.110 web:build: ./src/lib/queues/sale-event-queue.ts
00:30:34.110 web:build: 11:3  Warning: 'DelistingJob' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.111 web:build: 12:3  Warning: 'ProcessSaleEventResponse' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.111 web:build: 13:3  Warning: 'DelistingAuditLog' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.111 web:build: 14:3  Warning: 'DELISTING_ERROR_CODES' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.111 web:build: 15:3  Warning: 'getRetryDelay' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.120 web:build: 435:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.120 web:build: 
00:30:34.120 web:build: ./src/lib/services/__tests__/notification-service.test.ts
00:30:34.121 web:build: 26:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 223:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 471:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 521:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 
00:30:34.121 web:build: ./src/lib/services/cross-listing-service.ts
00:30:34.121 web:build: 12:3  Warning: 'CrossPostingPlan' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.121 web:build: 192:5  Warning: 'availableMarketplaces' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.121 web:build: 223:59  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 376:15  Warning: 'config' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.121 web:build: 556:74  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 
00:30:34.121 web:build: ./src/lib/services/email-service.ts
00:30:34.121 web:build: 120:22  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 149:67  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.121 web:build: 206:5  Warning: 'startDate' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.121 web:build: 207:5  Warning: 'endDate' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.121 web:build: 229:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 
00:30:34.122 web:build: ./src/lib/services/listing-job-queue.ts
00:30:34.122 web:build: 233:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 313:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 385:51  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 
00:30:34.122 web:build: ./src/lib/services/marketplace-connection-service.ts
00:30:34.122 web:build: 12:8  Warning: 'MarketplaceApiError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 13:8  Warning: 'AuthenticationError' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 21:3  Warning: 'OAuth1Credentials' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 31:48  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 315:21  Warning: 'updatedConnection' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 364:16  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 
00:30:34.122 web:build: ./src/lib/services/notification-service.ts
00:30:34.122 web:build: 6:10  Warning: 'DelistingJob' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 6:44  Warning: 'MarketplaceType' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.122 web:build: 68:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.122 web:build: 215:5  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 286:5  Warning: 'context' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 
00:30:34.123 web:build: ./src/lib/subscription/__tests__/feature-gates.test.ts
00:30:34.123 web:build: 6:33  Warning: 'UsageLimit' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 
00:30:34.123 web:build: ./src/lib/subscription/beta-service.ts
00:30:34.123 web:build: 104:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.123 web:build: 
00:30:34.123 web:build: ./src/lib/subscription/feature-gates.ts
00:30:34.123 web:build: 10:10  Warning: 'UsageTracker' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 250:59  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.123 web:build: 
00:30:34.123 web:build: ./src/lib/subscription/notification-service.ts
00:30:34.123 web:build: 6:24  Warning: 'EmailDeliveryResult' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 366:16  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.123 web:build: 
00:30:34.123 web:build: ./src/lib/subscription/subscription-service.ts
00:30:34.123 web:build: 9:10  Warning: 'StripeService' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.123 web:build: 195:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.124 web:build: 450:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.124 web:build: 480:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.124 web:build: 
00:30:34.124 web:build: ./src/lib/subscription/usage-tracker.ts
00:30:34.124 web:build: 54:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.124 web:build: 450:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.124 web:build: 
00:30:34.124 web:build: ./src/lib/webhooks/webhook-handler.ts
00:30:34.125 web:build: 12:3  Warning: 'SaleEvent' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.125 web:build: 19:3  Warning: 'DELISTING_ERROR_CODES' is defined but never used.  @typescript-eslint/no-unused-vars
00:30:34.125 web:build: 379:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.125 web:build: 487:16  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
00:30:34.125 web:build: 492:9  Warning: 'mockRequest' is assigned a value but never used.  @typescript-eslint/no-unused-vars
00:30:34.126 web:build: 
00:30:34.126 web:build: info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
00:30:40.798 web:build: Failed to compile.
00:30:40.799 web:build: 
00:30:40.799 web:build: ./src/lib/polling/sale-poller.ts:143:11
00:30:40.799 web:build: Type error: Type '"custom" | "ebay" | "poshmark" | "facebook_marketplace" | "vinted" | "grailed" | "the_realreal" | "vestiaire_collective" | "tradesy" | "amazon" | "shopify"' is not assignable to type 'MarketplaceType'.
00:30:40.799 web:build:   Type '"custom"' is not assignable to type 'MarketplaceType'.
00:30:40.799 web:build: 
00:30:40.799 web:build: [0m [90m 141 |[39m         [90m// Generic handling for unknown marketplaces[39m
00:30:40.799 web:build:  [90m 142 |[39m         saleEventRequest [33m=[39m {
00:30:40.800 web:build: [31m[1m>[22m[39m[90m 143 |[39m           marketplace_type[33m:[39m marketplace[33m,[39m
00:30:40.800 web:build:  [90m     |[39m           [31m[1m^[22m[39m
00:30:40.800 web:build:  [90m 144 |[39m           event_type[33m:[39m [32m'item_sold'[39m[33m,[39m
00:30:40.800 web:build:  [90m 145 |[39m           external_event_id[33m:[39m [32m`${listingData.id || listingData.listing_id}_polling`[39m[33m,[39m
00:30:40.800 web:build:  [90m 146 |[39m           external_listing_id[33m:[39m (listingData[33m.[39mid [33m||[39m listingData[33m.[39mlisting_id)[33m?[39m[33m.[39mtoString()[33m,[39m[0m
00:30:40.840 web:build: Next.js build worker exited with code: 1 and signal: null
00:30:40.854 web:build: npm error Lifecycle script `build` failed with error:
00:30:40.854 web:build: npm error code 1
00:30:40.855 web:build: npm error path /vercel/path0/apps/web
00:30:40.855 web:build: npm error workspace web@0.1.0
00:30:40.855 web:build: npm error location /vercel/path0/apps/web
00:30:40.855 web:build: npm error command failed
00:30:40.855 web:build: npm error command sh -c next build
00:30:40.859 web:build: ERROR: command finished with error: command (/vercel/path0/apps/web) /node22/bin/npm run build exited (1)
00:30:40.860 web#build: command (/vercel/path0/apps/web) /node22/bin/npm run build exited (1)
00:30:40.862 
00:30:40.862   Tasks:    3 successful, 4 total
00:30:40.862  Cached:    3 cached, 4 total
00:30:40.862    Time:    44.182s 
00:30:40.862 Summary:    /vercel/path0/.turbo/runs/3302o8EEDQn0QQ4n5QXks73no0o.json
00:30:40.862  Failed:    web#build
00:30:40.862 
00:30:40.871  ERROR  run failed: command  exited (1)
00:30:40.919 Error: Command "turbo run build" exited with 1

**global hash summary:**

 turbo@1.13.4
      "directory": "apps/web",
      "dependencies": [
        "@netpost/config#build",
        "@netpost/shared-types#build",
        "@netpost/ui#build"
      ],
      "dependents": [],
      "resolvedTaskDefinition": {
        "outputs": [
          "!.next/cache/**",
          ".next/**",
          "build/**",
          "dist/**"
        ],
        "cache": true,
        "dependsOn": [
          "^build"
        ],
        "inputs": [],
        "outputMode": "full",
        "persistent": false,
        "env": [],
        "passThroughEnv": null,
        "dotEnv": null,
        "interactive": false
      },
      "expandedOutputs": [],
      "framework": "nextjs",
      "envMode": "loose",
      "environmentVariables": {
        "specified": {
          "env": [],
          "passThroughEnv": null
        },
        "configured": [],
        "inferred": [],
        "passthrough": null
      },
      "dotEnv": null
    }
  ]
}

###Initial Prompt for @error-detective sub-agent:  
  
  here is the initial prompt i want you to give the @error-detective to start things off after you invoke them (it will involve the sub-agent using the "/go" slash command, just as every prompt and command should be structured):

  prompt: "/go look over our source code and search for errors related to our deployment to vercel failing. i want you to be thorough and once you uncover any issues or errors, systematically work to fix them in whatever order makes the most sense. keep in mind you can pass along any work to the @test-automator agent if there is a test needing to be constructed or for anything outside your scope of work pass back to me, the orchestrator agent" 

