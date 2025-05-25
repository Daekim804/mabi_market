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
       console.warn('⚠️ PostgreSQL URL이 제공되었습니다. REST API URL로 자동 변환합니다.');
       console.warn('제공된 URL:', url.substring(0, 30) + '...');
       
       // PostgreSQL URL에서 호스트 추출 시도
       try {
         const urlObj = new URL(url);
         const host = urlObj.hostname;
         
         console.log('추출된 호스트:', host);
         
         // Supabase 호스트인지 확인
         if (host.includes('.supabase.co')) {
           // 프로젝트 ID 추출 (예: postgres.hwskpyhrkbxuivdbqgrk -> hwskpyhrkbxuivdbqgrk)
           const hostParts = host.split('.');
           let projectId = '';
           
           // 다양한 호스트 형식 처리
           if (hostParts.length >= 3 && hostParts[0] === 'postgres') {
             projectId = hostParts[1]; // postgres.PROJECT_ID.supabase.co
           } else if (hostParts.length >= 2) {
             projectId = hostParts[0]; // PROJECT_ID.supabase.co
           }
           
           if (projectId && projectId !== 'postgres') {
             const restApiUrl = `https://${projectId}.supabase.co`;
             console.log('✅ REST API URL로 변환 성공:', restApiUrl);
             return restApiUrl;
           }
         }
         
         // AWS RDS 형식의 호스트인 경우 (예: aws-0-ap-northeast-2.pooler.supabase.com)
         if (host.includes('.pooler.supabase.com')) {
           console.log('Pooler URL 감지됨, 프로젝트 ID 추출 시도...');
           
           // URL에서 프로젝트 ID 추출 시도 (사용자명에서)
           const username = urlObj.username;
           if (username && username.startsWith('postgres.')) {
             const projectId = username.split('.')[1];
             if (projectId) {
               const restApiUrl = `https://${projectId}.supabase.co`;
               console.log('✅ Pooler URL에서 REST API URL로 변환 성공:', restApiUrl);
               return restApiUrl;
             }
           }
         }
         
       } catch (error) {
         console.error('URL 파싱 오류:', error);
       }
       
       console.error('❌ PostgreSQL URL을 REST API URL로 변환할 수 없습니다.');
       console.error('수동으로 Vercel 환경 변수를 https://PROJECT_ID.supabase.co 형식으로 변경하세요.');
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

     console.log('✅ 올바른 Supabase URL 형식 확인됨');
     return url;
   }

   // URL 검증 및 수정
   const supabaseUrl = validateAndFixSupabaseUrl(rawSupabaseUrl);

   // 환경 변수 확인
   if (!supabaseUrl || !supabaseKey) {
     console.error('❌ Supabase 환경 변수가 올바르게 설정되지 않았습니다');
     console.error('URL 상태:', supabaseUrl ? '✓' : '✗');
     console.error('Key 상태:', supabaseKey ? '✓' : '✗');
     
     if (rawSupabaseUrl.startsWith('postgresql://')) {
       console.error('');
       console.error('🔧 해결 방법:');
       console.error('1. Vercel 대시보드 → Settings → Environment Variables');
       console.error('2. NEXT_PUBLIC_SUPABASE_URL을 다음 형식으로 변경:');
       console.error('   https://hwskpyhrkbxuivdbqgrk.supabase.co');
       console.error('3. 재배포 실행');
       console.error('');
     }
   } else {
     console.log('✅ Supabase 클라이언트 생성 성공');
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
             key: !!supabaseKey,
             rawUrl: rawSupabaseUrl.substring(0, 30) + '...'
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