// 내 위치 주변 키워드 검색하여 장소 구해서 현재 디렉터리에 places_data.csv로 저장합니다.

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

const outputDir = path.join(__dirname, '../output'); // output 디렉토리 경로 설정
const locationFile = path.join(outputDir, 'location.json'); // 저장된 위치 파일

// 저장된 위치 파일을 읽어오는 함수
function getLocation() {
  if (fs.existsSync(locationFile)) {
    const data = fs.readFileSync(locationFile, 'utf8');
    return JSON.parse(data); // JSON 데이터를 파싱하여 반환
  } else {
    console.error('위치 파일을 찾을 수 없습니다.');
    return null;
  }
}

// API 호출 함수
async function fetchKakaoPlaces(query, latitude, longitude, radius = 1000) {
    const apiKey = process.env.API_KEY; // 카카오 API 키
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&x=${longitude}&y=${latitude}&radius=${radius}`;
  
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

// 기존 CSV 파일에서 데이터를 읽고 중복 체크하는 함수
function getExistingData(filename) {
  if (fs.existsSync(filename)) {
    const csvData = fs.readFileSync(filename, 'utf8');
    const rows = csvData.trim().split('\n').slice(1); // 헤더 제외
    const existingData = new Set(rows); // 기존 데이터는 Set에 저장하여 중복 체크
    return existingData;
  }
  return new Set(); // 파일이 없을 경우 빈 Set 반환
}

// CSV 형식으로 데이터를 변환하는 함수
function convertToCSV(data) {
  return data.map(place => {
    const name = place.place_name;
    const address = place.road_address_name || place.address_name;
    const lat = place.y;
    const lng = place.x;

    return `"${name}","${address}","${lat}","${lng}"`; // 각 값을 CSV 형식으로 변환
  });
}

// 중복된 데이터를 필터링하는 함수
function filterDuplicates(newData, existingData) {
  return newData.filter(row => !existingData.has(row)); // 기존 데이터에 없는 행만 반환
}

// CSV 파일에 내용 추가하는 함수
function appendToCSVFile(filename, csvRows) {
  const csvData = csvRows.join('\n'); // 배열을 줄바꿈으로 연결
  fs.appendFileSync(filename, csvData + '\n', 'utf8');
  console.log(`${filename} 파일에 중복되지 않은 내용이 추가되었습니다.`);
}

// 사용자 입력을 받아 검색 후 매장 정보 저장
rl.question('검색할 키워드를 입력하세요 (예: 카페): ', (query) => {
  const location = getLocation();

  if (location) {
    const { lat, lng } = location;

    // 데이터 가져오기 및 중복 체크 후 CSV 저장
    fetchKakaoPlaces(query, lat, lng)
      .then(places => {
        if (places.length === 0) {
          console.log("결과가 없습니다.");
        } else {
          const filename = path.join(outputDir, 'places_data.csv');

          // 기존 데이터를 읽어옴
          const existingData = getExistingData(filename);

          // 새 데이터를 CSV 형식으로 변환
          const newCSVRows = convertToCSV(places);

          // 중복된 데이터를 필터링
          const uniqueRows = filterDuplicates(newCSVRows, existingData);

          if (uniqueRows.length > 0) {
            // 파일이 존재하지 않으면 헤더 추가
            if (!fs.existsSync(filename)) {
              const headers = '이름,주소,위도,경도\n'; // CSV 헤더
              fs.writeFileSync(filename, headers, 'utf8'); // 새 파일일 경우 헤더 작성
            }

            // 중복되지 않은 데이터만 추가
            appendToCSVFile(filename, uniqueRows);
          } else {
            console.log('중복된 데이터만 존재하여 추가할 내용이 없습니다.');
          }
        }
        rl.close(); // 입력을 받은 후 인터페이스 종료
      })
      .catch(error => {
        console.error('Error fetching places:', error);
        rl.close(); // 오류 발생 시에도 인터페이스 종료
      });
  } else {
    rl.close(); // 위치 파일이 없을 경우 인터페이스 종료
  }
});