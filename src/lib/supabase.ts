   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';

   // 환경 변수 가져오기
   const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

   // URL 형식 검증 및 수정
   function validateAndFixSupabaseUrl(url: string): string {
     if (!url) {
       console.error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다');
       return '';
     }

     // PostgreSQL URL 형식인지 확인 (postgresql://로 시작하는 경우)
     if (url.startsWith('postgresql://')) {
       console.error('PostgreSQL URL이 제공되었습니다. REST API URL이 필요합니다.');
       console.error('제공된 URL:', url.substring(0, 30) + '...');
       
       // PostgreSQL URL에서 호스트 추출 시도
       try {
         const urlObj = new URL(url);
         const host = urlObj.hostname;
         
         // Supabase 호스트인지 확인
         if (host.includes('.supabase.co')) {
           // 프로젝트 ID 추출 (예: postgres.hwskpyhrkbxuivdbqgrk -> hwskpyhrkbxuivdbqgrk)
           const projectId = host.split('.')[1];
           const restApiUrl = `https://${projectId}.supabase.co`;
           console.log('REST API URL로 변환:', restApiUrl);
           return restApiUrl;
         }
       } catch (error) {
         console.error('URL 파싱 오류:', error);
       }
       
       return '';
     }

     // HTTPS URL 형식 확인
     if (!url.startsWith('https://')) {
       console.error('올바르지 않은 Supabase URL 형식:', url);
       return '';
     }

     // Supabase 도메인 확인
     if (!url.includes('.supabase.co')) {
       console.error('올바르지 않은 Supabase 도메인:', url);
       return '';
     }

     return url;
   }

   // URL 검증 및 수정
   const supabaseUrl = validateAndFixSupabaseUrl(rawSupabaseUrl);

   // 환경 변수 확인
   if (!supabaseUrl || !supabaseKey) {
     console.error('Supabase 환경 변수가 올바르게 설정되지 않았습니다');
     console.error('URL 상태:', supabaseUrl ? '✓' : '✗');
     console.error('Key 상태:', supabaseKey ? '✓' : '✗');
   } else {
     console.log('Supabase 클라이언트 생성 성공');
     console.log('URL:', supabaseUrl);
   }

   // Supabase 클라이언트 생성
   export const supabase = createClient(supabaseUrl, supabaseKey, {
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false
     },
     global: {
       headers: { 
         'X-Client-Info': 'vercel-deployment',
         'User-Agent': 'mabi-market/1.0'
       }
     },
     db: {
       schema: 'public'
     }
   });

   // 서버 컴포넌트용 Supabase 클라이언트 생성 함수
   export function createServerSupabase() {
     if (!supabaseUrl || !supabaseKey) {
       throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
     }
     
     return createClient(supabaseUrl, supabaseKey, {
       auth: {
         persistSession: false,
         autoRefreshToken: false,
         detectSessionInUrl: false
       },
       global: {
         headers: { 
           'X-Client-Info': 'vercel-server',
           'User-Agent': 'mabi-market-server/1.0'
         }
       },
       db: {
         schema: 'public'
       }
     });
   }

   // 연결 테스트 함수
   export async function testSupabaseConnection() {
     try {
       if (!supabaseUrl || !supabaseKey) {
         return {
           success: false,
           error: '환경 변수가 설정되지 않음',
           details: {
             url: !!supabaseUrl,
             key: !!supabaseKey
           }
         };
       }

       const { data, error } = await supabase
         .from('auction_list')
         .select('count')
         .limit(1);

       if (error) {
         return {
           success: false,
           error: error.message,
           details: error
         };
       }

       return {
         success: true,
         message: 'Supabase 연결 성공',
         data
       };
     } catch (error) {
       return {
         success: false,
         error: error instanceof Error ? error.message : '알 수 없는 오류',
         details: error
       };
     }
   }