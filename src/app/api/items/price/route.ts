import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculateWeightedAverage } from '@/utils/price';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemName = searchParams.get('name');

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
      console.error('Supabase 쿼리 에러:', error.message, error.details, error.hint);
      return NextResponse.json(
        { error: `데이터베이스 조회 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { 
          error: '가격 정보를 찾을 수 없습니다',
          itemName: itemName,
          message: '아직 데이터가 수집되지 않았습니다.'
        }, 
        { status: 404 }
      );
    }

    // 가중 평균 가격 계산
    const { weightedAvg, totalCount } = calculateWeightedAverage(
      data,
      'auction_price_per_unit',
      'item_count'
    );

    // 응답에 추가 정보 포함
    return NextResponse.json({
      itemName: itemName,
      avgPrice: weightedAvg,
      lowestPrice: data[0].auction_price_per_unit,
      totalItems: totalCount,
      collectedAt: data[0].collected_at,
      priceList: data.map(item => ({
        price: item.auction_price_per_unit,
        count: item.item_count
      }))
    });
  } catch (error: any) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
} 