'use client';

interface ProfitInfoProps {
  totalCost: number;
  profit: number;
  profitPercentage: number;
  hasAllPrices: boolean;
}

interface MutantProfitCalculatorProps {
  profitData: ProfitInfoProps;
}

export default function MutantProfitCalculator({ profitData }: MutantProfitCalculatorProps) {
  if (!profitData.hasAllPrices) {
    return (
      <div className="bg-amber-50/50 p-3 rounded border border-amber-200">
        <p className="text-amber-700">재료 가격 정보가 불완전하여 손익을 계산할 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/50 p-3 rounded border border-amber-200">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-700">총 재료 비용:</span>
          <span className="font-medium">{Math.round(profitData.totalCost).toLocaleString()} Gold</span>
        </div>
        <div className="flex justify-between border-t border-amber-200 pt-2 mt-1">
          <span className="text-amber-700">예상 {profitData.profit >= 0 ? '이익' : '손해'}:</span>
          <span className={`font-medium ${profitData.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {Math.abs(Math.round(profitData.profit)).toLocaleString()} Gold
            <span className="ml-1 text-xs">
              ({profitData.profit >= 0 ? '+' : ''}{profitData.profitPercentage.toFixed(1)}%)
            </span>
          </span>
        </div>
        <div className="text-xs text-amber-600 mt-1">
          * 제작 실패율, 추가 비용 등은 고려되지 않았습니다.
        </div>
      </div>
    </div>
  );
} 