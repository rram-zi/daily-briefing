# Design System

SUN TO DO에서 사용된 디자인 시스템. 다른 서비스에서도 동일하게 재사용할 수 있도록 정리한 문서입니다.

---

## 1. 색상 (Color Tokens)

### 기본 팔레트

```css
:root {
  --grey50:  #f9fafb;
  --grey100: #f2f4f6;
  --grey200: #e5e8eb;
  --grey300: #d1d6db;
  --grey400: #b0b8c1;
  --grey500: #8b95a1;
  --grey600: #6b7684;
  --grey700: #4e5968;
  --grey800: #333d4b;
  --grey850: #262e3a;
  --grey900: #191f28;

  --blue50:  #e8f3ff;
  --blue100: #c9e2ff;
  --blue500: #3182f6;
  --blue600: #2272eb;

  --red50:   #ffeeee;
  --red500:  #f04452;

  --green50:  #edfaf4;
  --green500: #00c471;

  --orange500: #ff6b00;
}
```

### 시맨틱 토큰

```css
:root {
  --surface: #ffffff;   /* 카드, 모달, 사이드바 배경 */
  --bg:      #f2f4f6;   /* 페이지 전체 배경 */
  --border:  #e5e8eb;   /* 구분선, 테두리 */

  --text1: #191f28;     /* 주요 텍스트 */
  --text2: #4e5968;     /* 보조 텍스트 */
  --text3: #8b95a1;     /* 힌트, 레이블, 비활성 */
}
```

### 다크 모드

`<html data-theme="dark">` 속성으로 활성화. grey 팔레트를 역전시키고 시맨틱 토큰을 재정의합니다.

```css
[data-theme="dark"] {
  --grey50:  #191f28;
  --grey100: #333d4b;
  --grey200: #4e5968;
  --grey300: #6b7684;
  --grey400: #8b95a1;
  --grey500: #b0b8c1;
  --grey600: #d1d6db;
  --grey700: #e5e8eb;
  --grey800: #f2f4f6;
  --grey900: #f9fafb;

  --blue50:  #162038;
  --blue100: #1a2d52;

  --surface: #262e3a;
  --bg:      #191f28;
  --border:  #333d4b;

  --text1: #f9fafb;
  --text2: #d1d6db;
  --text3: #8b95a1;
}
```

**다크 모드 플래시 방지**: `<style>` 태그 이전에 인라인 `<script>`로 테마를 즉시 적용합니다.

```html
<script>
  (function(){
    var m = localStorage.getItem('theme') || 'system';
    var dark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  })();
</script>
```

---

## 2. 타이포그래피 (Typography)

### 폰트

- **기본**: SUIT (cdn.jsdelivr.net/gh/sunn-us/SUIT@1.0.4)
- **이모지**: Tossface SVG (`/emoji/u<코드포인트>.svg`)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT@1.0.4/packages/static/woff2/SUIT.css" />
```

```css
body {
  font-family: 'SUIT', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text1);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

### 텍스트 스케일

| 용도 | 크기 | 굵기 | 색상 |
|---|---|---|---|
| 날짜 헤더 | 26px | 700 | `--text1` |
| 모달 제목 | 17px | 700 | `--text1` |
| 캘린더 월 제목 | 16px | 700 | `--text1` |
| 통계 숫자 | 18–22px | 700 | `--text1` |
| 할 일 제목 | 15px | 500 | `--text1` |
| 본문 | 14px | 400 | `--text1` |
| 보조 텍스트 | 13px | 400–500 | `--text2` |
| 메모/노트 | 13–14px | 400 | `--text2` |
| 섹션 레이블 | 13px | 600 | `--text3` (uppercase) |
| 뱃지 | 12px | 500 | 상황별 색상 |
| 날짜/메타 | 12px | 400 | `--text3` |
| 캘린더 숫자 | 11–12px | 500 | `--text2` |
| 소형 레이블 | 11px | 600 | `--text3` (uppercase) |

---

## 3. 레이아웃 (Layout)

### 기본 구조

```css
.shell {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 100vh;
}

.main {
  padding: 32px 32px 80px;
  min-width: 0;
}
```

### 반응형 분기점

- **모바일**: `≤ 680px`
  - 사이드바가 fixed drawer로 전환
  - `.main { padding: 20px 16px 80px; }`
  - 모달이 바텀시트로 전환 (`border-radius: 24px 24px 0 0`)

