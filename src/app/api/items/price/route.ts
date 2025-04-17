import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { calculateWeightedAverage } from '@/utils/price';

interface AuctionData {
  auction_price_per_unit: number;
  item_count: number;
  collected_at: string;
}

export async function GET(request: Request) {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('환경 변수 확인:');
    console.log('- SUPABASE_URL 설정됨:', !!supabaseUrl);
    console.log('- SUPABASE_URL 값의 길이:', supabaseUrl?.length);
    console.log('- ANON_KEY 설정됨:', !!supabaseAnonKey);
    console.log('- ANON_KEY 값의 길이:', supabaseAnonKey?.length);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('환경 변수 오류: Supabase 접속 정보가 없습니다');
      return NextResponse.json({ 
        error: '서버 구성 오류: Supabase 접속 정보가 설정되지 않았습니다.',
        details: '환경 변수가 없음' 
      }, { status: 500 });
    }
    
    // 런타임에 Supabase 클라이언트 초기화
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { searchParams } = new URL(request.url);
    const itemName = searchParams.get('itemName');

    console.log('요청된 아이템:', itemName);

    if (!itemName) {
      return NextResponse.json({ error: '아이템 이름이 필요합니다' }, { status: 400 });
    }

    console.log('Supabase 쿼리 시작:', itemName);
    
    try {
      // 테이블 존재 여부 확인 쿼리
      const { data: tableCheck, error: tableError } = await supabase
        .from('auction_list')
        .select('id')
        .limit(1);
        
      if (tableError) {
        console.error('테이블 접근 오류:', JSON.stringify(tableError));
        return NextResponse.json({ 
          error: '데이터베이스 테이블 접근 오류', 
          details: tableError.message
        }, { status: 500 });
      }
      
      console.log('테이블 확인 성공, 레코드 조회 시작');
      
      // 실제 데이터 쿼리
      const { data, error } = await supabase
        .from('auction_list')
        .select('auction_price_per_unit, item_count, collected_at')
        .eq('item_name', itemName)
        .order('auction_price_per_unit', { ascending: true })
        .limit(10);

      console.log('쿼리 결과:', { 
        dataExists: !!data, 
        dataLength: data?.length || 0,
        errorExists: !!error
      });

      if (error) {
        console.error('Supabase error 상세:', JSON.stringify(error));
        return NextResponse.json({ 
          error: '데이터를 가져오는 중 오류가 발생했습니다.',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }

      if (!data || data.length === 0) {
        console.log('데이터 없음:', itemName);
        return NextResponse.json({ 
          error: '가격 정보가 없습니다.',
          itemName: itemName
        }, { status: 404 });
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
  } catch (error: unknown) {
    console.error('API 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `서버 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}