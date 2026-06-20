// ✅ Sun To-Do — 위젯 스크립트
// Scriptable 앱에서 이 스크립트 이름을 정확히 "SunToDo-Widget" 으로 저장하세요.
const BASE_URL = "https://sun-to-do.vercel.app";
const USERNAME = "YOUR_USERNAME";
const PASSWORD = "YOUR_PASSWORD";

const AUTH = btoa(`${USERNAME}:${PASSWORD}`);

async function fetchTasks() {
  try {
    const req = new Request(`${BASE_URL}/api/today`);
    req.headers = { Authorization: `Basic ${AUTH}` };
    req.timeoutInterval = 10;
    return await req.loadJSON();
  } catch {
    return { date: "", tasks: [] };
  }
}

const data    = await fetchTasks();
const all     = data.tasks || [];
const pending = all.filter(t => !t.done);
const done    = all.filter(t => t.done);
const family  = config.widgetFamily;

// 색상 — 흰 배경 + 그레이톤
const C_BG     = Color.white();
const C_TITLE  = new Color("#1c1c1e");
const C_TEXT   = new Color("#3a3a3c");
const C_MUTED  = new Color("#8e8e93");
const C_CB     = new Color("#c7c7cc");   // 체크박스 컬러
const C_BTN_BG = new Color("#f2f2f7");
const C_GREEN  = new Color("#34c759");

const ACTION_ADD = `scriptable:///run?scriptName=SunToDo&action=add`;

function completeUrl(task) {
  return `scriptable:///run?scriptName=SunToDo&action=complete&id=${encodeURIComponent(task.id)}&title=${encodeURIComponent(task.title)}`;
}

// 둥글린 사각형 체크박스 SF Symbol
function checkboxSymbol() {
  const sym = SFSymbol.named("square");
  sym.applyRegularWeight();
  return sym.image;
}

const widget = new ListWidget();
widget.backgroundColor = C_BG;

