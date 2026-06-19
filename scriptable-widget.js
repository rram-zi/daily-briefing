// ✅ Sun To-Do — Scriptable Widget
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

const data = await fetchTasks();
const allTasks = data.tasks || [];
const pending = allTasks.filter(t => !t.done);
const doneCount = allTasks.filter(t => t.done).length;
const family = config.widgetFamily;

// ── 색상 (Glass / iOS 네이티브 느낌) ──
const C_TEXT    = new Color("#1c1c1e");
const C_MUTED   = new Color("#8e8e93");
const C_DONE    = new Color("#8e8e93");
const C_ACCENT  = new Color("#007aff");
const C_CHECK   = new Color("#34c759");

const widget = new ListWidget();

// Liquid Glass 배경: 반투명 흰색 그라디언트
const bg = new LinearGradient();
bg.colors = [new Color("#ffffff", 0.72), new Color("#f2f2f7", 0.60)];
bg.locations = [0, 1];
bg.startPoint = new Point(0, 0);
bg.endPoint   = new Point(1, 1);
widget.backgroundGradient = bg;

// ── 잠금화면 직사각형 ──
if (family === "accessoryRectangular") {
  const stack = widget.addStack();
  stack.layoutVertically();
  stack.spacing = 1;

  const hdr = stack.addText(
    allTasks.length === 0 ? "오늘의 할 일" :
    `✓ ${doneCount}/${allTasks.length}  남은 할 일 ${pending.length}개`
  );
  hdr.font = Font.boldSystemFont(10);
  hdr.textColor = C_ACCENT;
  stack.addSpacer(2);

  if (pending.length === 0 && allTasks.length === 0) {
    const t = stack.addText("앱에서 오늘 할 일을 설정해주세요");
    t.font = Font.systemFont(10); t.textColor = C_MUTED;
  } else if (pending.length === 0) {
    const t = stack.addText("🎉 오늘 할 일 모두 완료!");
    t.font = Font.systemFont(10); t.textColor = C_CHECK;
  } else {
    for (const task of pending.slice(0, 3)) {
      const t = stack.addText(`· ${task.title}`);
      t.font = Font.systemFont(10); t.textColor = C_TEXT; t.lineLimit = 1;
    }
    if (pending.length > 3) {
      const m = stack.addText(`  외 ${pending.length - 3}개`);
      m.font = Font.systemFont(9); m.textColor = C_MUTED;
    }
  }

// ── 잠금화면 원형 ──
} else if (family === "accessoryCircular") {
  widget.addSpacer();
  const n = widget.addText(allTasks.length === 0 ? "–" : `${doneCount}/${allTasks.length}`);
  n.font = Font.boldSystemFont(17); n.textColor = C_ACCENT; n.centerAlignText();
  const l = widget.addText("완료");
  l.font = Font.systemFont(10); l.textColor = C_MUTED; l.centerAlignText();
  widget.addSpacer();

// ── 홈 화면 (small / medium / large) ──
} else {
  const isSmall  = family === "small";
  const isMedium = family === "medium";
  const maxItems = isSmall ? 3 : isMedium ? 4 : 8;
  const PAD = isSmall ? 12 : 14;

  widget.setPadding(PAD, PAD, PAD, PAD);
  widget.spacing = 0;

  // 헤더 행
  const hRow = widget.addStack();
  hRow.layoutHorizontally();

  const titleEl = hRow.addText("오늘의 할 일");
  titleEl.font = Font.boldSystemFont(isSmall ? 13 : 14);
  titleEl.textColor = C_TEXT;
  hRow.addSpacer();

  if (allTasks.length > 0) {
    const cntEl = hRow.addText(`${doneCount}/${allTasks.length}`);
    cntEl.font = Font.boldSystemFont(isSmall ? 13 : 14);
    cntEl.textColor = C_ACCENT;
  }

  widget.addSpacer(isSmall ? 7 : 9);

  // 할 일 목록
  if (allTasks.length === 0) {
    const e = widget.addText("앱에서 오늘 할 일을 설정해주세요");
    e.font = Font.systemFont(11); e.textColor = C_MUTED;
  } else if (pending.length === 0) {
    widget.addSpacer();
    const d = widget.addText("🎉 모두 완료했어요!");
    d.font = Font.mediumSystemFont(12); d.textColor = C_CHECK;
    widget.addSpacer();
  } else {
    // 미완료 우선 정렬, 완료 뒤로
    const sorted = [...pending, ...allTasks.filter(t => t.done)];
    const display = sorted.slice(0, maxItems);

    for (const task of display) {
      widget.addSpacer(isSmall ? 5 : 6);
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 5;

      const dot = row.addText(task.done ? "✓" : "·");
      dot.font = task.done ? Font.boldSystemFont(11) : Font.boldSystemFont(13);
      dot.textColor = task.done ? C_CHECK : C_ACCENT;

      const tEl = row.addText(task.title);
      tEl.font = Font.systemFont(11);
      tEl.textColor = task.done ? C_DONE : C_TEXT;
      tEl.lineLimit = 1;
    }

    if (allTasks.length > maxItems) {
      widget.addSpacer(5);
      const more = widget.addText(`외 ${allTasks.length - maxItems}개`);
      more.font = Font.systemFont(10); more.textColor = C_MUTED;
    }
  }

  widget.addSpacer();
}

Script.setWidget(widget);
if (!config.runningInWidget) {
  if (family === "small" || !family) widget.presentSmall();
  else if (family === "medium") widget.presentMedium();
  else widget.presentLarge();
}
Script.complete();
