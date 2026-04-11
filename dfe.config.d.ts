/**
 * Centralized configuration for the Dynamic Form Engine monorepo.
 *
 * Update values here and run `pnpm run sync-config` to propagate
 * changes across all packages, docs, and examples.
 */
export declare const config: {
    /** npm scope — used in all package.json "name" fields */
    readonly orgScope: "@dmc-98";
    /** GitHub organisation or user */
    readonly githubOrg: "snarjun98";
    /** GitHub repository name */
    readonly githubRepo: "dynamic-form-engine";
    /** Human-readable project name */
    readonly projectName: "Dynamic Form Engine";
    /** Short project name / CLI command */
    readonly shortName: "dfe";
    /** Base path for GitHub Pages docs */
    readonly docsBasePath: "/dynamic-form-engine/";
    /** Author info for package.json files */
    readonly author: "snarjun98";
    /** License */
    readonly license: "MIT";
};
export type DfeConfig = typeof config;
