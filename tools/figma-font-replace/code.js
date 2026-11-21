// Font Replace (cciD) — 특정 폰트(이름 + 굵기)를 다른 폰트로 바꾸는 플러그인
// 범위: 선택한 레이어 / 현재 페이지 / 파일 전체
// 한 텍스트 안에 폰트가 섞여 있어도 해당 구간만 바꿉니다.

figma.showUI(__html__, { width: 560, height: 640, themeColors: true });

const keyOf = (f) => `${f.family}|${f.style}`;

/** 범위 안의 텍스트 레이어 */
async function collectTexts(scope) {
  if (scope === "all") {
    await figma.loadAllPagesAsync();
    return figma.root.findAllWithCriteria({ types: ["TEXT"] });
  }
  if (scope === "selection") {
    const out = new Set();
    for (const node of figma.currentPage.selection) {
      if (node.type === "TEXT") out.add(node);
      if ("findAllWithCriteria" in node)
        for (const t of node.findAllWithCriteria({ types: ["TEXT"] })) out.add(t);
    }
    return [...out];
  }
  return figma.currentPage.findAllWithCriteria({ types: ["TEXT"] });
}

/** 범위 안에서 쓰이는 폰트 목록: [{ family, style, nodes, missing }] */
async function scan(scope) {
  const texts = await collectTexts(scope);
  const used = new Map();
  for (const t of texts) {
    const seen = new Set();
    for (const seg of t.getStyledTextSegments(["fontName"])) {
      const k = keyOf(seg.fontName);
      if (!used.has(k))
        used.set(k, { ...seg.fontName, nodes: 0, missing: false });
      if (!seen.has(k)) {
        used.get(k).nodes++;
        seen.add(k);
      }
      if (t.hasMissingFont) used.get(k).missing = true;
    }
  }
  return {
    texts: texts.length,
    fonts: [...used.values()].sort((a, b) =>
      keyOf(a).localeCompare(keyOf(b)),
    ),
  };
}

/** 설치된 폰트: { family: [style, ...] } */
async function availableFonts() {
  const list = await figma.listAvailableFontsAsync();
  const map = {};
  for (const { fontName } of list)
    (map[fontName.family] ??= []).push(fontName.style);
  return map;
}

const loaded = new Map();
const load = (font) => {
  const k = keyOf(font);
  if (!loaded.has(k)) loaded.set(k, figma.loadFontAsync(font));
  return loaded.get(k);
};

/** 바꾸기: mapping = { "From|Style": { family, style } } */
async function replace(scope, mapping, includeStyles) {
  const texts = await collectTexts(scope);
  let changedNodes = 0;
  let changedRanges = 0;
  const failed = [];

  // 바꿀 폰트를 먼저 모두 불러오기 (없으면 아무것도 안 바꿈)
  const targets = Object.values(mapping);
  for (const to of targets) {
    try {
      await load(to);
    } catch {
      return { error: `바꿀 폰트를 불러올 수 없어요: ${to.family} ${to.style}` };
    }
  }

  for (const t of texts) {
    const segs = t.getStyledTextSegments(["fontName"]);
    let touched = false;
    for (const seg of segs) {
      const to = mapping[keyOf(seg.fontName)];
      if (!to) continue;
      try {
        // 원래 폰트가 설치돼 있으면 불러 두기 (없는 폰트여도 바꾸기는 시도)
        if (!t.hasMissingFont) await load(seg.fontName);
        t.setRangeFontName(seg.start, seg.end, to);
        changedRanges++;
        touched = true;
      } catch (e) {
        failed.push(`${t.name.slice(0, 30)} — ${String(e).slice(0, 80)}`);
      }
    }
    if (touched) changedNodes++;
  }

  // 텍스트 스타일 안의 폰트
  let changedStyles = 0;
  if (includeStyles) {
    for (const s of await figma.getLocalTextStylesAsync()) {
      const to = mapping[keyOf(s.fontName)];
      if (!to) continue;
      try {
        await load(s.fontName).catch(() => {});
        s.fontName = to;
        changedStyles++;
      } catch (e) {
        failed.push(`스타일 ${s.name} — ${String(e).slice(0, 80)}`);
      }
    }
  }

  return { changedNodes, changedRanges, changedStyles, failed: failed.slice(0, 20), failedCount: failed.length };
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "init") {
      figma.ui.postMessage({ type: "fonts", fonts: await availableFonts() });
      figma.ui.postMessage({ type: "scan", ...(await scan(msg.scope)) });
    }
    if (msg.type === "scan") {
      figma.ui.postMessage({ type: "scan", ...(await scan(msg.scope)) });
    }
    if (msg.type === "replace") {
      const result = await replace(msg.scope, msg.mapping, msg.includeStyles);
      if (result.error) {
        figma.notify(result.error, { error: true });
      } else {
        figma.notify(
          `텍스트 ${result.changedNodes}개 · 구간 ${result.changedRanges}곳 바꿈` +
            (result.changedStyles ? ` · 스타일 ${result.changedStyles}개` : "") +
            (result.failedCount ? ` · 실패 ${result.failedCount}` : ""),
        );
      }
      figma.ui.postMessage({ type: "done", ...result });
      figma.ui.postMessage({ type: "scan", ...(await scan(msg.scope)) });
    }
    if (msg.type === "close") figma.closePlugin();
  } catch (e) {
    figma.ui.postMessage({ type: "done", error: String(e) });
  }
};
