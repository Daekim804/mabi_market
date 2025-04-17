// page.tsx - Server Component
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
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
}

interface ItemPrices {
  [key: string]: PriceData | null;
}

// 서버 컴포넌트에서 데이터 가져오기
async function fetchItemPrices() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('환경 변수 오류: Supabase 접속 정보가 없습니다');
      return {};
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { fetch: fetch }
    });

    const items = ['돌연변이 토끼의 발', '돌연변이 식물의 점액질', '사스콰치의 심장', '뮤턴트'];
    const prices: ItemPrices = {};

    for (const item of items) {
      try {
        const { data, error } = await supabase
          .from('auction_list')
          .select('auction_price_per_unit, item_count, collected_at')
          .eq('item_name', item)
          .order('auction_price_per_unit', { ascending: true })
          .limit(10);

        if (error) {
          console.error(`${item} 데이터 오류:`, error);
          continue;
        }

        if (!data || data.length === 0) {
          prices[item] = null;
          continue;
        }

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
        prices[item] = null;
      }
    }

    return prices;
  } catch (err) {
    console.error('가격 정보를 가져오는 중 오류가 발생했습니다:', err);
    return {};
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
  // 서버 컴포넌트에서 데이터 가져오기
  const itemPrices = await fetchItemPrices();
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
                        itemName="뮤턴트" 
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
                        itemName="돌연변이 토끼의 발" 
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
                        itemName="돌연변이 식물의 점액질" 
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
                        itemName="사스콰치의 심장" 
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