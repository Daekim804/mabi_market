interface PriceItem {
  price: number;
  count: number;
}

/**
 * 수량을 고려한 가중 평균 가격을 계산합니다.
 * @param items 가격과 수량 정보를 담은 배열
 * @param priceKey 가격 정보가 담긴 키 이름 (기본값: 'price')
 * @param countKey 수량 정보가 담긴 키 이름 (기본값: 'count')
 * @returns 가중 평균 가격과 총 수량을 반환합니다.
 */
export function calculateWeightedAverage(
  items: PriceItem[],
  priceKey: keyof PriceItem,
  countKey: keyof PriceItem
): { weightedAvg: number; totalCount: number } {
  const totalCount = items.reduce((sum, item) => sum + item[countKey], 0);
  const weightedSum = items.reduce((sum, item) => sum + (item[priceKey] * item[countKey]), 0);
  const weightedAvg = totalCount > 0 ? weightedSum / totalCount : 0;

  return { weightedAvg, totalCount };
}

/**
 * 가격 정보를 포맷팅합니다.
 * @param price 가격
 * @returns 천 단위 구분자가 포함된 문자열
 */
export function formatPrice(price: number): string {
  // 소수점 없이 정수만 표시
  return Math.round(price).toLocaleString('ko-KR');
}

/**
 * 최저가를 찾습니다.
 * @param items 가격 정보를 담은 배열
 * @returns 최저가
 */
export function findLowestPrice(items: PriceItem[]): number {
  return Math.min(...items.map(item => item.price));
}

/**
 * UTC 날짜를 한국 시간(KST)으로 변환하여 포맷팅합니다.
 * @param utcDate UTC 기준 날짜 문자열
 * @returns "YYYY.MM.DD HH:mm" 형식의 한국 시간 문자열
 */
export function formatKSTDateTime(utcDate: string): string {
  const date = new Date(utcDate);
  
  // UTC 시간에 한국 시간대(+9시간) 적용
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  
  // 로컬 시간으로 포맷팅 (이미 KST로 변환했으므로 UTC 메서드 대신 일반 메서드 사용)
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  const hours = String(kstDate.getHours()).padStart(2, '0');
  const minutes = String(kstDate.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day} ${hours}:${minutes}`;
} 