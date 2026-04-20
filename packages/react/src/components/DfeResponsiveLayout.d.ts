import React from 'react';
import type { FormField, FormValues } from '@dmc--98/dfe-core';
import type { FieldRendererProps } from '../renderers';
export interface DfeResponsiveLayoutProps {
    fields: FormField[];
    values: FormValues;
    onFieldChange: (key: string, value: unknown) => void;
    errors?: Record<string, string>;
    renderField?: React.ComponentType<FieldRendererProps>;
    breakpoints?: {
        sm: number;
        md: number;
        lg: number;
    };
    columns?: {
        sm: number;
        md: number;
        lg: number;
    };
    gap?: string;
    className?: string;
}
/**
 * Responsive form layout component using CSS Grid.
 *
 * Automatically adjusts column count based on viewport width.
 * Respects field width hints (full, half, third) to determine grid span.
 *
 * Default breakpoints:
 * - sm: 640px (1 column)
 * - md: 1024px (2 columns)
 * - lg: 1280px (3 columns)
 *
 * @example
 * ```tsx
 * <DfeResponsiveLayout
 *   fields={engine.visibleFields}
 *   values={engine.values}
 *   onFieldChange={engine.setFieldValue}
 *   errors={validationErrors}
 *   renderField={customFieldRenderer}
 *   columns={{ sm: 1, md: 2, lg: 3 }}
 *   gap="1.5rem"
 * />
 * ```
 */
export declare function DfeResponsiveLayout({ fields, values, onFieldChange, errors, renderField, breakpoints, columns, gap, className, }: DfeResponsiveLayoutProps): React.ReactElement;
