import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface ConnectionInfo {
  status: string;
  error?: string;
  code?: string;
  details?: string;
  dataExists?: boolean;
  dataLength?: number;
}

export async function GET(request: Request) {
  try {
    // 환경 변수 정보
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envInfo = {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : null,
      supabaseUrlLength: supabaseUrl?.length || 0,
      anonKeyExists: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      runtime: process.env.NEXT_RUNTIME
    };
    
    // Supabase 연결 테스트
    let connectionInfo: ConnectionInfo = { status: 'not_tested' };
    
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false
          },
          global: {
            fetch: fetch
          }
        });
        
        // 간단한 테스트 쿼리
        const { data, error } = await supabase
          .from('auction_list')
          .select('id')
          .limit(1);
          
        if (error) {
          connectionInfo = {
            status: 'error',
            error: error.message,
            code: error.code,
            details: error.details
          };
        } else {
          connectionInfo = {
            status: 'success',
            dataExists: !!data,
            dataLength: data?.length || 0
          };
        }
      } catch (err) {
        connectionInfo = {
          status: 'exception',
          error: err instanceof Error ? err.message : '알 수 없는 오류'
        };
      }
    }
    
    // 요청 정보
    const requestInfo = {
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    };
    
    return NextResponse.json({
      environment: envInfo,
      connection: connectionInfo,
      request: requestInfo,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug API 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 