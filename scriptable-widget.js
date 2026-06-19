// ✅ Sun To-Do — Scriptable Widget
// 1. Scriptable 앱 설치 (App Store 무료)
// 2. 아래 세 줄을 본인 정보로 수정
// 3. 홈 화면 또는 잠금화면에 Scriptable 위젯 추가 → 이 스크립트 선택

const BASE_URL = "https://sun-to-do.vercel.app";
const USERNAME = "YOUR_USERNAME";
const PASSWORD = "YOUR_PASSWORD";

// ───────────────────────────────────────────
const AUTH = btoa(`${USERNAME}:${PASSWORD}`);

async function fetchTasks() {
  try {
    const req = new Request(`${BASE_URL}/api/today`);
    req.headers = { Authorization: `Basic ${AUTH}` };
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

// 색상
const COLOR_BG    = new Color("#ffffff");
const COLOR_TEXT  = new Color("#111827");
const COLOR_MUTED = new Color("#9ca3af");
const COLOR_BLUE  = new Color("#3b82f6");
const COLOR_GREEN = new Color("#22c55e");

const widget = new ListWidget();
widget.backgroundColor = COLOR_BG;

if (family === "accessoryRectangular") {
  // ── 잠금화면 직사각형 위젯 ──
  const stack = widget.addStack();
  stack.layoutVertically();
  stack.spacing = 1;

  const header = stack.addText(
    allTasks.length === 0
      ? "오늘의 할 일"
      : `✓ ${doneCount}/${allTasks.length}  남은 할 일 ${pending.length}개`
  );
  header.font = Font.boldSystemFont(10);
  header.textColor = COLOR_BLUE;

  stack.addSpacer(2);

  if (pending.length === 0 && allTasks.length === 0) {
    const t = stack.addText("오늘 할 일을 앱에서 설정해주세요");
    t.font = Font.systemFont(10);
    t.textColor = COLOR_MUTED;
  } else if (pending.length === 0) {
    const t = stack.addText("🎉 오늘 할 일 모두 완료!");
    t.font = Font.systemFont(10);
    t.textColor = COLOR_GREEN;
  } else {
    const max = 3;
    for (const task of pending.slice(0, max)) {
      const t = stack.addText(`· ${task.title}`);
      t.font = Font.systemFont(10);
      t.textColor = COLOR_TEXT;
      t.lineLimit = 1;
    }
    if (pending.length > max) {
      const more = stack.addText(`  외 ${pending.length - max}개 더`);
      more.font = Font.systemFont(9);
      more.textColor = COLOR_MUTED;
    }
  }

} else if (family === "accessoryCircular") {
  // ── 잠금화면 원형 위젯 ──
  widget.addSpacer();
  const countText = widget.addText(
    allTasks.length === 0 ? "–" : `${doneCount}/${allTasks.length}`
  );
  countText.font = Font.boldSystemFont(16);
  countText.textColor = COLOR_BLUE;
  countText.centerAlignText();
  const label = widget.addText("완료");
  label.font = Font.systemFont(10);
  label.textColor = COLOR_MUTED;
  label.centerAlignText();
  widget.addSpacer();

} else {
  // ── 홈 화면 위젯 (small / medium / large) ──
  widget.setPadding(14, 14, 14, 14);

  const headerRow = widget.addStack();
  headerRow.layoutHorizontally();
  headerRow.bottomAlignContent();

  const titleEl = headerRow.addText("오늘의 할 일");
  titleEl.font = Font.boldSystemFont(14);
  titleEl.textColor = COLOR_TEXT;
  headerRow.addSpacer();

  const countEl = headerRow.addText(
    allTasks.length > 0 ? `${doneCount}/${allTasks.length}` : ""
  );
  countEl.font = Font.boldSystemFont(14);
  countEl.textColor = COLOR_BLUE;

  widget.addSpacer(10);

  if (allTasks.length === 0) {
    const empty = widget.addText("앱에서 오늘 할 일을 설정해주세요");
    empty.font = Font.systemFont(12);
    empty.textColor = COLOR_MUTED;
  } else if (pending.length === 0) {
    widget.addSpacer();
    const done = widget.addText("🎉 오늘 할 일을\n모두 완료했어요!");
    done.font = Font.mediumSystemFont(13);
    done.textColor = COLOR_GREEN;
    widget.addSpacer();
  } else {
    const maxItems = family === "large" ? 10 : family === "medium" ? 6 : 4;
    const display = allTasks.slice(0, maxItems);

    for (const task of display) {
      const row = widget.addStack();
      row.layoutHorizontally();
      row.spacing = 6;
      row.bottomAlignContent();

      const dot = row.addText(task.done ? "✓" : "•");
      dot.font = Font.systemFont(12);
      dot.textColor = task.done ? COLOR_GREEN : COLOR_BLUE;

      const titleT = row.addText(task.title);
      titleT.font = Font.systemFont(12);
      titleT.textColor = task.done ? COLOR_MUTED : COLOR_TEXT;
      titleT.lineLimit = 1;

      widget.addSpacer(5);
    }

    if (allTasks.length > maxItems) {
      widget.addSpacer(2);
      const more = widget.addText(`외 ${allTasks.length - maxItems}개`);
      more.font = Font.systemFont(11);
      more.textColor = COLOR_MUTED;
    }
  }

  widget.addSpacer();
  const updated = widget.addText(
    data.date ? `${data.date} 기준` : ""
  );
  updated.font = Font.systemFont(9);
  updated.textColor = COLOR_MUTED;
}

Script.setWidget(widget);
if (!config.runningInWidget) widget.presentSmall();
Script.complete();
