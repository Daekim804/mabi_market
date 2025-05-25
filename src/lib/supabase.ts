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
       console.warn('제공된 URL:', url.substring(0, 50) + '...');
       
       // PostgreSQL URL에서 프로젝트 ID 추출 시도
       try {
         const urlObj = new URL(url);
         const host = urlObj.hostname;
         const username = urlObj.username;
         
         console.log('추출된 호스트:', host);
         console.log('추출된 사용자명:', username);
         
         let projectId = '';
         
         // 방법 1: 사용자명에서 프로젝트 ID 추출 (postgres.PROJECT_ID 형식)
         if (username && username.includes('.')) {
           const usernameParts = username.split('.');
           if (usernameParts.length >= 2 && usernameParts[0] === 'postgres') {
             projectId = usernameParts[1];
             console.log('사용자명에서 프로젝트 ID 추출:', projectId);
           }
         }
         
         // 방법 2: 호스트에서 프로젝트 ID 추출 (postgres.PROJECT_ID.supabase.co 형식)
         if (!projectId && host.includes('.supabase.co')) {
           const hostParts = host.split('.');
           if (hostParts.length >= 3 && hostParts[0] === 'postgres') {
             projectId = hostParts[1];
             console.log('호스트에서 프로젝트 ID 추출:', projectId);
           } else if (hostParts.length >= 2) {
             projectId = hostParts[0];
             console.log('호스트 첫 부분에서 프로젝트 ID 추출:', projectId);
           }
         }
         
         // 방법 3: AWS Pooler 형식 처리 (.pooler.supabase.com)
         if (!projectId && host.includes('.pooler.supabase.com')) {
           console.log('Pooler URL 감지됨, 사용자명에서 프로젝트 ID 추출 시도...');
           
           if (username && username.startsWith('postgres.')) {
             const poolerProjectId = username.split('.')[1];
             if (poolerProjectId) {
               projectId = poolerProjectId;
               console.log('Pooler 사용자명에서 프로젝트 ID 추출:', projectId);
             }
           }
         }
         
         // 프로젝트 ID 검증 및 REST API URL 생성
         if (projectId && projectId !== 'postgres' && projectId.length > 5) {
           const restApiUrl = `https://${projectId}.supabase.co`;
           console.log('✅ REST API URL로 변환 성공:', restApiUrl);
           
           // 변환된 URL 검증
           if (restApiUrl.includes('.supabase.co') && restApiUrl.startsWith('https://')) {
             return restApiUrl;
           }
         }
         
         console.error('❌ 유효한 프로젝트 ID를 찾을 수 없습니다.');
         console.error('추출된 프로젝트 ID:', projectId);
         
       } catch (error) {
         console.error('URL 파싱 오류:', error);
       }
       
       console.error('❌ PostgreSQL URL을 REST API URL로 변환할 수 없습니다.');
       console.error('수동으로 Vercel 환경 변수를 https://PROJECT_ID.supabase.co 형식으로 변경하세요.');
       
       // 실패 시에도 빈 문자열 대신 원본 URL 반환하여 추가 디버깅 가능
       console.error('원본 URL 반환하여 추가 분석 가능하도록 함');
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