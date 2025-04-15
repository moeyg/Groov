# Groov ♪

<div align="center">
  <a href="#preview">
    <img src="https://github.com/user-attachments/assets/022646ec-e232-4ba6-b3d4-e1088386ef3b" width=100%>
  </a>
  <br />
</div>

<br>

## Information

가상의 음원 사이트 Groov 에서 음원 감상을 즐길 수 있는 웹 어플리케이션 입니다. 🎧 <br />

<br>

## Tech Stack

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)

<br>

## <a name="features">Features</a>

### 🎶 음원 재생

- 사용자는 음원을 선택해 재생할 수 있습니다.
- 다음 버튼과 이전 버튼을 활용하여 음원을 이동할 수 있습니다.
- 음원 타임라인을 클릭하여 원하는 지점으로 이동할 수 있습니다.

### 💿 음원 업로드

- 자신만의 음원을 업로드하여 공유할 수 있습니다.

### 💵 음원 다운로드

- 소정의 금액을 지불하여 음원을 다운로드 할 수 있습니다.
- 카카오페이로 결제가 가능합니다.

### 📱 동적 UI 업데이트

- 뒤로가기 버튼을 활용하여 이전 페이지로 이동할 수 있습니다.
- 기기의 화면 크기에 따라 달라지는 반응형 모델을 구현했습니다.

<br>

## <a name="preview">Preview</a>

<div align="center">

|                                                         메인                                                          |
| :-------------------------------------------------------------------------------------------------------------------: |
| <img width="80%" alt="Image" src="https://github.com/user-attachments/assets/b687cb9b-7554-42c6-960d-535d2b453416" /> |

|                                                      마이 페이지                                                      |
| :-------------------------------------------------------------------------------------------------------------------: |
| <img width="80%" alt="Image" src="https://github.com/user-attachments/assets/ccfcf32c-8a0f-4d81-ab70-894f3007bff5" /> |

|                                           음원 디테일: 재생하기 / 다운로드                                            |
| :-------------------------------------------------------------------------------------------------------------------: |
| <img width="80%" alt="Image" src="https://github.com/user-attachments/assets/d868a3d7-f28a-48e3-b457-a0a694d7eec9" /> |

|                                                      음원 업로드                                                      |
| :-------------------------------------------------------------------------------------------------------------------: |
| <img width="80%" alt="Image" src="https://github.com/user-attachments/assets/b950e238-05c6-40b3-87f4-0d9c61b37f46" /> |

|                                                       음원 검색                                                       |
| :-------------------------------------------------------------------------------------------------------------------: |
| <img width="80%" alt="Image" src="https://github.com/user-attachments/assets/25231534-35ae-4655-8431-80e93b3cc0af" /> |

</div>

<br>

## <a name="trouble-shooting">Trouble Shooting</a>

### ⚡️ seekBar가 정상적으로 음원의 진행 상황을 반영하지 못 하는 이슈

#### 1️⃣ 초기 구현

- `useEffect`를 사용하여 `setTimeout`으로 seekBar와 시간을 업데이트하였다. <br>
- 음원의 `currentTime`과 `duration`을 기반으로 슬라이더 너비와 시간 정보를 계산하였다.
- <b>실패 이유 ✅</b>:
  - `audioRef.current`와 `seekBar.current`가 `null` 일 때 처리하지 않있다.
  - `setTimeout`을 사용하여 반복적으로 슬라이더와 시간을 업데이트 하는 방식이 비효율적이다.
  - `audioRef.current.duration`이 `NaN`일 수 있는 경우를 처리하지 않았다.

#### 2️⃣ 개선된 접근 방법

- `audioRef.current`와 `seekBar.current`가 `null`인지 확인하였다.
- `setInterval`을 사용하여 1초마다 슬라이더와 시간을 업데이트하였다.
- `duration` 값이 `NaN` 또는 `0` 이하일 경우를 처리하였다.
- <b>실패 이유 ✅</b>:
  - `setInterval`은 오디오 재생이 아닌 시간 간격으로 슬라이더와 시간을 업데이트하므로, 재생 중이 아닌 경우에도 타이머가 작동하였다. <br>
  - `setInterval`을 사용한 반복적 업데이트는 비효율적이고, 필요하지 않을 때도 CPU 리소스를 소비하였다.

#### 4️⃣ 최종 성공 접근 방법

- `audioRef.current`와 `seekBar.current`가 `null`인지 확인하였다.
- 오디오의 `timeupdate` 이벤트 리스너를 사용하여 슬라이더와 시간을 업데이트하였다.
- `duration` 값이 `NaN` 또는 `0` 이하일 경우를 처리하였다.
- `useEffect`를 사용하여 컴포넌트가 언마운트 될 때 이벤트 리스너를 제거하였다.
- <b>성공 이유 ✅</b>:
  - `timeupdate` 이벤트는 오디오의 재생 중에만 슬라이더와 시간을 업데이트하므로, 불필요한 반복 작업을 피할 수 있었다.
  - `null` 체크와 `NaN` 처리로 오류를 방지하였다.
  - `useEffect`의 정리 함수로 이벤트 리스너를 제거하여 메모리 누수를 방지하였다.
