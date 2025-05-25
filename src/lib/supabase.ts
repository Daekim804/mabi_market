   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   // 환경 변수 확인 및 로깅
   if (!supabaseUrl || !supabaseKey) {
     console.warn('Supabase 환경 변수가 설정되지 않았습니다');
     console.warn('URL 존재:', !!supabaseUrl, 'Key 존재:', !!supabaseKey);
   }

   // Vercel 배포 환경에 최적화된 클라이언트 설정
   export const supabase = createClient(supabaseUrl, supabaseKey, {
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false
     },
     global: {
       fetch: fetch,
       headers: {
         'X-Client-Info': 'vercel-deployment',
         'User-Agent': 'mabi-market-client'
       }
     },
     db: {
       schema: 'public'
     },
     // Vercel Edge Runtime 호환성을 위한 설정
     realtime: {
       params: {
         eventsPerSecond: 1
       }
     }
   });

   // 서버용 클라이언트 (API 라우트 전용)
   export const createServerSupabase = () => {
     return createClient(supabaseUrl, supabaseKey, {
       auth: {
         persistSession: false,
         autoRefreshToken: false,
         detectSessionInUrl: false
       },
       global: {
         fetch: fetch,
         headers: {
           'X-Client-Info': 'server-supabase-js',
           'User-Agent': 'mabi-market-server',
           // IPv6 호환성을 위한 헤더
           'X-Forwarded-Proto': 'https'
         }
       },
       db: {
         schema: 'public'
       }
     });
   };

   // 연결 상태 확인 함수
   export async function testSupabaseConnection(): Promise<{
     success: boolean;
     error?: string;
     details?: any;
   }> {
     try {
       if (!supabaseUrl || !supabaseKey) {
         return {
           success: false,
           error: '환경 변수가 설정되지 않음',
           details: {
             urlExists: !!supabaseUrl,
             keyExists: !!supabaseKey
           }
         };
       }

       const testClient = createServerSupabase();
       
       // 타임아웃을 포함한 연결 테스트
       const timeoutPromise = new Promise((_, reject) => {
         setTimeout(() => reject(new Error('연결 타임아웃')), 5000);
       });

       const testPromise = testClient
         .from('auction_list')
         .select('id')
         .limit(1);

       const { data, error } = await Promise.race([
         testPromise,
         timeoutPromise.then(() => ({ data: null, error: { message: '연결 타임아웃' } }))
       ]) as any;

       if (error) {
         return {
           success: false,
           error: error.message,
           details: error
         };
       }

       return {
         success: true,
         details: {
           dataExists: !!data,
           timestamp: new Date().toISOString()
         }
       };
     } catch (error) {
       return {
         success: false,
         error: error instanceof Error ? error.message : '알 수 없는 오류',
         details: error
       };
     }
   }