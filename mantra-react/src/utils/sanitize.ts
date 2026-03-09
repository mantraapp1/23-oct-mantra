/**
 * Sanitize user input for use in Supabase/PostgREST ilike patterns.
 * Escapes SQL wildcards (% and _) and PostgREST special characters
 * to prevent filter manipulation or unintended pattern matching.
 */
export function sanitizeSearchInput(input: string): string {
    return input
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/%/g, '\\%')   // Escape SQL wildcard %
        .replace(/_/g, '\\_');  // Escape SQL wildcard _
}
