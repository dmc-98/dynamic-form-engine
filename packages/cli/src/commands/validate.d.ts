import { Command } from 'commander';
export interface ValidationIssue {
    severity: 'error' | 'warning';
    path: string;
    message: string;
}
/**
 * Validate a DFE form configuration file.
 * Checks for: missing required fields, circular dependencies, type mismatches,
 * missing references, and best practice violations.
 */
export declare function validateFormConfig(configPath: string): {
    valid: boolean;
    issues: ValidationIssue[];
};
/**
 * CLI entry point for `dfe validate`
 */
export declare function runValidateCommand(args: string[]): void;
export declare const validateCommand: Command;
