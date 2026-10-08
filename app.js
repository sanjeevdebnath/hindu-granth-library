let book = null;
let currentChapter = null;
let currentNav = null;
let navigation = [];
let showMeaning = true;
let fontStep = 0;
let collapsedNav = JSON.parse(localStorage.getItem("hinduGranthalayaCollapsedNav") || "{}");

const digits = ["०","१","२","३","४","५","६","७","८","९"];
const hn = n => String(n).split("").map(x => digits[Number(x)]).join("");

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  return r.json();
}

function esc(s = "") {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function meaningHtml(s = "") {
  return esc(s).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function buildFlatNavigation() {
  const items = [];

  function walkSections(sections, group, parentIds = [], parentTitles = []) {
    for (const section of sections || []) {
      const ids = [...parentIds, section.id];
      const titles = [...parentTitles, section.title];

      for (const c of section.chapters || []) {
        items.push({
          ...c,
          groupId: group.id,
          groupTitle: group.title,
          sectionId: section.id,
          sectionTitle: section.title,
          sectionIds: ids,
          sectionTitles: titles,
          parentType: "khanda"
        });
      }

      if (section.sections?.length) walkSections(section.sections, group, ids, titles);
    }
  }

  for (const group of navigation) {
    if (group.type === "section") {
      for (const c of group.chapters || []) {
        items.push({...c, groupId: group.id, groupTitle: group.title, parentType: "section"});
      }
    } else if (group.type === "khanda") {
      walkSections(group.sections, group);
    }
  }
  return items;
}

function isNavCollapsed(key) {
  return collapsedNav[key] === true;
}

function saveNavState() {
  localStorage.setItem("hinduGranthalayaCollapsedNav", JSON.stringify(collapsedNav));
}

function ensureCurrentNavOpen() {
  if (!currentNav) return;
  collapsedNav[currentNav.groupId] = false;
  for (const id of currentNav.sectionIds || (currentNav.sectionId ? [currentNav.sectionId] : [])) {
    collapsedNav[id] = false;
  }
  saveNavState();
}

function toggleNavSection(key) {
  const group = navigation.find(g => g.id === key);

  // Top-level menus behave as an accordion: opening one closes all
  // other top-level groups. Nested Samhitas remain independently collapsible.
  if (group) {
    const willOpen = isNavCollapsed(key);
    for (const g of navigation) {
      collapsedNav[g.id] = true;
    }
    collapsedNav[key] = !willOpen;
    saveNavState();
    renderChapters();
    return;
  }

  collapsedNav[key] = !isNavCollapsed(key);
  saveNavState();
  renderChapters();
}

function render(blocks) {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const filtered = blocks.map(b => ({
    ...b,
    shlokas: b.shlokas.filter(s =>
      !q || `${(s.lines || []).join(" ")} ${b.meaning || ""}`.toLowerCase().includes(q)
    )
  })).filter(b => b.shlokas.length);

  const count = filtered.reduce((n, b) => n + b.shlokas.length, 0);
  document.getElementById("verseCount").textContent = q ? `${count} श्लोक मिले` : `इस अध्याय में ${count} श्लोक`;

  const pageBlocks = filtered;

  let lastSpeaker = null;
  let html = pageBlocks.map(b => {
    const showSpeaker = b.speaker && (b.speaker !== lastSpeaker || b.speaker_repeat);
    if (b.speaker) lastSpeaker = b.speaker;
    return `
    <article class="verse-group">
      ${showSpeaker ? `<div class="verse-top"><span class="speaker">${esc(b.speaker)}</span></div>` : ""}
      <div class="verse-body">
        <div class="sanskrit-group">
          ${(() => {
            const displayShlokas = [];
            for (const s of b.shlokas) {
              const last = displayShlokas[displayShlokas.length - 1];
              if (last && last.number === s.number) {
                last.lines = [...(last.lines || []), ...(s.lines || [])];
              } else {
                displayShlokas.push({ ...s, lines: [...(s.lines || [])] });
              }
            }
            return displayShlokas.map(s => `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${hn(s.number)} ॥</span>
              <div class="shloka-text">${(s.lines || []).map(line => `<div>${esc(line)}</div>`).join("")}</div>
            </div>`).join("");
          })()}
        </div>
        ${showMeaning && b.meaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${meaningHtml(b.meaning)}</div></div>` : ""}
        ${b.additional_info ? `<div class="additional-info"><div class="additional-info-label">${esc(b.additional_info.label || "अतिरिक्त जानकारी")}</div>${(b.additional_info.items || []).map(item => `<div class="additional-info-item">${meaningHtml(item)}</div>`).join("")}</div>` : ""}
      </div>
    </article>`;
  }).join("");

  if (currentChapter.opening_context && !q) {
    html = `<article class="opening-context">
      <div class="opening-sanskrit">${currentChapter.opening_context.sanskrit.map(x => `<div>${esc(x)}</div>`).join("")}</div>
      ${showMeaning && currentChapter.opening_context.meaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.opening_context.meaning)}</div></div>` : ""}
    </article>` + html;
  }

  if (currentChapter.colophon && !q) {
    html += `<article class="colophon"><div class="colophon-sanskrit">${esc(currentChapter.colophon.sanskrit)}</div>${showMeaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.colophon.meaning)}</div></div>` : ""}</article>`;
  }

  document.getElementById("verseList").innerHTML = html;
  updateReadingFontSizes();
}

function renderChapters() {
  const box = document.getElementById("chapterList");
  let html = "";

  function renderSection(section, group, level = 0) {
    const sectionCollapsed = isNavCollapsed(section.id);
    const chapters = (section.chapters || []).map(c =>
      chapterButton(c, group.id, group.title, section)
    ).join("");
    const childSections = (section.sections || []).map(child =>
      renderSection(child, group, level + 1)
    ).join("");

    const titleClass = level === 0 ? "nav-samhita-title" : "nav-nested-title";
    const wrapperClass = level === 0 ? "nav-samhita" : "nav-nested";

    return `
      <div class="${wrapperClass} ${sectionCollapsed ? "is-collapsed" : ""}">
        <button class="nav-collapse-btn ${titleClass}" data-nav-key="${esc(section.id)}" aria-expanded="${!sectionCollapsed}">
          <span class="nav-toggle-icon" aria-hidden="true">${sectionCollapsed ? "+" : "−"}</span>
          <span class="nav-header-text">${esc(section.title)}</span>
        </button>
        <div class="nav-collapse-content" ${sectionCollapsed ? "hidden" : ""}>
          ${chapters ? `<div class="nav-chapters">${chapters}</div>` : ""}
          ${childSections}
        </div>
      </div>`;
  }

  for (const group of navigation) {
    const groupCollapsed = isNavCollapsed(group.id);

    if (group.type === "section") {
      html += `<div class="nav-group nav-group-section ${groupCollapsed ? "is-collapsed" : ""}">
        <button class="nav-collapse-btn nav-group-title" data-nav-key="${esc(group.id)}" aria-expanded="${!groupCollapsed}">
          <span class="nav-toggle-icon" aria-hidden="true">${groupCollapsed ? "+" : "−"}</span>
          <span class="nav-header-text">${esc(group.title)}</span>
        </button>
        <div class="nav-collapse-content" ${groupCollapsed ? "hidden" : ""}>
          <div class="nav-chapters">${(group.chapters || []).map(c => chapterButton(c, group.id, group.title, null)).join("")}</div>
        </div>
      </div>`;
    } else if (group.type === "khanda") {
      html += `<div class="nav-group nav-khanda ${groupCollapsed ? "is-collapsed" : ""}">
        <button class="nav-collapse-btn nav-khanda-title" data-nav-key="${esc(group.id)}" aria-expanded="${!groupCollapsed}">
          <span class="nav-toggle-icon" aria-hidden="true">${groupCollapsed ? "+" : "−"}</span>
          <span class="nav-header-text">${esc(group.title)}</span>
        </button>
        <div class="nav-collapse-content" ${groupCollapsed ? "hidden" : ""}>
          ${(group.sections || []).map(section => renderSection(section, group)).join("")}
        </div>
      </div>`;
    }
  }

  box.innerHTML = html;

  box.querySelectorAll(".nav-collapse-btn").forEach(b => {
    b.onclick = () => toggleNavSection(b.dataset.navKey);
  });

  box.querySelectorAll("button[data-path]").forEach(b => b.onclick = async () => {
    await goToChapter(b.dataset.path);
  });
}

function chapterButton(c, groupId, groupTitle, section) {
  const active = currentNav && currentNav.path === c.path;
  return `<button class="chapter-link ${active ? "active" : ""}" data-path="${esc(c.path)}">
    <span class="chapter-link-number">अध्याय ${hn(c.number)}</span>
  </button>`;
}

function updateBreadcrumbs() {
  const parts = [book.title];
  if (currentNav?.parentType === "section") {
    parts.push(currentNav.groupTitle);
  } else if (currentNav?.parentType === "khanda") {
    parts.push(currentNav.groupTitle, ...(currentNav.sectionTitles || [currentNav.sectionTitle]).filter(Boolean));
  }
  document.getElementById("breadcrumbs").textContent = parts.join(" › ");
  document.getElementById("chapterEyebrow").textContent = currentNav?.parentType === "khanda"
    ? (currentNav.sectionTitles?.at(-1) || currentNav.sectionTitle || "")
    : currentNav?.groupTitle || "";
}

function updateChapterPager() {
  const flat = buildFlatNavigation();
  const index = flat.findIndex(c => c.path === currentNav?.path);
  const prevBtn = document.getElementById("prevChapterBtn");
  const nextBtn = document.getElementById("nextChapterBtn");

  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index < 0 || index >= flat.length - 1;
  prevBtn.textContent = index > 0 ? `← अध्याय ${hn(flat[index - 1].number)}` : "← पिछला अध्याय";
  nextBtn.textContent = index >= 0 && index < flat.length - 1 ? `अध्याय ${hn(flat[index + 1].number)} →` : "अगला अध्याय →";
}

async function goToChapter(path, openParents = true) {
  const flat = buildFlatNavigation();
  const nav = flat.find(c => c.path === path);
  if (!nav) return;

  currentNav = nav;
  if (openParents) ensureCurrentNavOpen();
  currentChapter = await loadJSON(nav.path);
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterOpeningHeading").textContent = currentChapter.opening_heading || "";
  document.getElementById("chapterDescription").textContent = currentChapter.opening_subtitle || currentChapter.title || "";
  updateBreadcrumbs();
  renderChapters();
  render(currentChapter.blocks);
  updateChapterPager();
  closeSidebar();
  window.scrollTo({top:0, behavior:"smooth"});
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarBackdrop").classList.add("show");
  document.body.classList.add("menu-open");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
  document.body.classList.remove("menu-open");
}

async function init() {
  book = await loadJSON("books/shivamahapurana/metadata.json");
  navigation = book.navigation || [];
  document.getElementById("bookTitle").textContent = book.title;

  // Every fresh page load starts with the entire navigation collapsed.
  // This keeps the opening screen compact and predictable for all readers.
  collapsedNav = {};
  function collapseSections(sections) {
    for (const section of sections || []) {
      collapsedNav[section.id] = true;
      collapseSections(section.sections);
    }
  }

  for (const group of navigation) {
    collapsedNav[group.id] = true;
    collapseSections(group.sections);
  }
  saveNavState();

  const flat = buildFlatNavigation();
  await goToChapter(flat[0].path, false);
}

document.getElementById("searchInput").oninput = () => { render(currentChapter.blocks); };
document.getElementById("meaningBtn").onclick = () => {
  showMeaning = !showMeaning;
  document.getElementById("meaningBtn").classList.toggle("active", showMeaning);
  render(currentChapter.blocks);
};

function updateReadingFontSizes() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const shlokaSizes = isMobile ? ["1.28rem", "1.42rem", "1.58rem", "1.76rem"] : ["1.28rem", "1.42rem", "1.58rem", "1.76rem"];
  const meaningSizes = isMobile ? ["21px", "23px", "25px", "27px"] : ["18.24px", "20.16px", "22.40px", "24.96px"];
  const shlokaSize = shlokaSizes[fontStep];
  const meaningSize = meaningSizes[fontStep];
  document.documentElement.style.setProperty("--reading", shlokaSize);
  document.documentElement.style.setProperty("--meaning-size", meaningSize);
  document.querySelectorAll(".meaning").forEach(el => el.style.setProperty("font-size", meaningSize, "important"));
}

document.getElementById("fontBtn").onclick = () => { fontStep = (fontStep + 1) % 4; updateReadingFontSizes(); };
window.addEventListener("resize", () => { updateReadingFontSizes(); if (currentChapter) render(currentChapter.blocks); });

document.getElementById("menuBtn").onclick = () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
};
document.getElementById("sidebarBackdrop").onclick = closeSidebar;
document.getElementById("closeMenuBtn").onclick = closeSidebar;
document.getElementById("tocBtn").onclick = () => document.getElementById("verseList").scrollIntoView({behavior:"smooth"});

document.getElementById("prevChapterBtn").onclick = async () => {
  const flat = buildFlatNavigation();
  const index = flat.findIndex(c => c.path === currentNav?.path);
  if (index > 0) await goToChapter(flat[index - 1].path);
};
document.getElementById("nextChapterBtn").onclick = async () => {
  const flat = buildFlatNavigation();
  const index = flat.findIndex(c => c.path === currentNav?.path);
  if (index >= 0 && index < flat.length - 1) await goToChapter(flat[index + 1].path);
};

init().catch(e => {
  console.error(e);
  document.getElementById("verseList").innerHTML = `<div class="verse-group"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`;
});
