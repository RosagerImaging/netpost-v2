export const baseTypescriptConfig = {
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    module: "ESNext",
    skipLibCheck: true,
    moduleResolution: "bundler" as const,
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react-jsx" as const,
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  },
};

export const nextTypescriptConfig = {
  ...baseTypescriptConfig,
  compilerOptions: {
    ...baseTypescriptConfig.compilerOptions,
    plugins: [
      {
        name: "next",
      },
    ],
    paths: {
      "@/*": ["./src/*"],
    },
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"],
};
