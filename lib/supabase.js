import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**And check your `.env.local` file has:**
```
NEXT_PUBLIC_SUPABASE_URL=https://dtqeilodflwcujqwlqza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cWVpbG9kZmx3Y3VqcXdscXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjAyMjIsImV4cCI6MjA4NzgzNjIyMn0.Xjq1VG1dsEYX3qCy1qVSLquCrzu7kRCBVvDp4GYlTAo
