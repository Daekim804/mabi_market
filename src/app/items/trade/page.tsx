// page.tsx - Server Component
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { formatKSTDateTime } from '@/utils/price';
import ItemPriceList from './components/ItemPriceList';
import MutantProfitCalculator from './components/MutantProfitCalculator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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

// 서버 컴포넌트에서 데이터 가져오기
async function fetchItemPrices() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('환경 변수 오류: Supabase 접속 정보가 없습니다');
      console.log('샘플 데이터 사용 중...');
      return sampleData; // 환경 변수 없을 때 샘플 데이터 반환
    }

    // 커스텀 fetch 함수 생성
    const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        next: { revalidate },
        cache: 'no-store' 
      });
    };

    // Supabase 클라이언트 초기화
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { fetch: customFetch }
    });

    console.log('Supabase 클라이언트 생성 성공');

    const items = ['돌연변이 토끼의 발', '돌연변이 식물의 점액질', '사스콰치의 심장', '뮤턴트'];
    const prices: ItemPrices = {};
    let hasError = false;

    for (const item of items) {
      try {
        console.log(`${item} 데이터 요청 시작`);
        
        const { data, error } = await supabase
          .from('auction_list')
          .select('auction_price_per_unit, item_count, collected_at')
          .eq('item_name', item)
          .order('auction_price_per_unit', { ascending: true })
          .limit(10);

        if (error) {
          console.error(`${item} 데이터 오류:`, error);
          hasError = true;
          continue;
        }

        if (!data || data.length === 0) {
          console.log(`${item} 데이터 없음`);
          prices[item] = null;
          continue;
        }

        console.log(`${item} 데이터 ${data.length}개 조회 성공`);

        // AuctionData를 PriceItem 형식으로 변환
        const priceItems = data.map(item => ({
          price: item.auction_price_per_unit,
          count: item.item_count
        }));

        // 가중 평균 가격 계산
        const totalItems = priceItems.reduce((sum, item) => sum + item.count, 0);
        const totalValue = priceItems.reduce((sum, item) => sum + (item.price * item.count), 0);
        const weightedAvg = totalValue / totalItems;

        // 정수로 반올림된 가격 값 사용
        const roundedAvgPrice = Math.round(weightedAvg);
        const roundedLowestPrice = Math.round(data[0].auction_price_per_unit);

        // 가장 최근 수집 시간 찾기
        const latestCollectedAt = data.reduce((latest, current) => {
          const currentDate = new Date(current.collected_at);
          const latestDate = new Date(latest);
          return currentDate > latestDate ? current.collected_at : latest;
        }, data[0].collected_at);

        // 가격 목록도 정수로 반올림
        const roundedPriceList = priceItems.map(item => ({
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
        hasError = true;
        prices[item] = null;
      }
    }

    // 데이터 조회 중 오류가 발생했거나 데이터가 없는 경우 샘플 데이터로 대체
    if (hasError || Object.keys(prices).length === 0) {
      console.log('데이터 조회 오류 또는 데이터 없음, 샘플 데이터 사용');
      
      // 실제 데이터와 샘플 데이터 병합
      const mergedData = { ...sampleData };
      
      // 실제 가져온 데이터가 있으면 덮어쓰기
      Object.keys(prices).forEach(item => {
        if (prices[item] !== null) {
          mergedData[item] = prices[item];
        }
      });
      
      return mergedData;
    }

    return prices;
  } catch (err) {
    console.error('가격 정보를 가져오는 중 오류가 발생했습니다:', err);
    console.log('샘플 데이터 사용 중...');
    return sampleData; // 오류 발생 시 샘플 데이터 반환
  }
}

// 백업 방식으로 데이터 가져오기 - 원래 방식 실패 시 사용
async function fetchItemPricesBackup() {
  try {
    console.log('백업 데이터 가져오기 시작');
    // 백업 방식: 환경 변수에서 직접 값 가져오기
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('백업 방식도 실패: 환경 변수 없음');
      return sampleData;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: { 
        headers: { 'X-Client-Info': 'backup-method' }
      }
    });

    // 백업 코드에서는 simplified한 쿼리 수행
    const items = ['돌연변이 토끼의 발', '돌연변이 식물의 점액질', '사스콰치의 심장', '뮤턴트'];
    const prices = { ...sampleData }; // 미리 샘플 데이터로 초기화

    for (const item of items) {
      try {
        const { data, error } = await supabase
          .from('auction_list')
          .select('auction_price_per_unit, item_count, collected_at')
          .eq('item_name', item)
          .limit(5);

        if (error || !data || data.length === 0) continue;

        // 가장 낮은 가격 찾기
        const lowestPrice = Math.min(
          ...data.map(item => item.auction_price_per_unit)
        );

        // 평균 가격 계산 (단순 평균)
        const avgPrice = data.reduce(
          (sum, item) => sum + item.auction_price_per_unit, 0
        ) / data.length;

        prices[item] = {
          avgPrice: Math.round(avgPrice),
          lowestPrice: Math.round(lowestPrice),
          totalItems: data.length,
          collectedAt: new Date().toISOString(),
          priceList: data.map(item => ({
            price: Math.round(item.auction_price_per_unit),
            count: item.item_count
          }))
        };
      } catch (err) {
        console.error(`백업 방식도 실패: ${item}`, err);
        // 이미 샘플 데이터로 초기화되어 있으므로 조치 불필요
      }
    }

    return prices;
  } catch (err) {
    console.error('백업 데이터 가져오기 실패:', err);
    return sampleData;
  }
}

