// ✅ Sun To-Do — 위젯 스크립트 (scriptable-widget.js)
// Scriptable 앱에서 이 스크립트 이름을 "SunToDo-Widget" 으로 저장하세요.
const BASE_URL = "https://sun-to-do.vercel.app";
const USERNAME = "YOUR_USERNAME";
const PASSWORD = "YOUR_PASSWORD";

// ───────────────────────────────────────────
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

const data  = await fetchTasks();
const all   = data.tasks || [];
const pending  = all.filter(t => !t.done);
const doneCount = all.length - pending.length;
const family = config.widgetFamily;

const C_TEXT   = new Color("#1c1c1e");
const C_MUTED  = new Color("#8e8e93");
const C_ACCENT = new Color("#007aff");
const C_CHECK  = new Color("#34c759");

const widget = new ListWidget();

// Liquid Glass 배경
const bg = new LinearGradient();
bg.colors    = [new Color("#ffffff", 0.72), new Color("#f2f2f7", 0.60)];
bg.locations = [0, 1];
bg.startPoint = new Point(0, 0);
bg.endPoint   = new Point(1, 1);
widget.backgroundGradient = bg;

// ── 잠금화면 직사각형 ──
if (family === "accessoryRectangular") {
  widget.url = `scriptable:///run?scriptName=SunToDo&action=add`;
  const stack = widget.addStack();
  stack.layoutVertically();
  stack.spacing = 1;

  const hdr = stack.addText(
    pending.length === 0 && all.length === 0
      ? "오늘의 할 일"
      : pending.length === 0
        ? "🎉 오늘 완료!"
        : `남은 할 일 ${pending.length}개`
  );
  hdr.font = Font.boldSystemFont(10);
  hdr.textColor = pending.length === 0 ? C_CHECK : C_ACCENT;
  stack.addSpacer(2);

  for (const t of pending.slice(0, 3)) {
    const el = stack.addText(`· ${t.title}`);
    el.font = Font.systemFont(10);
    el.textColor = C_TEXT;
    el.lineLimit = 1;
  }
  if (pending.length > 3) {
    const m = stack.addText(`  외 ${pending.length - 3}개`);
    m.font = Font.systemFont(9); m.textColor = C_MUTED;
  }

// ── 잠금화면 원형 ──
} else if (family === "accessoryCircular") {
  widget.url = `scriptable:///run?scriptName=SunToDo&action=add`;
  widget.addSpacer();
  const n = widget.addText(all.length === 0 ? "–" : `${pending.length}`);
  n.font = Font.boldSystemFont(20); n.textColor = C_ACCENT; n.centerAlignText();
  const l = widget.addText("남음");
  l.font = Font.systemFont(10); l.textColor = C_MUTED; l.centerAlignText();
  widget.addSpacer();

// ── 홈 화면 (small / medium / large) ──
} else {
  const isSmall  = family === "small";
  const maxItems = isSmall ? 4 : family === "medium" ? 5 : 10;
  const PAD = isSmall ? 12 : 14;

  widget.setPadding(PAD, PAD, PAD, PAD);
  widget.spacing = 0;

  // 헤더
  const hRow = widget.addStack();
  hRow.layoutHorizontally();
  const titleEl = hRow.addText("오늘의 할 일");
  titleEl.font = Font.boldSystemFont(isSmall ? 13 : 14);
  titleEl.textColor = C_TEXT;
  hRow.addSpacer();
  if (all.length > 0) {
    const cnt = hRow.addText(`${doneCount}/${all.length}`);
    cnt.font = Font.boldSystemFont(isSmall ? 13 : 14);
    cnt.textColor = C_ACCENT;
  }

  widget.addSpacer(isSmall ? 7 : 9);

  if (all.length === 0) {
    const e = widget.addText("앱에서 오늘 할 일을 설정해주세요");
    e.font = Font.systemFont(11); e.textColor = C_MUTED;
    widget.url = `scriptable:///run?scriptName=SunToDo&action=add`;
  } else if (pending.length === 0) {
    widget.addSpacer();
    const d = widget.addText("🎉 오늘 할 일\n모두 완료했어요!");
    d.font = Font.mediumSystemFont(12); d.textColor = C_CHECK;
    widget.addSpacer();
    widget.url = `scriptable:///run?scriptName=SunToDo&action=add`;
  } else {
    // 미완료 할 일만 표시, 탭하면 완료 처리
    const display = pending.slice(0, maxItems);
    for (const task of display) {
      widget.addSpacer(isSmall ? 5 : 6);
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 6;
      row.url = `scriptable:///run?scriptName=SunToDo&action=complete&id=${encodeURIComponent(task.id)}&title=${encodeURIComponent(task.title)}`;

      const dot = row.addText("·");
      dot.font = Font.boldSystemFont(14);
      dot.textColor = C_ACCENT;

      const tEl = row.addText(task.title);
      tEl.font = Font.systemFont(11);
      tEl.textColor = C_TEXT;
      tEl.lineLimit = 1;
    }
    if (pending.length > maxItems) {
      widget.addSpacer(5);
      const more = widget.addText(`외 ${pending.length - maxItems}개`);
      more.font = Font.systemFont(10); more.textColor = C_MUTED;
    }

    // + 추가 버튼 행
    widget.addSpacer(8);
    const addRow = widget.addStack();
    addRow.layoutHorizontally();
    addRow.spacing = 4;
    addRow.url = `scriptable:///run?scriptName=SunToDo&action=add`;
    const plus = addRow.addText("+");
    plus.font = Font.boldSystemFont(12); plus.textColor = C_MUTED;
    const addTxt = addRow.addText("빠른 추가");
    addTxt.font = Font.systemFont(11); addTxt.textColor = C_MUTED;
  }

  widget.addSpacer();
}

Script.setWidget(widget);
if (!config.runningInWidget) widget.presentMedium();
Script.complete();
