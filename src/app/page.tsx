import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-50 -z-10 rounded-3xl" />
        <h1 className="text-4xl font-black tracking-tight text-amber-900 sm:text-6xl">
          🍯 꿀통노기
        </h1>
        <p className="mt-6 text-lg leading-8 text-amber-800">
          실시간 경매장 데이터를 기반으로 아이템 생산 효율을 분석하고 최적의 제작 방법을 찾아보세요.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/items"
            className="rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition-colors"
          >
            제작효율 계산하기
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold tracking-tight text-amber-900">
          주요 기능
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 hover:bg-amber-100 transition-colors">
            <h3 className="text-lg font-semibold text-amber-900">재료 시세 확인</h3>
            <p className="mt-2 text-amber-800">
              제작에 필요한 모든 재료들의 실시간 시세를 한 번에 확인할 수 있습니다.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 hover:bg-amber-100 transition-colors">
            <h3 className="text-lg font-semibold text-amber-900">제작 손익 계산</h3>
            <p className="mt-2 text-amber-800">
              재료비와 제작 결과물의 시세를 비교하여 예상 수익을 계산해드립니다.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 hover:bg-amber-100 transition-colors">
            <h3 className="text-lg font-semibold text-amber-900">효율적인 제작법</h3>
            <p className="mt-2 text-amber-800">
              제작 성공률과 회당 제작량을 고려한 최적의 제작 방법을 추천해드립니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

async function fetchRabbitFootPrice() {
  try {
    const response = await fetch('/api/items/price?name=돌연변이 토끼의 발');
    const data = await response.json();
    if (data.avgPrice) {
      setRabbitFootPrice(Math.round(data.avgPrice));
      setLastUpdated(new Date().toLocaleString());
    }
  } catch (error) {
    setError('가격 정보를 불러오는데 실패했습니다');
  } finally {
    setIsLoading(false);
  }
}
