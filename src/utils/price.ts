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
export function calculateWeightedAverage<T extends Record<string, any>>(
  items: T[],
  priceKey: keyof T = 'price' as keyof T,
  countKey: keyof T = 'count' as keyof T
): { weightedAvg: number; totalCount: number } {
  if (!items || items.length === 0) {
    return { weightedAvg: 0, totalCount: 0 };
  }

  const totalCount = items.reduce((sum, item) => sum + Number(item[countKey]), 0);
  const weightedSum = items.reduce(
    (sum, item) => sum + Number(item[priceKey]) * Number(item[countKey]),
    0
  );

  return {
    weightedAvg: totalCount > 0 ? Math.round(weightedSum / totalCount) : 0,
    totalCount
  };
}

/**
 * 가격 정보를 포맷팅합니다.
 * @param price 가격
 * @returns 천 단위 구분자가 포함된 문자열
 */
export function formatPrice(price: number): string {
  return price.toLocaleString();
}

/**
 * 최저가를 찾습니다.
 * @param items 가격 정보를 담은 배열
 * @param priceKey 가격 정보가 담긴 키 이름 (기본값: 'price')
 * @returns 최저가
 */
export function findLowestPrice<T extends Record<string, any>>(
  items: T[],
  priceKey: keyof T = 'price' as keyof T
): number {
  if (!items || items.length === 0) return 0;
  return Math.min(...items.map(item => Number(item[priceKey])));
}

/**
 * UTC 날짜를 한국 시간(KST)으로 변환하여 포맷팅합니다.
 * @param utcDate UTC 기준 날짜 문자열
 * @returns "YYYY.MM.DD HH:mm" 형식의 한국 시간 문자열
 */
export function formatKSTDateTime(utcDate: string): string {
  try {
    // 문자열 형식에 따라 다르게 처리
    let dateObj;
    if (utcDate.includes(' ') && !utcDate.includes('T')) {
      // PostgreSQL 형식 (YYYY-MM-DD HH:MM:SS)
      const [datePart, timePart] = utcDate.split(' ');
      
      // 각 부분 추출
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      // UTC Date 객체 생성
      dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    } else {
      // 기본 ISO 형식
      dateObj = new Date(utcDate);
    }
    
    // 한국 시간(KST)으로 변환 (UTC+9)
    const kstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
    
    // 포맷팅
    const kstYear = kstDate.getFullYear();
    const kstMonth = String(kstDate.getMonth() + 1).padStart(2, '0');
    const kstDay = String(kstDate.getDate()).padStart(2, '0');
    const kstHours = String(kstDate.getHours()).padStart(2, '0');
    const kstMinutes = String(kstDate.getMinutes()).padStart(2, '0');
    
    return `${kstYear}.${kstMonth}.${kstDay} ${kstHours}:${kstMinutes}`;
  } catch (error) {
    console.error('날짜 변환 중 오류 발생:', error);
    return '날짜 변환 오류';
  }
} 