// 뮤턴트 제작 손익 계산 함수
function calculateMutantProfit(itemPrices: ItemPrices) {
  const rabbitFoot = itemPrices?.['돌연변이 토끼의 발'] || null;
  const plantMucus = itemPrices?.['돌연변이 식물의 점액질'] || null;
  const sasquatchHeart = itemPrices?.['사스콰치의 심장'] || null;
  const mutant = itemPrices?.['뮤턴트'] || null;

  // 모든 재료와 결과물의 가격 정보가 있는지 확인
  const hasAllPrices = 
    rabbitFoot !== null && 
    plantMucus !== null && 
    sasquatchHeart !== null;

  if (hasAllPrices) {
    // 제작 비용 계산 (재료 10개, 5개, 3개)
    const materialCost = 
      (rabbitFoot!.avgPrice * 10) + 
      (plantMucus!.avgPrice * 5) + 
      (sasquatchHeart!.avgPrice * 3);

    // 뮤턴트 가격 정보가 있다면 손익 계산
    if (mutant !== null) {
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
  try {
    let priceData;
    
    // 첫 번째 방식으로 데이터 가져오기 시도
    try {
      priceData = await fetchItemPrices();
    } catch (err) {
      console.error('기본 데이터 로딩 실패, 백업 방식 시도:', err);
      priceData = await fetchItemPricesBackup();
    }

    const mutantProfit = calculateMutantProfit(priceData);

    return (
      <ErrorBoundary>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-amber-900 mb-6">
            물물교역 가격 정보
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* 뮤턴트 제작 손익 */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <h2 className="text-xl font-semibold text-amber-900 mb-4">뮤턴트 제작 손익</h2>
              <MutantProfitCalculator profitData={mutantProfit} />
            </div>

            {/* 재료 시세 현황 */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <h2 className="text-xl font-semibold text-amber-900 mb-4">재료 시세</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-amber-800">돌연변이 토끼의 발 (10개)</h3>
                  <ItemPriceList priceInfo={priceData['돌연변이 토끼의 발']} />
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">돌연변이 식물의 점액질 (10개)</h3>
                  <ItemPriceList priceInfo={priceData['돌연변이 식물의 점액질']} />
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">사스콰치의 심장 (5개)</h3>
                  <ItemPriceList priceInfo={priceData['사스콰치의 심장']} />
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">뮤턴트 (1개)</h3>
                  <ItemPriceList priceInfo={priceData['뮤턴트']} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('TradePage 렌더링 오류:', error);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-amber-800 mb-2">데이터 로딩 오류</h1>
          <p className="text-amber-700">
            가격 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </div>
    );
  }
} 