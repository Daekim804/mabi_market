'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl font-extrabold text-amber-900 mb-6">마비노기 경매장 분석</h1>
        <p className="text-xl text-amber-800 max-w-3xl mx-auto">
          마비노기 경매장 시세를 분석하고 제작 손익을 계산해보세요.
        </p>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Link 
          href="/items/trade" 
          className="bg-amber-50 hover:bg-amber-100 p-6 rounded-xl border border-amber-200 transition duration-200"
        >
          <div className="flex items-center mb-4">
            <div className="bg-amber-200 p-3 rounded-lg mr-4">
              <Image src="/file.svg" alt="Trade icon" width={24} height={24} />
            </div>
            <h2 className="text-xl font-semibold text-amber-900">물물교역</h2>
          </div>
          <p className="text-amber-800">
            다양한 아이템의 실시간 시세를 확인하고 제작 손익을 계산해보세요.
          </p>
        </Link>
        
        <Link 
          href="/items/skills" 
          className="bg-amber-50 hover:bg-amber-100 p-6 rounded-xl border border-amber-200 transition duration-200"
        >
          <div className="flex items-center mb-4">
            <div className="bg-amber-200 p-3 rounded-lg mr-4">
              <Image src="/globe.svg" alt="Skills icon" width={24} height={24} />
            </div>
            <h2 className="text-xl font-semibold text-amber-900">스킬</h2>
          </div>
          <p className="text-amber-800">
            스킬 관련 아이템의 시세와 스킬 훈련 비용을 비교해보세요.
          </p>
        </Link>
      </section>
    </div>
  );
}
