   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   // 환경 변수 확인
   if (!supabaseUrl || !supabaseKey) {
     console.warn('Supabase 환경 변수가 설정되지 않았습니다');
   }

   // 개선된 클라이언트 설정
   export const supabase = createClient(supabaseUrl, supabaseKey, {
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false
     },
     global: {
       headers: {
         'X-Client-Info': 'supabase-js-client'
       }
     }
   });

   // 서버용 클라이언트 (서버 컴포넌트나 API 라우트에서 사용)
   export const createServerSupabase = () => {
     return createClient(supabaseUrl, supabaseKey, {
       auth: {
         persistSession: false
       },
       global: {
         fetch: fetch,
         headers: {
           'X-Client-Info': 'server-supabase-js'
         }
       }
     });
   };