---

## 4. 사이드바 (Sidebar)

```css
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 28px 16px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  width: 248px;
  min-width: 248px;
  transition: min-width 0.25s ease, width 0.25s ease, padding 0.25s ease, border-color 0.25s ease;
}

/* 접힌 상태 */
.sidebar.collapsed {
  min-width: 0;
  width: 0;
  padding-left: 0;
  padding-right: 0;
  border-color: transparent;
  overflow: hidden;
}
```

### 사이드바 토글 버튼 (데스크톱)

```css
.sidebar-expand-btn {
  position: fixed;
  bottom: 32px;
  left: 228px;  /* 접힌 상태에서는 JS로 left 값 변경 */
  z-index: 100;
  width: 40px;
  height: 40px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: border-color 0.12s, color 0.12s, left 0.25s ease;
}
.sidebar-expand-btn:hover {
  border-color: var(--blue500);
  color: var(--blue500);
  box-shadow: 0 4px 16px rgba(49,130,246,0.2);
}
```

### 모바일 사이드바

```css
/* 모바일에서 fixed drawer */
@media (max-width: 680px) {
  .sidebar {
    position: fixed !important;
    left: -280px !important;
    z-index: 300;
    transition: left 0.25s ease, box-shadow 0.25s ease !important;
  }
  .sidebar.mobile-open {
    left: 0 !important;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15) !important;
  }
}

/* 오버레이 */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(25,31,40,0.45);
  backdrop-filter: blur(2px);
  z-index: 299;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s;
}
.sidebar-overlay.visible {
  opacity: 1;
  pointer-events: all;
}
```

---

## 5. 내비게이션 아이템 (Nav Item)

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--text2);
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  width: 100%;
  transition: background 0.1s, color 0.1s;
}
.nav-item:hover { background: var(--grey50); color: var(--text1); }
.nav-item.active { background: var(--blue50); color: var(--blue500); font-weight: 600; }
```

---

## 6. 뱃지 (Badge)

```css
.badge {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 100px;
  font-weight: 500;
}

