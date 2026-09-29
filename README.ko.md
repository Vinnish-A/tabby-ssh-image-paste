> This is the original upstream documentation. For this fork’s installation instructions, see [README.md](README.md).

# Tabby SSH Image Clipboard

[![npm version](https://badge.fury.io/js/tabby-ssh-image-clipboard.svg)](https://www.npmjs.com/package/tabby-ssh-image-clipboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Tabby](https://tabby.sh) 터미널에서 클립보드 이미지를 SFTP로 원격 SSH 서버에 바로 붙여넣기.

![Demo](https://raw.githubusercontent.com/coderredlab/tabby-ssh-image-clipboard/main/demo.gif)

## 왜 필요한가?

원격 서버에서 **Claude Code**나 **OpenCode** 같은 AI 코딩 어시스턴트를 사용할 때, 스크린샷 공유가 번거롭습니다. SCP/SFTP로 직접 업로드하고, 경로를 찾아서 입력해야 하죠. 이 플러그인은 그 과정을 모두 없애줍니다 — 이미지를 복사하고 붙여넣기만 하면 됩니다.

## 기능

- **원키 붙여넣기** — `Ctrl+Shift+V` (Tabby 기본 붙여넣기 단축키)로 클립보드 이미지를 SFTP 업로드하고 따옴표로 감싼 파일 경로를 터미널에 출력
- **스마트 감지** — 클립보드에 이미지가 있을 때만 동작. 이미지가 없으면 일반 텍스트 붙여넣기가 그대로 수행됨
- **설정 불필요** — SFTP를 지원하는 SSH 연결이면 바로 사용 가능
- **분할 탭 지원** — Tabby의 분할 화면 레이아웃에서도 활성 SSH 세션을 정확하게 감지
- **알림 설정 가능** — 성공/실패 알림을 설정에서 켜고 끌 수 있음

## 동작 원리

1. SSH 탭에서 `Ctrl+Shift+V`를 누름
2. 플러그인이 클립보드에 이미지가 있는지 확인
3. 이미지가 있으면: PNG로 변환 → SFTP로 `/tmp/clipboard_<timestamp>.png`에 업로드 → 따옴표로 감싼 경로를 터미널에 입력
4. 이미지가 없으면: Tabby의 일반 텍스트 붙여넣기로 넘김

업로드된 이미지 경로는 자동으로 따옴표로 감싸져서 (예: `"/tmp/clipboard_1234567890.png"`) CLI 도구나 AI 어시스턴트의 인자로 바로 사용할 수 있습니다.

## 설치

### Tabby 플러그인 매니저에서 (권장)

1. Tabby 설정 열기
2. **Plugins**로 이동
3. `tabby-ssh-image-clipboard` 검색
4. **Install** 클릭
5. Tabby 재시작

### npm에서

```bash
npm install -g tabby-ssh-image-clipboard
```

### 소스에서 빌드

```bash
git clone https://github.com/coderredlab/tabby-ssh-image-clipboard.git
cd tabby-ssh-image-clipboard
npm install
npm run build
```

빌드 후 Tabby 플러그인 디렉토리에 링크:

**Windows:**
```bash
npm link
cd %APPDATA%\tabby\plugins
npm link tabby-ssh-image-clipboard
```

**macOS/Linux:**
```bash
npm link
cd ~/.config/tabby/plugins
npm link tabby-ssh-image-clipboard
```

링크 후 Tabby를 재시작해 주세요.

## 사용법

1. Tabby에서 SSH 서버에 연결
2. 이미지를 클립보드에 복사 (스크린샷, 브라우저 이미지 등)
3. `Ctrl+Shift+V` 누르기
4. 이미지가 원격 서버의 `/tmp/clipboard_<timestamp>.png`에 업로드됨
5. 따옴표로 감싼 파일 경로가 터미널에 표시되어 바로 사용 가능

### Claude Code와 함께 사용하는 예시

```
$ claude
> 에러 스크린샷이야: "/tmp/clipboard_1707500000000.png"
```

## 설정

Tabby 설정 → **Plugins** → **Clipboard Sync**:

| 설정 항목 | 기본값 | 설명 |
|-----------|--------|------|
| **Enabled** | `true` | 플러그인 활성화/비활성화 |
| **Show Notifications** | `true` | 성공/실패 토스트 알림 표시 |

## 요구사항

- Tabby 1.0.x 이상
- SFTP를 지원하는 SSH 서버
- 쓰기 가능한 `/tmp/` 디렉토리가 있는 원격 서버 (Linux/macOS)

## 문제 해결

### 이미지 붙여넣기가 안 될 때

- 활성 SSH 탭에 있는지 확인 (로컬 터미널이 아닌지)
- SSH 연결이 SFTP를 지원하는지 확인
- 설정 → Plugins → Clipboard Sync에서 플러그인이 활성화되어 있는지 확인

### Ctrl+Shift+V를 눌러도 아무 일도 안 일어날 때

- 클립보드에 이미지가 없으면 Tabby가 일반 텍스트 붙여넣기를 수행함 — 정상 동작임
- SSH 세션이 완전히 연결되었는지 확인 (셸 프롬프트가 뜰 때까지 대기)

### 원격 서버에서 권한 거부될 때

- 원격 서버의 `/tmp/` 디렉토리에 쓰기 권한이 있는지 확인
- 보안이 강화된 서버에서는 SFTP 접근이 제한될 수 있음

## 소스에서 빌드

```bash
npm install          # 의존성 설치
npm run build        # 프로덕션 빌드 → dist/index.js
npm run watch        # 파일 감시 모드로 개발 빌드
npm run lint         # ESLint 실행
```

## 라이선스

MIT
