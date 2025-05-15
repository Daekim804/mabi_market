'use client';

interface ProfitInfoProps {
  totalCost: number;
  profit: number;
  profitPercentage: number;
  hasAllPrices: boolean;
  error?: string;
}

interface MutantProfitCalculatorProps {
  profitInfo: ProfitInfoProps;
  mutantPrice: number;
}

export default function MutantProfitCalculator({ profitInfo, mutantPrice }: MutantProfitCalculatorProps) {
  if (profitInfo.error) {
    return (
      <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-200">
        <p className="text-red-600">
          <span>손익 계산을 할 수 없음</span>
          <div className="text-xs mt-1">{profitInfo.error}</div>
        </p>
      </div>
    );
  }

  if (!profitInfo.hasAllPrices) {
    return (
      <div className="mt-4 bg-amber-50 p-3 rounded border border-amber-200">
        <p className="text-red-600">
          <span>재료 가격 정보를 불러올 수 없음</span>
          <div className="text-xs mt-1">일부 또는 모든 재료의 가격 정보가 누락되었습니다.</div>
        </p>
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
          <div className="text-red-600">
            <span>뮤턴트 가격 정보를 불러올 수 없음</span>
            <div className="text-xs mt-1">뮤턴트 가격 정보가 없어 손익을 계산할 수 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
} 