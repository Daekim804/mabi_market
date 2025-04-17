This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 마비노기 경매장 분석

이 프로젝트는 마비노기 게임 내 경매장 아이템 가격을 분석하고 제작 손익을 계산해주는 웹 애플리케이션입니다.

### 주요 기능

- 경매장 아이템 실시간 가격 정보 조회
- 제작 아이템의 손익 분석
- 5분마다 자동 데이터 갱신

## 개발자 가이드

### 코드 품질 관리

개발에 참여하기 전 [개발자 가이드라인](./CONTRIBUTING.md)을 반드시 확인해주세요. 주요 내용:

- **미사용 변수 오류 방지**: 변수를 선언한 후 사용하지 않으면 빌드 오류가 발생합니다.
- **TypeScript 규칙**: 코드 컨벤션과 타입 정의 방법에 대한 가이드라인을 따라주세요.
- **서버 컴포넌트 사용법**: Next.js 서버 컴포넌트 작업 시 주의사항을 확인하세요.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a font designed by Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