.badge-urgent  { background: var(--red50);   color: var(--red500); }
.badge-normal  { background: var(--blue50);  color: var(--blue600); }
.badge-low     { background: var(--grey100); color: var(--grey600); }
.badge-cat     { background: var(--grey100); color: var(--grey700); }
.badge-status  { background: var(--grey100); color: var(--grey600); }
.badge-date    { color: var(--text3); font-size: 12px; }
.badge-overdue { color: var(--red500); font-weight: 600; }
.badge-location { color: var(--text3); font-size: 12px; text-decoration: none; }
.badge-location:hover { color: var(--blue500); }
```

---

## 7. 버튼 (Button)

### 주요 액션 버튼

```css
.btn-save {
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  background: var(--blue500);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-save:hover    { background: var(--blue600); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
```

### 취소 버튼

```css
.btn-cancel {
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 500;
  background: var(--grey100);
  border: none;
  color: var(--text2);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-cancel:hover { background: var(--grey200); }
```

### 삭제/위험 버튼

```css
.btn-delete {
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--red50);
  border: none;
  color: var(--red500);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-delete:hover { background: #ffd6d9; }
```

### 아웃라인 버튼 (sync, topbar)

```css
.sync-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}
.sync-btn:hover { border-color: var(--blue500); color: var(--blue500); }
```

### 추가 버튼 (파란 배경)

```css
.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: var(--blue500);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.add-btn:hover { background: var(--blue600); }
```

### 아이콘 액션 버튼 (30×30)

```css
.act-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.act-btn.act-edit:hover  { background: var(--blue50); color: var(--blue500); }
.act-btn.act-del:hover   { background: var(--red50);  color: var(--red500); }
```

---

## 8. 모달 (Modal)

### 구조

```
.modal-backdrop (fixed overlay)
  └── .modal (카드)
        ├── .modal-header (제목 + 닫기 버튼)
        ├── .modal-body (스크롤 영역)
        └── .modal-footer (버튼 행)
```

### 오버레이

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(25,31,40,0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.modal-backdrop.open { opacity: 1; pointer-events: all; }
```

### 카드

```css
.modal {
  background: var(--surface);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  margin: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px var(--border);
  transform: translateY(12px) scale(0.98);
  transition: transform 0.2s cubic-bezier(.34,1.56,.64,1);
  display: flex;
  flex-direction: column;
}
.modal-backdrop.open .modal { transform: translateY(0) scale(1); }
```

### 헤더

```css
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 0;
  flex-shrink: 0;
}
.modal-title { font-size: 17px; font-weight: 700; color: var(--text1); letter-spacing: -0.2px; }

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--grey100);
  border-radius: 50%;
  cursor: pointer;
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.modal-close:hover { background: var(--grey200); color: var(--text1); }
```

### 바디 / 푸터

```css
.modal-body { padding: 20px 24px; flex: 1; overflow-y: auto; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px 22px;
  flex-shrink: 0;
}
```

### 모바일 바텀시트 전환

```css
@media (max-width: 680px) {
  .modal-backdrop { align-items: flex-end; }
  .modal {
    max-width: 100%;
    margin: 0;
    border-radius: 24px 24px 0 0;
    max-height: 90vh;
    transform: translateY(100%) !important;
  }
  .modal-backdrop.open .modal { transform: translateY(0) !important; }
  .modal-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
  .modal-body   { padding: 20px 20px; -webkit-overflow-scrolling: touch; }
  .modal-footer { padding: 16px 20px 24px; border-top: 1px solid var(--border); background: var(--surface); }
}
```

---

## 9. 폼 (Form)

### 그리드 레이아웃

```css
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; color: var(--text3); font-weight: 600; }
.form-full { grid-column: 1 / -1; }
```

### 입력 필드

```css
.form-group input,
.form-group textarea {
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  background: var(--grey50);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  color: var(--text1);
  outline: none;
  min-height: 43px;
  transition: border-color 0.12s, background 0.12s;
  -webkit-appearance: none;
  appearance: none;
}
.form-group input:focus,
.form-group textarea:focus { border-color: var(--blue500); background: var(--surface); }
.form-group textarea { resize: vertical; min-height: 72px; }
```

### 검색 입력

```css
.task-search-input {
  width: 100%;
  max-width: 400px;
  min-height: 43px;
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text1);
  background: var(--grey50);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}
.task-search-input:focus { border-color: var(--blue500); background: var(--surface); }
.task-search-input::placeholder { color: var(--text3); }
```

---

## 10. 세그먼트 컨트롤 (Segment Control)

여러 옵션 중 하나를 선택하는 탭 스타일 컨트롤입니다.

```css
.seg-group { display: flex; gap: 6px; }
.seg-btn {
  flex: 1;
  padding: 10px 12px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--grey50);
  color: var(--text2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.seg-btn:hover { border-color: var(--grey300); color: var(--text1); background: var(--grey100); }
.seg-btn.active { font-weight: 600; border-color: var(--blue500); background: var(--blue50); color: var(--blue500); }
```

소형 세그먼트 (테마 선택 등):

```css
.settings-theme-seg {
  display: flex;
  background: var(--grey100);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.settings-theme-opt {
  padding: 4px 9px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--text3);
  transition: background 0.12s, color 0.12s;
}
.settings-theme-opt.active {
  background: var(--surface);
  color: var(--text1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

---

## 11. 체크박스 (Checkbox)

```css
.checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1.5px solid var(--grey300);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.checkbox:hover { border-color: var(--blue500); }
.checkbox.checked { background: var(--blue500); border-color: var(--blue500); }
.checkbox svg { display: none; width: 11px; height: 11px; stroke: #fff; fill: none; stroke-width: 2.5; }
.checkbox.checked svg { display: block; }
```

---

## 12. 토글 스위치 (Toggle Switch)

```css
.toggle-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-slider {
  position: absolute;
  inset: 0;
  border-radius: 11px;
  background: var(--grey200);
  cursor: pointer;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-switch input:checked + .toggle-slider { background: var(--blue500); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }
```

HTML 구조:
```html
<label class="toggle-switch">
  <input type="checkbox">
  <span class="toggle-slider"></span>
</label>
```

---

## 13. 칩 필터 (Filter Chips)

```css
.task-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 100px;
  border: none;
  background: transparent;
  color: var(--text3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.1s, background 0.1s;
}
.task-filter-chip:hover  { background: var(--grey100); color: var(--text2); }
.task-filter-chip.active { background: var(--grey200); color: var(--text1); }
```

---

## 14. 카테고리 칩 선택기 (Category Chip Picker)

```css
.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--grey50);
  color: var(--text2);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.cat-chip:hover { border-color: var(--grey400); color: var(--text1); }
.cat-chip.active {
  border-color: var(--blue500);
  color: var(--blue500);
  background: var(--blue50);
  font-weight: 500;
}
```

---

## 15. 드롭다운 (Dropdown)

```css
.cat-filter-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  min-width: 160px;
  z-index: 200;
  overflow-y: auto;
  max-height: 280px;
}
.cat-filter-dropdown.open { display: block; }

.cat-filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text2);
  transition: background 0.1s;
  white-space: nowrap;
  user-select: none;
}
.cat-filter-option:hover { background: var(--grey50); }
```

### 설정 드롭다운

```css
.settings-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
  transition: opacity 0.15s, transform 0.15s;
}
.settings-dropdown.open { opacity: 1; pointer-events: auto; transform: translateY(0); }

