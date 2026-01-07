# Supabase Configuration

This directory contains the Supabase client configuration for the Mantra mobile app.

## Files

- `supabase.ts` - Main Supabase client instance with authentication configuration

## Environment Variables

The following environment variables must be set in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://gfyzvzjmfwwhkeithlnf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Usage

Import the Supabase client in your services:

```typescript
import { supabase } from '../config/supabase';

// Example: Query data
const { data, error } = await supabase
  .from('novels')
  .select('*')
  .limit(10);
```

## Authentication

The client is configured with:
- AsyncStorage for session persistence
- Auto token refresh
- Session persistence across app restarts

## Helper Functions

See `utils/supabaseHelpers.ts` for utility functions:
- Error handling
- User authentication checks
- File uploads
- Pagination helpers
- Retry logic with exponential backoff

## Constants

See `constants/supabase.ts` for:
- Storage bucket names
- Pagination defaults
- Validation rules
- Status enums
- Query limits

## Types

See `types/supabase.ts` for TypeScript interfaces matching the database schema.
