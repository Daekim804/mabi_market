// page.tsx - Server Component
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase';
import { formatKSTDateTime } from '@/utils/price';
import ItemPriceList from './components/ItemPriceList';
import MutantProfitCalculator from './components/MutantProfitCalculator';

// 5분마다 페이지 재검증 설정
export const revalidate = 300; // 5분(300초)

// 서버 컴포넌트에서 사용할 타입 정의
interface PriceData {
  avgPrice: number;
  lowestPrice: number;
  totalItems: number;
  collectedAt: string;
  priceList: Array<{
    price: number;
    count: number;
  }>;
  error?: string; // 오류 메시지 필드 추가
}

interface ItemPrices {
  [key: string]: PriceData | null;
}

// 하드코딩된 샘플 데이터 (데이터 로드 실패 시 사용)
const sampleData: ItemPrices = {
  '돌연변이 토끼의 발': {
    avgPrice: 25000,
    lowestPrice: 20000,
    totalItems: 50,
    collectedAt: new Date().toISOString(),
    priceList: [
      { price: 20000, count: 10 },
      { price: 25000, count: 20 },
      { price: 30000, count: 20 }
    ]
  },
  '돌연변이 식물의 점액질': {
    avgPrice: 35000,
    lowestPrice: 30000,
    totalItems: 40,
    collectedAt: new Date().toISOString(),
    priceList: [
      { price: 30000, count: 15 },
      { price: 35000, count: 15 },
      { price: 40000, count: 10 }
    ]
  },
  '사스콰치의 심장': {
    avgPrice: 80000,
    lowestPrice: 75000,
    totalItems: 20,
    collectedAt: new Date().toISOString(),
    priceList: [
      { price: 75000, count: 5 },
      { price: 80000, count: 10 },
      { price: 85000, count: 5 }
    ]
  },
  '뮤턴트': {
    avgPrice: 850000,
    lowestPrice: 800000,
    totalItems: 10,
    collectedAt: new Date().toISOString(),
    priceList: [
      { price: 800000, count: 3 },
      { price: 850000, count: 4 },
      { price: 900000, count: 3 }
    ]
  }
};

// 재시도 로직이 포함된 fetch 함수
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API 호출 시도 ${attempt}/${maxRetries}:`, url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`API 호출 성공 (시도 ${attempt}):`, response.status);
      return response;
      
    } catch (error) {
      console.error(`API 호출 시도 ${attempt} 실패:`, error);
      
      // 네트워크 오류인 경우 재시도
      if (error instanceof Error && 
          (error.message.includes('fetch failed') ||
           error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('aborted') ||
           error.name === 'AbortError' ||
           error.name === 'TypeError')) {
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프
          console.log(`${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error(`${maxRetries}번 시도 후 실패`);
}

