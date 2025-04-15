'use client';

import { useState, useEffect } from 'react';
import { formatKSTDateTime } from '@/utils/price';

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
  [key: string]: PriceData;
}

export default function TradePage() {
  const [itemPrices, setItemPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPriceList, setShowPriceList] = useState<{[key: string]: boolean}>({});
  // 제작 손익 계산용 상태 추가
  const [profitInfo, setProfitInfo] = useState<{
    totalCost: number;
    profit: number;
    profitPercentage: number;
    hasAllPrices: boolean;
  }>({
    totalCost: 0,
    profit: 0,
    profitPercentage: 0,
    hasAllPrices: false
  });

  const fetchAllPrices = async () => {
    setIsLoading(true);
    try {
      const items = ['돌연변이 토끼의 발', '돌연변이 식물의 점액질', '사스콰치의 심장', '뮤턴트'];
      const prices: ItemPrices = {};
      
      for (const item of items) {
        console.log(`${item} 가격 정보 요청...`);
        const response = await fetch(`/api/items/price?itemName=${encodeURIComponent(item)}`);
        console.log(`${item} 응답 상태:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`${item} 데이터:`, data);
          prices[item] = data;
        } else {
          const errorData = await response.json();
          console.error(`${item} 오류:`, errorData);
        }
      }
      
      console.log('모든 가격 정보:', prices);
      setItemPrices(prices);
    } catch (err) {
      console.error('가격 정보를 가져오는 중 오류가 발생했습니다:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 뮤턴트 제작에 필요한 총 비용과 손익을 계산
  useEffect(() => {
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
        (rabbitFoot.avgPrice * 10) + 
        (plantMucus.avgPrice * 5) + 
        (sasquatchHeart.avgPrice * 3);

      // 뮤턴트 가격 정보가 있다면 손익 계산
      if (mutant !== null) {
        const mutantPrice = mutant.lowestPrice;
        const profit = mutantPrice - materialCost;
        const profitPercentage = (profit / materialCost) * 100;

        setProfitInfo({
          totalCost: materialCost,
          profit: profit,
          profitPercentage: profitPercentage,
          hasAllPrices: true
        });
      } else {
        // 뮤턴트 가격 정보가 없지만 재료 가격은 있는 경우
        setProfitInfo({
          totalCost: materialCost,
          profit: 0,
          profitPercentage: 0,
          hasAllPrices: false
        });
      }
    } else {
      // 필요한 모든 가격 정보가 없는 경우
      setProfitInfo({
        totalCost: 0,
        profit: 0,
        profitPercentage: 0,
        hasAllPrices: false
      });
    }
  }, [itemPrices]);

  useEffect(() => {
    fetchAllPrices();
  }, []);

  const togglePriceList = (itemName: string) => {
    setShowPriceList(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // 아이템 가격 정보 표시 컴포넌트
  const ItemPriceDisplay = ({ itemName, priceInfo }: { itemName: string, priceInfo: PriceData | null }) => {
    if (!priceInfo) {
      return (
        <div className="text-amber-700">가격 정보 없음</div>
      );
    }

    return (
      <div>
        <div className="text-amber-700">평균: {Math.round(priceInfo.avgPrice).toLocaleString()} Gold/개</div>
        <div className="text-xs text-amber-600">최저: {Math.round(priceInfo.lowestPrice).toLocaleString()} Gold/개</div>
        <div className="text-xs text-amber-600">총 {Math.round(priceInfo.avgPrice * 10).toLocaleString()} Gold</div>
        <button
          onClick={() => togglePriceList(itemName)}
          className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center justify-end w-full"
        >
          <span className="mr-1">{showPriceList[itemName] ? '▼' : '▶'}</span>
          시세 목록 {showPriceList[itemName] ? '접기' : '펼치기'} (최저가 기준 10개 항목)
        </button>
        {showPriceList[itemName] && (
          <div className="mt-1 text-xs space-y-1 text-amber-500 bg-amber-50/50 p-2 rounded">
            <div className="flex justify-between font-medium border-b border-amber-200 pb-1 mb-1">
              <span>수량</span>
              <span>개당 가격</span>
            </div>
            {priceInfo.priceList.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.count.toLocaleString()}개</span>
                <span>{Math.round(item.price).toLocaleString()} Gold</span>
              </div>
            ))}
          </div>
        )}
        {priceInfo.collectedAt && (
          <div className="text-xs text-amber-500 mt-1">
            데이터 수집: {formatKSTDateTime(priceInfo.collectedAt)}
          </div>
        )}
      </div>
    );
  };

  // 뮤턴트 판매/제작 손익 정보 표시 컴포넌트
  const MutantProfitDisplay = () => {
    const mutant = itemPrices?.['뮤턴트'];
    const mutantPrice = mutant?.lowestPrice || 0;

    if (!profitInfo.hasAllPrices) {
      return (
        <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-200">
          <p className="text-amber-700">재료 가격 정보가 불완전하여 손익을 계산할 수 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-200">
        <h3 className="font-medium text-amber-800 mb-2">뮤턴트 제작 손익 계산</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-amber-700">총 재료 비용:</span>
            <span className="font-medium">{Math.round(profitInfo.totalCost).toLocaleString()} Gold</span>
          </div>
          {mutantPrice > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-amber-700">뮤턴트 최저 판매가:</span>
                <span className="font-medium">{Math.round(mutantPrice).toLocaleString()} Gold</span>
              </div>
              <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                <span className="text-amber-700">예상 {profitInfo.profit >= 0 ? '이익' : '손해'}:</span>
                <span className={`font-medium ${profitInfo.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.round(profitInfo.profit).toLocaleString()} Gold
                  <span className="ml-1 text-xs">
                    ({profitInfo.profit >= 0 ? '+' : ''}{profitInfo.profitPercentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="text-xs text-amber-600 mt-1">
                * 제작 실패율, 추가 비용 등은 고려되지 않았습니다.
              </div>
            </>
          )}
          {mutantPrice === 0 && (
            <div className="text-amber-700">
              뮤턴트 가격 정보가 없어 손익을 계산할 수 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-amber-900 mb-6">
        물물교역
      </h1>
      
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
                    {isLoading ? (
                      <span className="text-xs text-amber-500">로딩 중...</span>
                    ) : (
                      <ItemPriceDisplay 
                        itemName="뮤턴트" 
                        priceInfo={itemPrices?.['뮤턴트'] || null}
                      />
                    )}
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
                {!isLoading && <MutantProfitDisplay />}
              </li>

              {/* 돌연변이 토끼의 발 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">돌연변이 토끼의 발</span>
                  <div className="flex items-center">
                    {isLoading ? (
                      <span className="text-xs text-amber-500">로딩 중...</span>
                    ) : (
                      <ItemPriceDisplay 
                        itemName="돌연변이 토끼의 발" 
                        priceInfo={itemPrices?.['돌연변이 토끼의 발'] || null}
                      />
                    )}
                  </div>
                </div>
              </li>

              {/* 돌연변이 식물의 점액질 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">돌연변이 식물의 점액질</span>
                  <div className="flex items-center">
                    {isLoading ? (
                      <span className="text-xs text-amber-500">로딩 중...</span>
                    ) : (
                      <ItemPriceDisplay 
                        itemName="돌연변이 식물의 점액질" 
                        priceInfo={itemPrices?.['돌연변이 식물의 점액질'] || null}
                      />
                    )}
                  </div>
                </div>
              </li>

              {/* 사스콰치의 심장 */}
              <li className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-800 font-medium">사스콰치의 심장</span>
                  <div className="flex items-center">
                    {isLoading ? (
                      <span className="text-xs text-amber-500">로딩 중...</span>
                    ) : (
                      <ItemPriceDisplay 
                        itemName="사스콰치의 심장" 
                        priceInfo={itemPrices?.['사스콰치의 심장'] || null}
                      />
                    )}
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