// ── 잠금화면 직사각형 ──
if (family === "accessoryRectangular") {
  widget.url = ACTION_ADD;
  const col = widget.addStack();
  col.layoutVertically();
  col.spacing = 3;
  const hdr = col.addText(pending.length === 0 ? "🎉 오늘 완료!" : `오늘 할 일 ${pending.length}개`);
  hdr.font = Font.boldSystemFont(11);
  hdr.textColor = pending.length === 0 ? C_GREEN : C_TITLE;
  for (const t of pending.slice(0, 3)) {
    const el = col.addText(`□  ${t.title}`);
    el.font = Font.systemFont(11);
    el.textColor = C_TEXT;
    el.lineLimit = 1;
    el.url = completeUrl(t);
  }
  if (pending.length > 3) {
    const m = col.addText(`   외 ${pending.length - 3}개`);
    m.font = Font.systemFont(10);
    m.textColor = C_MUTED;
  }

// ── 잠금화면 원형 ──
} else if (family === "accessoryCircular") {
  widget.url = ACTION_ADD;
  widget.addSpacer();
  const n = widget.addText(`${pending.length}`);
  n.font = Font.boldSystemFont(28);
  n.textColor = C_TITLE;
  n.centerAlignText();
  const l = widget.addText("남은 할 일");
  l.font = Font.systemFont(10);
  l.textColor = C_MUTED;
  l.centerAlignText();
  widget.addSpacer();

// ── 홈 화면 small ──
} else if (family === "small") {
  widget.setPadding(16, 16, 16, 16);

  if (pending.length === 0) {
    // 빈 상태
    widget.url = ACTION_ADD;
    widget.addSpacer();
    const ico = widget.addText("☀️");
    ico.font = Font.systemFont(32);
    ico.centerAlignText();
    widget.addSpacer(6);
    const msg = widget.addText("오늘 할 일을\n추가해보세요");
    msg.font = Font.boldSystemFont(13);
    msg.textColor = C_TITLE;
    msg.centerAlignText();
    widget.addSpacer();
  } else {
    const bigNum = widget.addText(`${pending.length}`);
    bigNum.font = Font.boldSystemFont(52);
    bigNum.textColor = C_TITLE;
    bigNum.minimumScaleFactor = 0.5;
    const sub = widget.addText("남은 할 일");
    sub.font = Font.systemFont(13);
    sub.textColor = C_MUTED;
    widget.addSpacer();
    const next = widget.addText(pending[0].title);
    next.font = Font.systemFont(13);
    next.textColor = C_TEXT;
    next.lineLimit = 2;
    next.url = completeUrl(pending[0]);
  }

// ── 홈 화면 medium / large ──
} else {
  const isLarge  = family === "large";
  const maxItems = isLarge ? 7 : 4;

  widget.setPadding(16, 16, 14, 16);

  if (pending.length === 0 && all.length === 0) {
    // ── 빈 상태: 아이콘 + 문구 + 버튼 ──
    widget.url = ACTION_ADD;
    widget.addSpacer();

    // 앱 아이콘 — 배경 없이 이모지만
    const ico = widget.addText("🌞");
    ico.font = Font.systemFont(40);
    ico.centerAlignText();

    widget.addSpacer(10);

    const msg = widget.addText("오늘 할 일을 계획해보세요");
    msg.font = Font.boldSystemFont(isLarge ? 17 : 15);
    msg.textColor = C_TITLE;
    msg.centerAlignText();

    widget.addSpacer(14);

    // 계획하기 버튼
    const btnRow = widget.addStack();
    btnRow.layoutHorizontally();
    btnRow.addSpacer();
    const btn = btnRow.addStack();
    btn.backgroundColor = C_BTN_BG;
    btn.cornerRadius = 14;
    btn.setPadding(8, 20, 8, 20);
    btn.url = `${BASE_URL}?action=plan`;
    const btnTxt = btn.addText("계획하기");
    btnTxt.font = Font.mediumSystemFont(14);
    btnTxt.textColor = C_TITLE;
    btnRow.addSpacer();

    widget.addSpacer();

  } else if (pending.length === 0) {
    // 모두 완료
    widget.url = ACTION_ADD;
    widget.addSpacer();
    const d = widget.addText("🎉 오늘 할 일을\n모두 완료했어요!");
    d.font = Font.boldSystemFont(isLarge ? 18 : 16);
    d.textColor = C_TITLE;
    d.centerAlignText();
    widget.addSpacer(14);
    const btnRow = widget.addStack();
    btnRow.layoutHorizontally();
    btnRow.addSpacer();
    const btn = btnRow.addStack();
    btn.backgroundColor = C_BTN_BG;
    btn.cornerRadius = 14;
    btn.setPadding(8, 20, 8, 20);
    btn.url = `${BASE_URL}?action=plan`;
    const btnTxt = btn.addText("계획하기");
    btnTxt.font = Font.mediumSystemFont(14);
    btnTxt.textColor = C_TITLE;
    btnRow.addSpacer();
    widget.addSpacer();

  } else {
    // 헤더
    const hRow = widget.addStack();
    hRow.layoutHorizontally();
    const titleEl = hRow.addText("오늘의 할 일");
    titleEl.font = Font.boldSystemFont(15);
    titleEl.textColor = C_TITLE;
    hRow.addSpacer();
    const cntEl = hRow.addText(`${done.length}/${all.length} 완료`);
    cntEl.font = Font.systemFont(13);
    cntEl.textColor = C_MUTED;

    widget.addSpacer(12);

    for (const task of pending.slice(0, maxItems)) {
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 10;

      // 둥글린 사각형 체크박스
      const cbImg = row.addImage(checkboxSymbol());
      cbImg.imageSize = new Size(20, 20);
      cbImg.tintColor = C_CB;
      cbImg.url = completeUrl(task);

      const tEl = row.addText(task.title);
      tEl.font = Font.systemFont(15);
      tEl.textColor = C_TEXT;
      tEl.lineLimit = 1;
      tEl.url = completeUrl(task);

      widget.addSpacer(isLarge ? 10 : 9);
    }

    if (pending.length > maxItems) {
      const more = widget.addText(`  외 ${pending.length - maxItems}개`);
      more.font = Font.systemFont(12);
      more.textColor = C_MUTED;
      widget.addSpacer(6);
    }

    widget.addSpacer();

    const addEl = widget.addText("＋  빠른 추가");
    addEl.font = Font.systemFont(13);
    addEl.textColor = C_MUTED;
    addEl.url = ACTION_ADD;
  }
}

Script.setWidget(widget);
if (!config.runningInWidget) widget.presentMedium();
Script.complete();