// 아이템 가격 정보를 가져오는 함수 (재시도 로직 포함)
async function fetchItemPrice(itemName: string): Promise<PriceData> {
  try {
    const response = await fetchWithRetry(`/api/items/price?itemName=${encodeURIComponent(itemName)}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error(`${itemName} 데이터 오류:`, {
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error instanceof Error ? error.stack : error,
      hint: '네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.',
      code: error instanceof Error ? error.name : ''
    });
    
    // 오류 발생 시 기본값 반환
    return {
      avgPrice: 0,
      lowestPrice: 0,
      totalItems: 0,
      collectedAt: new Date().toISOString(),
      priceList: [],
      error: `client_error: ${error instanceof Error ? error.message : 'unknown'}`
    };
  }
}

// 서버 컴포넌트에서 데이터 가져오기
async function fetchItemPrices() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('환경 변수 오류: Supabase 접속 정보가 없습니다');
      
      // 오류 정보를 포함한 객체 반환
      return {
        '돌연변이 토끼의 발': { error: '환경 변수 오류: Supabase 접속 정보가 없습니다' },
        '돌연변이 식물의 점액질': { error: '환경 변수 오류: Supabase 접속 정보가 없습니다' },
        '사스콰치의 심장': { error: '환경 변수 오류: Supabase 접속 정보가 없습니다' },
        '뮤턴트': { error: '환경 변수 오류: Supabase 접속 정보가 없습니다' }
      } as unknown as ItemPrices;
    }

    // Supabase 클라이언트 초기화 - 개선된 설정 사용
    const supabase = createServerSupabase();

    console.log('Supabase 클라이언트 생성 성공');

    const items = ['돌연변이 토끼의 발', '돌연변이 식물의 점액질', '사스콰치의 심장', '뮤턴트'];
    const prices: ItemPrices = {};
    let hasError = false;

    for (const item of items) {
      try {
        console.log(`${item} 데이터 요청 시작`);
        
        // 재시도 로직 적용
        let data = null;
        let error = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`${item} 쿼리 시도 ${attempt}/3`);
            
            const result = await supabase
              .from('auction_list')
              .select('auction_price_per_unit, item_count, collected_at')
              .eq('item_name', item)
              .order('auction_price_per_unit', { ascending: true })
              .limit(10);
            
            data = result.data;
            error = result.error;
            
            if (!error) {
              console.log(`${item} 쿼리 성공 (시도 ${attempt})`);
              break;
            }
            
            if (attempt < 3) {
              const delay = 1000 * attempt; // 1초, 2초, 3초
              console.log(`${item} 쿼리 실패, ${delay}ms 후 재시도...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (queryError) {
            console.error(`${item} 쿼리 시도 ${attempt} 예외:`, queryError);
            if (attempt === 3) {
              error = { message: queryError instanceof Error ? queryError.message : 'Unknown error' };
            }
          }
        }

        if (error) {
          console.error(`${item} 데이터 오류:`, error);
          prices[item] = { error: `데이터 조회 오류: ${error.message}` } as unknown as PriceData | null;
          hasError = true;
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`${item} 데이터 없음`);
          prices[item] = { error: '가격 정보가 없습니다' } as unknown as PriceData | null;
          continue;
        }

        console.log(`${item} 데이터 ${data.length}개 조회 성공`);

        // AuctionData를 PriceItem 형식으로 변환
        const priceItems = data.map((item: any) => ({
          price: item.auction_price_per_unit,
          count: item.item_count
        }));

        // 가중 평균 가격 계산
        const totalItems = priceItems.reduce((sum: number, item: any) => sum + item.count, 0);
        const totalValue = priceItems.reduce((sum: number, item: any) => sum + (item.price * item.count), 0);
        const weightedAvg = totalValue / totalItems;

        // 정수로 반올림된 가격 값 사용
        const roundedAvgPrice = Math.round(weightedAvg);
        const roundedLowestPrice = Math.round(data[0].auction_price_per_unit);

        // 가장 최근 수집 시간 찾기
        const latestCollectedAt = data.reduce((latest: string, current: any) => {
          const currentDate = new Date(current.collected_at);
          const latestDate = new Date(latest);
          return currentDate > latestDate ? current.collected_at : latest;
        }, data[0].collected_at);

        // 가격 목록도 정수로 반올림
        const roundedPriceList = priceItems.map((item: any) => ({
          price: Math.round(item.price),
          count: item.count
        }));

        prices[item] = {
          avgPrice: roundedAvgPrice,
          lowestPrice: roundedLowestPrice,
          totalItems,
          collectedAt: latestCollectedAt,
          priceList: roundedPriceList
        };
      } catch (err) {
        console.error(`${item} 요청 실패:`, err);
        prices[item] = { error: `데이터 요청 실패: ${err instanceof Error ? err.message : String(err)}` } as unknown as PriceData | null;
        hasError = true;
      }
    }

    // 모든 아이템에 대해 데이터가 없거나 오류가 있는 경우에도 가져온 정보 반환
    return prices;
  } catch (err) {
    console.error('가격 정보를 가져오는 중 오류가 발생했습니다:', err);
    
    // 오류 정보를 포함한 객체 반환
    return {
      '돌연변이 토끼의 발': { error: `가격 정보를 가져오는 중 오류 발생: ${err instanceof Error ? err.message : String(err)}` },
      '돌연변이 식물의 점액질': { error: `가격 정보를 가져오는 중 오류 발생: ${err instanceof Error ? err.message : String(err)}` },
      '사스콰치의 심장': { error: `가격 정보를 가져오는 중 오류 발생: ${err instanceof Error ? err.message : String(err)}` },
      '뮤턴트': { error: `가격 정보를 가져오는 중 오류 발생: ${err instanceof Error ? err.message : String(err)}` }
    } as unknown as ItemPrices;
  }
}

// 뮤턴트 제작 손익 계산 함수
function calculateMutantProfit(itemPrices: ItemPrices) {
  const rabbitFoot = itemPrices?.['돌연변이 토끼의 발'] || null;
  const plantMucus = itemPrices?.['돌연변이 식물의 점액질'] || null;
  const sasquatchHeart = itemPrices?.['사스콰치의 심장'] || null;
  const mutant = itemPrices?.['뮤턴트'] || null;

  // 오류가 있는지 확인
  const errors = [];
  if (rabbitFoot && 'error' in rabbitFoot) errors.push(`돌연변이 토끼의 발: ${rabbitFoot.error}`);
  if (plantMucus && 'error' in plantMucus) errors.push(`돌연변이 식물의 점액질: ${plantMucus.error}`);
  if (sasquatchHeart && 'error' in sasquatchHeart) errors.push(`사스콰치의 심장: ${sasquatchHeart.error}`);

  if (errors.length > 0) {
    return {
      totalCost: 0,
      profit: 0,
      profitPercentage: 0,
      hasAllPrices: false,
      error: errors.join('\n')
    };
  }

  // 모든 재료와 결과물의 가격 정보가 있는지 확인
  const hasAllPrices = 
    rabbitFoot !== null && !('error' in rabbitFoot) && 
    plantMucus !== null && !('error' in plantMucus) && 
    sasquatchHeart !== null && !('error' in sasquatchHeart);

  if (hasAllPrices) {
    // 제작 비용 계산 (재료 10개, 5개, 3개)
    const materialCost = 
      (rabbitFoot!.avgPrice! * 10) + 
      (plantMucus!.avgPrice! * 5) + 
      (sasquatchHeart!.avgPrice! * 3);

    // 뮤턴트 가격 정보가 있다면 손익 계산
    if (mutant !== null && !('error' in mutant) && mutant.lowestPrice) {
      const mutantPrice = mutant.lowestPrice;
      const profit = mutantPrice - materialCost;
      const profitPercentage = (profit / materialCost) * 100;

      return {
        totalCost: materialCost,
        profit: profit,
        profitPercentage: profitPercentage,
        hasAllPrices: true
      };
    } else {
      // 뮤턴트 가격 정보가 없지만 재료 가격은 있는 경우
      return {
        totalCost: materialCost,
        profit: 0,
        profitPercentage: 0,
        hasAllPrices: true
      };
    }
  } else {
    // 필요한 모든 가격 정보가 없는 경우
    return {
      totalCost: 0,
      profit: 0,
      profitPercentage: 0,
      hasAllPrices: false
    };
  }
}

