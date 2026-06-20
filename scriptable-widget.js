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
const C_BG        = Color.white();
const C_TITLE     = new Color("#1c1c1e");
const C_TEXT      = new Color("#3a3a3c");
const C_MUTED     = new Color("#8e8e93");
const C_BTN_BG    = new Color("#f2f2f7");
const C_GREEN     = new Color("#34c759");

const ACTION_PLAN = `${BASE_URL}?action=plan`;


const widget = new ListWidget();
widget.backgroundColor = C_BG;
widget.url = ACTION_PLAN;

// ── 잠금화면 직사각형 ──
if (family === "accessoryRectangular") {
  const col = widget.addStack();
  col.layoutVertically();
  col.spacing = 2;

  const hdrText = all.length === 0 ? "오늘 할 일 없음"
    : pending.length === 0 ? "🎉 모두 완료!"
    : `오늘의 할 일  ${done.length}/${all.length} 완료`;
  const hdr = col.addText(hdrText);
  hdr.font = Font.boldSystemFont(15);
  hdr.lineLimit = 1;

  col.addSpacer(2);

  for (const t of pending.slice(0, 3)) {
    const el = col.addText("· " + t.title);
    el.font = Font.systemFont(14);
    el.lineLimit = 1;
  }
  if (pending.length > 3) {
    const m = col.addText(`  외 ${pending.length - 3}개`);
    m.font = Font.systemFont(13);
  }

// ── 잠금화면 원형 ──
} else if (family === "accessoryCircular") {
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
  widget.setPadding(20, 16, 16, 16);

  if (all.length === 0) {
    widget.addSpacer();
    try {
      const iconReq = new Request(`${BASE_URL}/apple-touch-icon.png`);
      const iconImg = await iconReq.loadImage();
      const iconRow = widget.addStack();
      iconRow.layoutHorizontally();
      iconRow.addSpacer();
      const imgEl = iconRow.addImage(iconImg);
      imgEl.imageSize = new Size(40, 40);
      imgEl.cornerRadius = 10;
      iconRow.addSpacer();
    } catch {
      const ico = widget.addText("🌞");
      ico.font = Font.systemFont(32);
      ico.centerAlignText();
    }
    widget.addSpacer(6);
    const msg = widget.addText("오늘 할 일을\n계획해보세요");
    msg.font = Font.boldSystemFont(13);
    msg.textColor = C_TITLE;
    msg.centerAlignText();
    widget.addSpacer();
  } else {
    const bigNum = widget.addText(`${pending.length}`);
    bigNum.font = Font.boldSystemFont(52);
    bigNum.textColor = pending.length === 0 ? C_GREEN : C_TITLE;
    bigNum.minimumScaleFactor = 0.5;
    const sub = widget.addText(pending.length === 0 ? "모두 완료!" : "남은 할 일");
    sub.font = Font.systemFont(13);
    sub.textColor = pending.length === 0 ? C_GREEN : C_MUTED;
    widget.addSpacer(4);
    const cnt = widget.addText(`${done.length}/${all.length} 완료`);
    cnt.font = Font.systemFont(12);
    cnt.textColor = C_MUTED;
    widget.addSpacer();
    if (pending.length > 0) {
      const next = widget.addText(pending[0].title);
      next.font = Font.systemFont(13);
      next.textColor = C_TEXT;
      next.lineLimit = 2;
    }
  }

// ── 홈 화면 medium / large ──
} else {
  const maxItems = 3;

  widget.setPadding(20, 16, 14, 16);

  if (all.length === 0) {
    // ── 빈 상태 ──
    widget.addSpacer();
    try {
      const iconReq = new Request(`${BASE_URL}/apple-touch-icon.png`);
      const iconImg = await iconReq.loadImage();
      const iconRow = widget.addStack();
      iconRow.layoutHorizontally();
      iconRow.addSpacer();
      const imgEl = iconRow.addImage(iconImg);
      imgEl.imageSize = new Size(48, 48);
      imgEl.cornerRadius = 11;
      iconRow.addSpacer();
    } catch {
      const ico = widget.addText("🌞");
      ico.font = Font.systemFont(40);
      ico.centerAlignText();
    }
    widget.addSpacer(10);
    const msg = widget.addText("오늘 할 일을 계획해보세요");
    msg.font = Font.boldSystemFont(15);
    msg.textColor = C_TITLE;
    msg.centerAlignText();
    widget.addSpacer(14);
    const btnRow = widget.addStack();
    btnRow.layoutHorizontally();
    btnRow.addSpacer();
    const btn = btnRow.addStack();
    btn.backgroundColor = C_BTN_BG;
    btn.cornerRadius = 14;
    btn.setPadding(8, 20, 8, 20);
    btn.url = ACTION_PLAN;
    const btnTxt = btn.addText("계획하기");
    btnTxt.font = Font.mediumSystemFont(14);
    btnTxt.textColor = C_TITLE;
    btnRow.addSpacer();
    widget.addSpacer();

  } else {
    // ── 할 일 목록 ──
    const hRow = widget.addStack();
    hRow.layoutHorizontally();
    hRow.centerAlignContent();
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
      row.centerAlignContent();
      row.spacing = 6;

      const dot = row.addText("•");
      dot.font = Font.systemFont(15);
      dot.textColor = C_TEXT;

      const tEl = row.addText(task.title);
      tEl.font = Font.systemFont(15);
      tEl.textColor = C_TEXT;
      tEl.lineLimit = 1;

      widget.addSpacer(9);
    }

    if (pending.length > maxItems) {
      const more = widget.addText(`  외 ${pending.length - maxItems}개`);
      more.font = Font.systemFont(12);
      more.textColor = C_MUTED;
      widget.addSpacer(6);
    }

    widget.addSpacer();
  }
}

// 5분 후 갱신 요청 (iOS가 허용하는 범위 내에서 최대한 빠르게)
widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

Script.setWidget(widget);
if (!config.runningInWidget) widget.presentMedium();
Script.complete();