.settings-dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  border: none;
  background: none;
  width: 100%;
}
.settings-dropdown-item:hover { background: var(--grey50); color: var(--text1); }
```

---

## 16. 요일 선택기 (Day Picker)

```css
.day-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.day-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}
.day-btn:hover { border-color: var(--blue500); color: var(--blue500); }
.day-btn.active { background: var(--blue500); border-color: var(--blue500); color: #fff; font-weight: 700; }
```

---

## 17. 할 일 목록 (Task List)

### 카드 (메인 리스트)

```css
.task-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 2rem; }
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px var(--border);
  transition: box-shadow 0.12s;
  animation: fadeIn 0.18s ease;
}
.task-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px var(--grey300); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
```

### 오늘의 할 일 (단일 카드)

```css
.today-card {
  background: var(--surface);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px var(--border);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 2rem;
}
/* 카드 내부 행 스타일 */
.today-card .task-item {
  border-radius: 10px;
  box-shadow: none;
  padding: 12px 14px;
  background: transparent;
  transition: background 0.1s;
  animation: none;
}
.today-card .task-item:hover { background: var(--grey50); }
```

### 드래그 핸들

```css
.drag-handle {
  width: 16px;
  flex-shrink: 0;
  cursor: grab;
  color: var(--grey300);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.12s;
}
.task-item:hover .drag-handle { opacity: 1; }
.drag-handle:active { cursor: grabbing; }
.task-item.dragging { opacity: 0.35; }
.task-item.drag-over { outline: 2px solid var(--blue500); outline-offset: -2px; background: var(--blue50); }
```

### 메모

```css
.task-note {
  font-size: 13px;
  color: var(--text3);
  margin-top: 6px;
  line-height: 1.5;
  white-space: pre-wrap;  /* 줄바꿈 보존 */
}
```

---

## 18. 섹션 헤더 (Section Header)

```css
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## 19. 브리핑 카드 (Briefing Card)

짙은 배경의 정보 카드. 다크 모드에서는 흰 배경으로 반전됩니다.

```css
.briefing-card {
  background: var(--grey800);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.briefing-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.briefing-line {
  font-size: 14px;
  color: rgba(255,255,255,0.88);
  line-height: 1.6;
}
.briefing-line strong { color: #ffffff; font-weight: 600; }

/* 다크 모드 반전 */
[data-theme="dark"] .briefing-card {
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06);
}
[data-theme="dark"] .briefing-line { color: rgba(0,0,0,0.75); }
[data-theme="dark"] .briefing-line strong { color: #000000; }
```

---

## 20. 캘린더 (Calendar)

```css
.cal-wrap {
  background: var(--surface);
  border-radius: 16px;
  padding: 20px 20px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(96px, auto);  /* JS로 균일 높이 조정 */
  gap: 1px;
  background: var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.cal-day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 7px 6px 5px;
  background: var(--surface);
  min-height: 0;
  min-width: 0;
  transition: background 0.1s;
}
.cal-day.other-month { background: var(--grey50); }
.cal-day.is-today .cal-day-num {
  background: var(--blue500);
  color: #fff;
  font-weight: 700;
}

.cal-task-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 3px;
  border-radius: 4px;
  border: none;
  font-size: 11px;
  font-weight: 500;
  height: 20px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 2px;
  transition: opacity 0.1s;
}
.cal-task-chip:hover { opacity: 0.82; }
```

