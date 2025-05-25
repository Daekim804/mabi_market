/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerSupabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { calculateWeightedAverage } from '@/utils/price';

interface AuctionData {
  auction_price_per_unit: number;
  item_count: number;
  collected_at: string;
}

// 메모리 캐시 객체 (서버 재시작 시까지 유지)
const responseCache = new Map<string, { data: any; timestamp: number }>();

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

// 환경 변수 상태 로깅 함수
function logEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('=== 환경 변수 상태 확인 ===');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('- VERCEL_REGION:', process.env.VERCEL_REGION);
  console.log('- SUPABASE_URL 설정됨:', !!supabaseUrl);
  console.log('- SUPABASE_URL 길이:', supabaseUrl?.length || 0);
  console.log('- ANON_KEY 설정됨:', !!supabaseAnonKey);
  console.log('- ANON_KEY 길이:', supabaseAnonKey?.length || 0);
  
  if (supabaseUrl) {
    console.log('- SUPABASE_URL 시작:', supabaseUrl.substring(0, 30) + '...');
    console.log('- URL 형식 유효:', supabaseUrl.startsWith('https://'));
  }
  
  return { supabaseUrl, supabaseAnonKey };
}

// 개선된 폴백 데이터 제공 함수
function getFallbackData(itemName: string | null): any {
  if (!itemName) return null;
  
  // 1. 캐시된 데이터 확인 (1시간 이내)
  const cached = responseCache.get(itemName);
  if (cached && (Date.now() - cached.timestamp < 3600000)) {
    console.log('캐시된 데이터 사용:', itemName);
    return { ...cached.data, isFromCache: true };
  }
  
  // 2. 기본 폴백 데이터
  const now = new Date().toISOString();
  
  const commonItems: Record<string, any> = {
    '돌연변이 토끼의 발': {
      itemName: '돌연변이 토끼의 발',
      avgPrice: 25000,
      lowestPrice: 20000,
      totalItems: 10,
      collectedAt: now,
      priceList: [
        { price: 20000, count: 3 },
        { price: 25000, count: 5 },
        { price: 30000, count: 2 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    },
    '돌연변이 식물의 점액질': {
      itemName: '돌연변이 식물의 점액질',
      avgPrice: 18000,
      lowestPrice: 15000,
      totalItems: 8,
      collectedAt: now,
      priceList: [
        { price: 15000, count: 3 },
        { price: 18000, count: 4 },
        { price: 22000, count: 1 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    },
    '사스콰치의 심장': {
      itemName: '사스콰치의 심장',
      avgPrice: 35000,
      lowestPrice: 30000,
      totalItems: 5,
      collectedAt: now,
      priceList: [
        { price: 30000, count: 2 },
        { price: 35000, count: 2 },
        { price: 40000, count: 1 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    },
    '뮤턴트': {
      itemName: '뮤턴트',
      avgPrice: 45000,
      lowestPrice: 40000,
      totalItems: 6,
      collectedAt: now,
      priceList: [
        { price: 40000, count: 2 },
        { price: 45000, count: 3 },
        { price: 50000, count: 1 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    },
    '고급 가죽': {
      itemName: '고급 가죽',
      avgPrice: 15000,
      lowestPrice: 12000,
      totalItems: 15,
      collectedAt: now,
      priceList: [
        { price: 12000, count: 5 },
        { price: 15000, count: 7 },
        { price: 18000, count: 3 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    },
    '실크': {
      itemName: '실크',
      avgPrice: 8000,
      lowestPrice: 6000,
      totalItems: 20,
      collectedAt: now,
      priceList: [
        { price: 6000, count: 8 },
        { price: 8000, count: 10 },
        { price: 10000, count: 2 }
      ],
      isFallback: true,
      fallbackReason: 'database_unavailable'
    }
  };
  
  return commonItems[itemName] || {
    itemName: itemName,
    avgPrice: 10000,
    lowestPrice: 8000,
    totalItems: 5,
    collectedAt: now,
    priceList: [
      { price: 8000, count: 2 },
      { price: 10000, count: 3 }
    ],
    isFallback: true,
    fallbackReason: 'item_not_found'
  };
}

// 응답 데이터 캐싱 함수
function cacheResponseData(itemName: string, data: any) {
  responseCache.set(itemName, {
    data,
    timestamp: Date.now()
  });
  
  // 캐시 크기 제한 (최대 100개 아이템)
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }
}

// 재시도 로직이 포함된 Supabase 쿼리 함수
async function queryWithRetry(supabase: any, itemName: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`=== Supabase 쿼리 시도 ${attempt}/${maxRetries} ===`);
      console.log('아이템명:', itemName);
      
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('auction_list')
        .select('auction_price_per_unit')
        .eq('item_name', itemName)
        .not('auction_price_per_unit', 'is', null)
        .order('auction_price_per_unit', { ascending: true });
      
      const queryTime = Date.now() - startTime;
      console.log(`쿼리 완료 (${queryTime}ms)`);
      
      if (error) {
        console.error(`시도 ${attempt} 실패 - Supabase 오류:`, error);
        
        // 네트워크 오류인 경우 재시도
        if (error.message?.includes('fetch failed') || 
            error.message?.includes('network') ||
            error.message?.includes('timeout')) {
          
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프
            console.log(`${delay}ms 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        throw error;
      }
      
      console.log(`성공: ${data?.length || 0}개 데이터 조회`);
      return data;
      
    } catch (err) {
      console.error(`시도 ${attempt} 예외:`, err);
      
      // 네트워크 관련 오류인 경우 재시도
      if (err instanceof Error && 
          (err.message.includes('fetch failed') || 
           err.message.includes('network') ||
           err.message.includes('timeout') ||
           err.message.includes('ECONNRESET') ||
           err.message.includes('ETIMEDOUT'))) {
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`네트워크 오류 감지, ${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw err;
    }
  }
  
  throw new Error(`${maxRetries}번 시도 후 실패`);
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // 환경 변수 확인
    const { supabaseUrl, supabaseAnonKey } = logEnvStatus();
    
    const { searchParams } = new URL(request.url);
    const itemName = searchParams.get('itemName');

    console.log('=== API 요청 시작 ===');
    console.log('요청된 아이템:', itemName);
    console.log('요청 시간:', new Date().toISOString());
    console.log('요청 헤더:', {
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    });

    if (!itemName) {
      return NextResponse.json({ 
        error: '아이템 이름이 필요합니다',
        code: 'MISSING_ITEM_NAME'
      }, { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }

    // 환경 변수 누락 시 즉시 폴백 데이터 반환
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('환경 변수 누락 - 폴백 데이터 사용');
      const fallbackData = getFallbackData(itemName);
      return NextResponse.json(fallbackData, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=1800',
          'X-Data-Source': 'fallback-env-missing',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    try {
      // Supabase 클라이언트 생성
      const supabase = createServerSupabase();
      
      console.log('Supabase 쿼리 시작:', itemName);
      
             // 재시도 로직이 포함된 Supabase 쿼리 함수 호출
       const data = await queryWithRetry(supabase, itemName);

       if (!data || data.length === 0) {
        console.log('데이터 없음 - 폴백 데이터 사용');
        const fallbackData = getFallbackData(itemName);
        fallbackData.fallbackReason = 'no_data_found';
        
        return NextResponse.json(fallbackData, {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=1800',
            'X-Data-Source': 'fallback-no-data',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      }

             // 데이터 처리
       const auctionData: AuctionData[] = data.map((item: any) => ({
         auction_price_per_unit: item.auction_price_per_unit,
         item_count: item.item_count || 1,
         collected_at: item.collected_at || new Date().toISOString()
       }));
      const prices = auctionData.map(item => item.auction_price_per_unit);
      const counts = auctionData.map(item => item.item_count);
      
      const lowestPrice = Math.min(...prices);
      const avgPrice = calculateWeightedAverage(prices, counts);
      const totalItems = auctionData.reduce((sum, item) => sum + item.item_count, 0);
      
      const priceList = auctionData.map(item => ({
        price: item.auction_price_per_unit,
        count: item.item_count
      }));

      const responseData = {
        itemName,
        avgPrice: Math.round(avgPrice),
        lowestPrice,
        totalItems,
        collectedAt: auctionData[0]?.collected_at || new Date().toISOString(),
        priceList,
        dataSource: 'database',
        queryTime: Date.now() - startTime
      };

      // 성공한 데이터 캐싱
      cacheResponseData(itemName, responseData);

      console.log('API 응답 성공:', {
        itemName,
        avgPrice: responseData.avgPrice,
        lowestPrice: responseData.lowestPrice,
        totalItems: responseData.totalItems,
        responseTime: Date.now() - startTime + 'ms'
      });

      return NextResponse.json(responseData, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Data-Source': 'database',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });

    } catch (dbError) {
      console.error('데이터베이스 연결 오류:', {
        error: dbError instanceof Error ? dbError.message : dbError,
        stack: dbError instanceof Error ? dbError.stack : undefined,
        itemName,
        queryTime: Date.now() - startTime + 'ms'
      });

      // 데이터베이스 오류 시 폴백 데이터 사용
      const fallbackData = getFallbackData(itemName);
      fallbackData.fallbackReason = `connection_error: ${dbError instanceof Error ? dbError.message : 'unknown'}`;

      return NextResponse.json(fallbackData, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=600',
          'X-Data-Source': 'fallback-connection-error',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

  } catch (error) {
    console.error('API 라우트 전체 오류:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: Date.now() - startTime + 'ms'
    });

    // 최종 폴백 응답
    return NextResponse.json({
      error: '서버 오류가 발생했습니다',
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, max-age=0',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  }
}