// 내 위치 위도 경도 반환하기

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// readline 인터페이스 생성 
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// API 호출 함수
async function fetchKakaoLocation(query) {
    const apiKey = process.env.API_KEY; // 카카오 API 키
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${query}`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });
  
    if (response.ok) {
      const data = await response.json();
      return data.documents; // 장소 데이터 반환
    } else {
      console.error('API 호출 실패:', response.status);
      return [];
    }
  }
  
// 사용자 입력을 받아 검색 후 위치 정보를 JSON 파일에 저장
rl.question('검색하고 싶은 주소를 입력하세요: ', (myPlace) => {
  fetchKakaoLocation(myPlace)
    .then(locations => {
      if (locations.length === 0) {
        console.log('검색 결과가 없습니다.');
        process.exit(1);  // 검색 결과가 없으면 종료 코드 1 반환
      } else {
        // 첫 번째 검색 결과의 위도(lat), 경도(lng)를 저장
        const location = locations[0];
        const lat = location.y;
        const lng = location.x;
        
        // JSON 파일로 저장
        const outputDir = path.join(__dirname, '../output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        const locationPath = path.join(outputDir, 'location.json');
        fs.writeFileSync(locationPath, JSON.stringify({ lat, lng }), 'utf8');
        console.log(`위도: ${lat}, 경도: ${lng} - location.json에 저장되었습니다.`);
        process.exit(0);  // 성공적으로 검색했으므로 종료 코드 0 반환
      }
    })
    .catch(error => {
      console.error('Error fetching location:', error);
      rl.close(); // 오류 발생 시에도 인터페이스 종료
      process.exit(1);  // 오류 발생 시 종료 코드 1 반환
    });
});