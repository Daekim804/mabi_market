import { createServerSupabase, testSupabaseConnection } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface ConnectionInfo {
  status: string;
  error?: string;
  code?: string;
  details?: string;
  dataExists?: boolean;
  dataLength?: number;
  queryTime?: number;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // 환경 변수 정보
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envInfo = {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseUrlValid: supabaseUrl?.startsWith('https://') || false,
      anonKeyExists: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      runtime: process.env.NEXT_RUNTIME,
      timestamp: new Date().toISOString()
    };
    
    // Supabase 연결 테스트
    let connectionInfo: ConnectionInfo = { status: 'not_tested' };
    
    if (supabaseUrl && supabaseAnonKey) {
      try {
        console.log('=== 디버그 API: Supabase 연결 테스트 시작 ===');
        
        // 개선된 연결 테스트 사용
        const connectionTest = await testSupabaseConnection();
        
        if (connectionTest.success) {
          // 추가 데이터 테스트
          const supabase = createServerSupabase();
          const testStartTime = Date.now();
          
          const { data, error } = await supabase
            .from('auction_list')
            .select('id, item_name, auction_price_per_unit')
            .limit(3);
            
          const queryTime = Date.now() - testStartTime;
          
          if (error) {
            connectionInfo = {
              status: 'error',
              error: error.message,
              code: error.code,
              details: JSON.stringify(error),
              queryTime
            };
          } else {
            connectionInfo = {
              status: 'success',
              dataExists: !!data,
              dataLength: data?.length || 0,
              queryTime,
              details: data ? `샘플 데이터: ${data.map(item => item.item_name).join(', ')}` : undefined
            };
          }
        } else {
          connectionInfo = {
            status: 'connection_failed',
            error: connectionTest.error,
            details: JSON.stringify(connectionTest.details)
          };
        }
      } catch (err) {
        connectionInfo = {
          status: 'exception',
          error: err instanceof Error ? err.message : '알 수 없는 오류',
          details: err instanceof Error ? err.stack : undefined
        };
      }
    } else {
      connectionInfo = {
        status: 'env_missing',
        error: '환경 변수가 설정되지 않음',
        details: `URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`
      };
    }
    
    // 요청 정보
    const requestInfo = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      xForwardedFor: request.headers.get('x-forwarded-for'),
      xRealIp: request.headers.get('x-real-ip')
    };
    
    // 시스템 정보
    const systemInfo = {
      totalTime: Date.now() - startTime,
      memoryUsage: process.memoryUsage ? process.memoryUsage() : 'unavailable',
      platform: process.platform || 'unknown',
      nodeVersion: process.version || 'unknown'
    };
    
    const response = {
      status: 'success',
      environment: envInfo,
      connection: connectionInfo,
      request: requestInfo,
      system: systemInfo,
      recommendations: generateRecommendations(envInfo, connectionInfo)
    };
    
    console.log('=== 디버그 API 응답 ===', {
      connectionStatus: connectionInfo.status,
      envValid: !!supabaseUrl && !!supabaseAnonKey,
      totalTime: systemInfo.totalTime
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'X-Debug-Timestamp': new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('디버그 API 오류:', error);
    
    return NextResponse.json({ 
      status: 'error',
      error: 'Debug API 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 문제 해결 권장사항 생성
function generateRecommendations(envInfo: any, connectionInfo: ConnectionInfo): string[] {
  const recommendations: string[] = [];
  
  if (!envInfo.supabaseUrl || !envInfo.anonKeyExists) {
    recommendations.push('Vercel 대시보드에서 환경 변수 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.');
  }
  
  if (envInfo.supabaseUrl && !envInfo.supabaseUrlValid) {
    recommendations.push('SUPABASE_URL이 https://로 시작하는지 확인하세요.');
  }
  
  if (connectionInfo.status === 'error') {
    if (connectionInfo.code === 'PGRST116') {
      recommendations.push('테이블 "auction_list"가 존재하지 않거나 접근 권한이 없습니다. Supabase 대시보드에서 테이블과 RLS 정책을 확인하세요.');
    } else if (connectionInfo.error?.includes('timeout')) {
      recommendations.push('연결 타임아웃이 발생했습니다. Supabase 서비스 상태를 확인하거나 잠시 후 다시 시도하세요.');
    } else if (connectionInfo.error?.includes('Invalid API key')) {
      recommendations.push('API 키가 올바르지 않습니다. Supabase 프로젝트 설정에서 anon key를 다시 확인하세요.');
    }
  }
  
  if (connectionInfo.status === 'connection_failed') {
    recommendations.push('Supabase 연결에 실패했습니다. 네트워크 연결과 Supabase 서비스 상태를 확인하세요.');
  }
  
  if (envInfo.vercelEnv === 'production' && connectionInfo.queryTime && connectionInfo.queryTime > 3000) {
    recommendations.push('쿼리 응답 시간이 느립니다. Supabase 지역 설정을 확인하거나 인덱스 최적화를 고려하세요.');
  }
  
  if (recommendations.length === 0 && connectionInfo.status === 'success') {
    recommendations.push('모든 연결이 정상입니다. 클라이언트 측 코드나 브라우저 캐시를 확인해보세요.');
  }
  
  return recommendations;
} 