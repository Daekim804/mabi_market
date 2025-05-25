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

// 환경 변수 상태 로깅 함수
function logEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('=== 환경 변수 상태 확인 ===');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('- SUPABASE_URL 설정됨:', !!supabaseUrl);
  console.log('- SUPABASE_URL 길이:', supabaseUrl?.length || 0);
  console.log('- ANON_KEY 설정됨:', !!supabaseAnonKey);
  console.log('- ANON_KEY 길이:', supabaseAnonKey?.length || 0);
  
  if (supabaseUrl) {
    console.log('- SUPABASE_URL 시작:', supabaseUrl.substring(0, 20) + '...');
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
      isFallback: true
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
      isFallback: true
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
      isFallback: true
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
    isFallback: true
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

    if (!itemName) {
      return NextResponse.json({ error: '아이템 이름이 필요합니다' }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 환경 변수 누락 시 즉시 폴백 데이터 반환
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('환경 변수 누락 - 폴백 데이터 사용');
      const fallbackData = getFallbackData(itemName);
      return NextResponse.json(fallbackData, {
        headers: {
          'Cache-Control': 'public, max-age=1800',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'fallback-env-missing'
        }
      });
    }

    try {
      // Supabase 클라이언트 생성
      const supabase = createServerSupabase();
      
      console.log('Supabase 쿼리 시작:', itemName);
      
      // 더 짧은 타임아웃으로 빠른 실패 처리
      const queryPromise = supabase
        .from('auction_list')
        .select('auction_price_per_unit, item_count, collected_at')
        .eq('item_name', itemName)
        .order('auction_price_per_unit', { ascending: true })
        .limit(10);
        
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('데이터베이스 쿼리 타임아웃')), 8000);
      });
      
      // 8초 타임아웃으로 쿼리 실행
      const result = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      const { data, error } = result as any;

      console.log('쿼리 결과:', { 
        dataExists: !!data, 
        dataLength: data?.length || 0,
        errorExists: !!error,
        queryTime: Date.now() - startTime + 'ms'
      });

      if (error) {
        console.error('Supabase 오류 상세:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // 오류 발생 시 폴백 데이터 사용
        const fallbackData = getFallbackData(itemName);
        return NextResponse.json(fallbackData, {
          headers: {
            'Cache-Control': 'public, max-age=1800',
            'Access-Control-Allow-Origin': '*',
            'X-Data-Source': 'fallback-error',
            'X-Error-Code': error.code || 'unknown'
          }
        });
      }

      if (!data || data.length === 0) {
        console.log('데이터 없음:', itemName);
        
        // 데이터가 없을 때 폴백 데이터 사용
        const fallbackData = getFallbackData(itemName);
        return NextResponse.json(fallbackData, {
          headers: {
            'Cache-Control': 'public, max-age=1800',
            'Access-Control-Allow-Origin': '*',
            'X-Data-Source': 'fallback-no-data'
          }
        });
      }
      
      // 정상 데이터 처리
      const auctionData = data as AuctionData[];

      const priceItems = auctionData.map(item => ({
        price: item.auction_price_per_unit,
        count: item.item_count
      }));

      const { weightedAvg, totalCount } = calculateWeightedAverage(
        priceItems,
        'price',
        'count'
      );

      const roundedAvgPrice = Math.round(weightedAvg);
      const roundedLowestPrice = Math.round(auctionData[0].auction_price_per_unit);

      const latestCollectedAt = auctionData.reduce((latest, current) => {
        const currentDate = new Date(current.collected_at);
        const latestDate = new Date(latest);
        return currentDate > latestDate ? current.collected_at : latest;
      }, auctionData[0].collected_at);

      const roundedPriceList = priceItems.map(item => ({
        price: Math.round(item.price),
        count: item.count
      }));

      const responseData = {
        itemName: itemName,
        avgPrice: roundedAvgPrice,
        lowestPrice: roundedLowestPrice,
        totalItems: totalCount,
        collectedAt: latestCollectedAt,
        priceList: roundedPriceList,
        queryTime: Date.now() - startTime
      };
      
      // 성공한 데이터 캐싱
      cacheResponseData(itemName, responseData);
      
      console.log(`${itemName} 성공 응답:`, {
        avgPrice: roundedAvgPrice,
        totalItems: totalCount,
        queryTime: responseData.queryTime + 'ms'
      });

      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'supabase'
        }
      });

    } catch (dbError: unknown) {
      console.error('데이터베이스 연결 오류:', dbError);
      
      // 데이터베이스 연결 실패 시 폴백 데이터 사용
      const fallbackData = getFallbackData(itemName);
      return NextResponse.json(fallbackData, {
        headers: {
          'Cache-Control': 'public, max-age=1800',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'fallback-db-error'
        }
      });
    }

  } catch (error: unknown) {
    console.error('API 최상위 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    // 최상위 오류 시에도 폴백 데이터 시도
    try {
      const itemName = new URL(request.url).searchParams.get('itemName');
      const fallbackData = itemName ? getFallbackData(itemName) : null;
      
      if (fallbackData) {
        console.log('최상위 오류 - 폴백 데이터 사용');
        return NextResponse.json(fallbackData, {
          headers: {
            'Cache-Control': 'public, max-age=1800',
            'Access-Control-Allow-Origin': '*',
            'X-Data-Source': 'fallback-top-error'
          }
        });
      }
    } catch (fallbackError) {
      console.error('폴백 데이터 생성 실패:', fallbackError);
    }
    
    return NextResponse.json(
      { 
        error: `서버 오류가 발생했습니다: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}