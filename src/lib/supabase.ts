   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   // 환경 변수 확인
   if (!supabaseUrl || !supabaseKey) {
     console.warn('Supabase 환경 변수가 설정되지 않았습니다');
   }

   export const supabase = createClient(supabaseUrl, supabaseKey);