### 캘린더 뷰 토글

```css
.cal-view-toggle {
  display: flex;
  background: var(--grey100);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}
.cal-view-btn {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text3);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cal-view-btn.active {
  background: var(--surface);
  color: var(--text1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
```

---

## 21. 빈 상태 (Empty State)

```css
.empty-state {
  text-align: center;
  padding: 52px 24px;
  color: var(--text3);
  font-size: 14px;
  line-height: 2;
}
```

---

## 22. 위치 선택 UI (Location Picker)

```css
/* 선택된 위치 표시 칩 */
.location-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--blue50);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 13px;
  color: var(--blue600);
  font-weight: 500;
}

/* 검색 결과 아이템 */
.location-result-item {
  padding: 12px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.1s;
}
.location-result-item:hover {
  background: var(--grey50);
  padding-left: 8px;
  padding-right: 8px;
  margin: 0 -8px;
}
.location-result-item + .location-result-item { border-top: 1px solid var(--border); }
.location-result-name { font-size: 14px; font-weight: 500; color: var(--text1); }
.location-result-meta { font-size: 12px; color: var(--text3); margin-top: 3px; }
```

---

## 23. 상태 표시 (Status Indicator)

```css
.sdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sdot-ok      { background: var(--green500); }
.sdot-err     { background: var(--red500); }
.sdot-loading { background: var(--orange500); animation: pulse 1.2s infinite; }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
```

---

## 24. 스플래시 화면 (Splash)

```css
#splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
}
#splash.hidden { opacity: 0; pointer-events: none; }

@keyframes twoing {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.88); }
  100% { transform: scale(1); }
}
```

---

## 25. 스크롤바 (Scrollbar)

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: var(--grey200); border-radius: 4px; }
```

---

## 26. 이모지 (Tossface SVG)

폰트 기반 이모지 대신 SVG 파일을 사용합니다. 전역 폰트에 적용하면 숫자 렌더링에 영향을 줄 수 있어 SVG 방식을 사용합니다.

```html
<img class="t-emoji" src="/emoji/u1F600.svg" alt="😀">
```

```css
.t-emoji {
  display: inline-block;
  width: 1.1em;
  height: 1.1em;
  vertical-align: -0.25em;
  flex-shrink: 0;
}
```

파일 네이밍: `/emoji/u<유니코드 코드포인트>.svg` (예: 😀 → `u1F600.svg`)

---

## 27. 애니메이션 (Animations)

```css
/* 목록 아이템 등장 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}

/* 로딩 회전 */
@keyframes spin { to { transform: rotate(360deg); } }
.spinning svg { animation: spin 1s linear infinite; }

/* 펄스 (로딩 상태 dot) */
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

/* 스플래시 로고 */
@keyframes twoing {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.88); }
  100% { transform: scale(1); }
}
```

---

## 28. 공통 패턴 (Common Patterns)

### 링크 스타일

```css
.task-note a, .detail-note a {
  color: var(--blue500);
  text-decoration: underline;
  word-break: break-all;
}
```

### 섹션 구분선

```css
.section-divider { height: 1px; background: var(--border); margin: 8px 0 24px; }
```

### 스크롤 잠금 (모달 열릴 때)

```css
body.scroll-locked { overflow: hidden; position: fixed; width: 100%; }
```

### 오버레이 z-index 스택

| 레이어 | z-index |
|---|---|
| 스플래시 | 9999 |
| 카테고리 모달 | 400 |
| 설정 드롭다운 | 300 |
| 모바일 사이드바 | 300 |
| 사이드바 오버레이 | 299 |
| 모달 | 200 |
| 드롭다운 | 200 |
| 사이드바 토글 버튼 | 100 |

---

## 사용 방법

1. CSS 변수 블록 (섹션 1)을 새 프로젝트의 `:root`에 복사합니다.
2. `[data-theme="dark"]` 블록을 함께 복사하고, 다크 모드 플래시 방지 스크립트를 `<head>` 최상단에 추가합니다.
3. SUIT 폰트 링크를 `<head>`에 추가합니다.
4. 필요한 컴포넌트의 CSS 클래스를 선택적으로 복사합니다.
5. 이모지가 필요한 경우 `/emoji/` 디렉터리와 `.t-emoji` 클래스를 함께 가져옵니다.
