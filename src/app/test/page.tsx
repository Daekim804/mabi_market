'use client';

import { useState, useEffect } from 'react';

interface DebugInfo {
  status: string;
  environment?: any;
  connection?: any;
  request?: any;
  system?: any;
  recommendations?: string[];
  error?: string;
}

interface ApiTestResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  headers?: any;
}

export default function TestPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [apiTest, setApiTest] = useState<ApiTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 디버그 정보 가져오기
  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  };

  // API 테스트
  const testApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/items/price?itemName=돌연변이 토끼의 발', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      
      setApiTest({
        success: response.ok,
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      setApiTest({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 자동 실행
  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API 연결 테스트</h1>
        
        {/* 현재 환경 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">현재 환경 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>현재 URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </div>
            <div>
              <strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}
            </div>
            <div>
              <strong>현재 시간:</strong> {new Date().toISOString()}
            </div>
            <div>
              <strong>타임존:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </div>

        {/* 디버그 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">디버그 정보</h2>
            <button
              onClick={fetchDebugInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '로딩 중...' : '새로고침'}
            </button>
          </div>
          
          {debugInfo ? (
            <div className="space-y-4">
              <div>
                <strong>상태:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  debugInfo.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.status}
                </span>
              </div>
              
              {debugInfo.environment && (
                <div>
                  <strong>환경 변수:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.environment, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugInfo.connection && (
                <div>
                  <strong>연결 상태:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo.connection, null, 2)}
                  </pre>
                </div>
              )}
              
              {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
                <div>
                  <strong>권장사항:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {debugInfo.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-amber-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {debugInfo.error && (
                <div>
                  <strong>오류:</strong>
                  <div className="mt-2 p-3 bg-red-100 text-red-800 rounded text-sm">
                    {debugInfo.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">디버그 정보를 로딩 중...</div>
          )}
        </div>

        {/* API 테스트 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API 테스트</h2>
            <button
              onClick={testApi}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '테스트 중...' : 'API 테스트 실행'}
            </button>
          </div>
          
          {apiTest ? (
            <div className="space-y-4">
              <div>
                <strong>결과:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  apiTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {apiTest.success ? '성공' : '실패'}
                </span>
                {apiTest.status && (
                  <span className="ml-2 text-sm text-gray-600">
                    (HTTP {apiTest.status})
                  </span>
                )}
              </div>
              
              {apiTest.data && (
                <div>
                  <strong>응답 데이터:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(apiTest.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {apiTest.headers && (
                <div>
                  <strong>응답 헤더:</strong>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(apiTest.headers, null, 2)}
                  </pre>
                </div>
              )}
              
              {apiTest.error && (
                <div>
                  <strong>오류:</strong>
                  <div className="mt-2 p-3 bg-red-100 text-red-800 rounded text-sm">
                    {apiTest.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">API 테스트 버튼을 클릭하여 시작하세요.</div>
          )}
        </div>

        {/* 추가 정보 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">문제 해결 가이드</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 디버그 정보에서 환경 변수 상태를 확인하세요</li>
            <li>• API 테스트에서 실제 fetch 동작을 확인하세요</li>
            <li>• 브라우저 개발자 도구의 Network 탭에서 요청 상세 정보를 확인하세요</li>
            <li>• CORS 오류가 있는지 Console 탭을 확인하세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 