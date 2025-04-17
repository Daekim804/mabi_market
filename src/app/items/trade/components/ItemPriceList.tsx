'use client';

import { useState } from 'react';
import { formatKSTDateTime } from '@/utils/price';

interface PriceItemProps {
  price: number;
  count: number;
}

interface PriceData {
  avgPrice: number;
  lowestPrice: number;
  totalItems: number;
  collectedAt: string;
  priceList: Array<PriceItemProps>;
}

interface ItemPriceListProps {
  itemName: string;
  priceInfo: PriceData | null;
}

export default function ItemPriceList({ itemName, priceInfo }: ItemPriceListProps) {
  const [showPriceList, setShowPriceList] = useState<boolean>(false);
  
  const togglePriceList = () => {
    setShowPriceList(!showPriceList);
  };
  
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
        onClick={togglePriceList}
        className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center justify-end w-full"
      >
        <span className="mr-1">{showPriceList ? '▼' : '▶'}</span>
        시세 목록 {showPriceList ? '접기' : '펼치기'} (최저가 기준 10개 항목)
      </button>
      {showPriceList && (
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
} 