export default async function TradePage() {
  // 서버 사이드 데이터 가져오기 시도
  let dataFetchFailed = false;
  let itemPrices: ItemPrices = {};
  
  try {
    itemPrices = await fetchItemPrices();
  } catch (error) {
    console.error('서버 컴포넌트 데이터 로딩 오류:', error);
    dataFetchFailed = true;
    itemPrices = sampleData; // 오류 시 샘플 데이터 사용
  }
  
  const profitInfo = calculateMutantProfit(itemPrices);

  // ISO 형식 시간 문자열을 한국 시간대로 변환하는 함수
  const lastUpdated = new Date().toISOString();
  const formattedLastUpdated = formatKSTDateTime(lastUpdated);
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-900 mb-2">
        물물교역
      </h1>
      <div className="text-sm text-amber-600 mb-6">
        마지막 데이터 갱신: {formattedLastUpdated} (5분마다 자동 갱신)
        {dataFetchFailed && <span className="ml-2 text-red-500">(샘플 데이터 표시 중)</span>}
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* 페라 섹션 */}
        <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">페라</h2>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <ul className="divide-y divide-amber-100">
              {/* 뮤턴트 아이템 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">뮤턴트</span>
                  <div className="flex items-center">
                    <Suspense fallback={<div className="text-xs text-amber-500">로딩 중...</div>}>
                      <ItemPriceList 
                        priceInfo={itemPrices?.['뮤턴트'] || null}
                      />
                    </Suspense>
                  </div>
                </div>

                <div className="bg-amber-50/50 rounded p-2 mt-2">
                  <div className="font-medium text-amber-800 mb-1">제작 재료:</div>
                  <ul className="space-y-2">
                    <li className="flex justify-between items-start">
                      <span className="text-amber-700">돌연변이 토끼의 발 × 10</span>
                    </li>
                    <li className="flex justify-between items-start">
                      <span className="text-amber-700">돌연변이 식물의 점액질 × 5</span>
                    </li>
                    <li className="flex justify-between items-start">
                      <span className="text-amber-700">사스콰치의 심장 × 3</span>
                    </li>
                  </ul>
                </div>

                {/* 제작 손익 표시 */}
                <MutantProfitCalculator profitInfo={profitInfo} mutantPrice={itemPrices?.['뮤턴트']?.lowestPrice || 0} />
              </li>

              {/* 돌연변이 토끼의 발 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">돌연변이 토끼의 발</span>
                  <div className="flex items-center">
                    <Suspense fallback={<div className="text-xs text-amber-500">로딩 중...</div>}>
                      <ItemPriceList 
                        priceInfo={itemPrices?.['돌연변이 토끼의 발'] || null}
                      />
                    </Suspense>
                  </div>
                </div>
              </li>

              {/* 돌연변이 식물의 점액질 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">돌연변이 식물의 점액질</span>
                  <div className="flex items-center">
                    <Suspense fallback={<div className="text-xs text-amber-500">로딩 중...</div>}>
                      <ItemPriceList 
                        priceInfo={itemPrices?.['돌연변이 식물의 점액질'] || null}
                      />
                    </Suspense>
                  </div>
                </div>
              </li>

              {/* 사스콰치의 심장 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">사스콰치의 심장</span>
                  <div className="flex items-center">
                    <Suspense fallback={<div className="text-xs text-amber-500">로딩 중...</div>}>
                      <ItemPriceList 
                        priceInfo={itemPrices?.['사스콰치의 심장'] || null}
                      />
                    </Suspense>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>
        
        {/* 칼리다 섹션 */}
        <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">칼리다</h2>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-amber-800">
              칼리다 지역 교역 아이템 데이터가 이곳에 표시됩니다.
            </p>
          </div>
        </section>
        
        {/* 오아시스 섹션 */}
        <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">오아시스</h2>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-amber-800">
              오아시스 지역 교역 아이템 데이터가 이곳에 표시됩니다.
            </p>
          </div>
        </section>
        
        {/* 카루 숲 섹션 */}
        <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h2 className="text-xl font-semibold text-amber-800 mb-4">카루 숲</h2>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-amber-800">
              카루 숲 지역 교역 아이템 데이터가 이곳에 표시됩니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
} 