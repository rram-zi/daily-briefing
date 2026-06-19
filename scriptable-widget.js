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

const data     = await fetchTasks();
const all      = data.tasks || [];
const pending  = all.filter(t => !t.done);
const done     = all.filter(t => t.done);
const family   = config.widgetFamily;

// iOS 네이티브 컬러
const C_WHITE  = Color.white();
const C_MUTED  = new Color("#ffffff", 0.55);
const C_CHECK  = new Color("#30d158");

const widget = new ListWidget();
widget.backgroundColor = new Color("#1c1c1e", 0.78);

const ACTION_ADD      = `scriptable:///run?scriptName=SunToDo&action=add`;
const ACTION_COMPLETE = `scriptable:///run?scriptName=SunToDo&action=complete`;

// ── 잠금화면 직사각형 ──
if (family === "accessoryRectangular") {
  widget.url = ACTION_ADD;
  const col = widget.addStack();
  col.layoutVertically();
  col.spacing = 2;

  const hdr = col.addText(
    pending.length === 0 ? "🎉 모두 완료!" : `오늘 할 일 ${pending.length}개`
  );
  hdr.font = Font.boldSystemFont(11);
  hdr.textColor = pending.length === 0 ? C_CHECK : C_WHITE;

  for (const t of pending.slice(0, 3)) {
    const el = col.addText(`· ${t.title}`);
    el.font = Font.systemFont(11);
    el.textColor = C_WHITE;
    el.lineLimit = 1;
  }
  if (pending.length > 3) {
    const m = col.addText(`  외 ${pending.length - 3}개`);
    m.font = Font.systemFont(10);
    m.textColor = C_MUTED;
  }

// ── 잠금화면 원형 ──
} else if (family === "accessoryCircular") {
  widget.url = ACTION_COMPLETE;
  widget.addSpacer();
  const n = widget.addText(`${pending.length}`);
  n.font = Font.boldSystemFont(28);
  n.textColor = C_WHITE;
  n.centerAlignText();
  const l = widget.addText("남은 할 일");
  l.font = Font.systemFont(10);
  l.textColor = C_MUTED;
  l.centerAlignText();
  widget.addSpacer();

// ── 홈 화면 small ──
} else if (family === "small") {
  widget.url = ACTION_COMPLETE;
  widget.setPadding(16, 16, 16, 16);

  // 남은 개수 크게
  const bigNum = widget.addText(`${pending.length}`);
  bigNum.font = Font.boldSystemFont(48);
  bigNum.textColor = C_WHITE;
  bigNum.minimumScaleFactor = 0.5;

  const sub = widget.addText("남은 할 일");
  sub.font = Font.systemFont(13);
  sub.textColor = C_MUTED;

  widget.addSpacer();

  if (pending.length > 0) {
    const next = widget.addText(pending[0].title);
    next.font = Font.mediumSystemFont(12);
    next.textColor = C_WHITE;
    next.lineLimit = 2;
  } else {
    const done = widget.addText("🎉 모두 완료!");
    done.font = Font.mediumSystemFont(12);
    done.textColor = C_CHECK;
    widget.url = ACTION_ADD;
  }

// ── 홈 화면 medium / large ──
} else {
  const isLarge  = family === "large";
  const maxItems = isLarge ? 8 : 4;
  widget.setPadding(16, 16, 16, 16);

  // 헤더
  const hRow = widget.addStack();
  hRow.layoutHorizontally();

  const titleEl = hRow.addText("오늘의 할 일");
  titleEl.font = Font.boldSystemFont(15);
  titleEl.textColor = C_WHITE;
  hRow.addSpacer();

  if (all.length > 0) {
    const cntEl = hRow.addText(`${done.length}/${all.length}`);
    cntEl.font = Font.boldSystemFont(15);
    cntEl.textColor = C_MUTED;
  }

  widget.addSpacer(12);

  if (all.length === 0) {
    widget.url = ACTION_ADD;
    const e = widget.addText("할 일을 앱에서 설정해주세요");
    e.font = Font.systemFont(13);
    e.textColor = C_MUTED;
  } else if (pending.length === 0) {
    widget.url = ACTION_ADD;
    widget.addSpacer();
    const d = widget.addText("🎉 오늘 할 일을\n모두 완료했어요!");
    d.font = Font.mediumSystemFont(14);
    d.textColor = C_CHECK;
    widget.addSpacer();
  } else {
    widget.url = ACTION_COMPLETE;

    for (const task of pending.slice(0, maxItems)) {
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 8;

      const dot = row.addText("•");
      dot.font = Font.boldSystemFont(16);
      dot.textColor = C_WHITE;

      const tEl = row.addText(task.title);
      tEl.font = Font.systemFont(14);
      tEl.textColor = C_WHITE;
      tEl.lineLimit = 1;

      widget.addSpacer(8);
    }

    if (pending.length > maxItems) {
      const more = widget.addText(`외 ${pending.length - maxItems}개`);
      more.font = Font.systemFont(12);
      more.textColor = C_MUTED;
    }

    widget.addSpacer();

    // 하단 추가 버튼
    const addRow = widget.addStack();
    addRow.layoutHorizontally();
    addRow.spacing = 4;
    addRow.url = ACTION_ADD;
    const plus = addRow.addText("＋ 빠른 추가");
    plus.font = Font.systemFont(12);
    plus.textColor = C_MUTED;
  }
}

Script.setWidget(widget);
if (!config.runningInWidget) widget.presentMedium();
Script.complete();
