import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculateWeightedAverage } from '@/utils/price';

// 서비스 역할 키를 사용하여 더 높은 권한으로 Supabase에 접근
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuctionData {
  auction_price_per_unit: number;
  item_count: number;
  collected_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemName = searchParams.get('itemName');

    console.log('요청된 아이템:', itemName);

    if (!itemName) {
      return NextResponse.json({ error: '아이템 이름이 필요합니다' }, { status: 400 });
    }

    // auction_list에서 해당 아이템의 최저가 10개 항목 조회
    const { data, error } = await supabase
      .from('auction_list')
      .select('auction_price_per_unit, item_count, collected_at')
      .eq('item_name', itemName)
      .order('auction_price_per_unit', { ascending: true })
      .limit(10);

    console.log('쿼리 결과:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: '데이터를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '가격 정보가 없습니다.' }, { status: 404 });
    }

    const auctionData = data as AuctionData[];

    // AuctionData를 PriceItem 형식으로 변환
    const priceItems = auctionData.map(item => ({
      price: item.auction_price_per_unit,
      count: item.item_count
    }));

    // 가중 평균 가격 계산
    const { weightedAvg, totalCount } = calculateWeightedAverage(
      priceItems,
      'price',
      'count'
    );

    // 정수로 반올림된 가격 값 사용
    const roundedAvgPrice = Math.round(weightedAvg);
    const roundedLowestPrice = Math.round(auctionData[0].auction_price_per_unit);

    // 가장 최근 수집 시간 찾기
    const latestCollectedAt = auctionData.reduce((latest, current) => {
      const currentDate = new Date(current.collected_at);
      const latestDate = new Date(latest);
      return currentDate > latestDate ? current.collected_at : latest;
    }, auctionData[0].collected_at);

    // 가격 목록도 정수로 반올림
    const roundedPriceList = priceItems.map(item => ({
      price: Math.round(item.price),
      count: item.count
    }));

    // 응답에 추가 정보 포함
    return NextResponse.json({
      itemName: itemName,
      avgPrice: roundedAvgPrice,
      lowestPrice: roundedLowestPrice,
      totalItems: totalCount,
      collectedAt: latestCollectedAt,
      priceList: roundedPriceList
    });
  } catch (error: unknown) {
    console.error('API 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
} 