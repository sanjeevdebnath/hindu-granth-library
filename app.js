let book = null;
let currentChapter = null;
let showMeaning = true;
let fontStep = 0;

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

function render(blocks) {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();

  const filtered = blocks.map(b => ({
    ...b,
    shlokas: b.shlokas.filter(s =>
      !q || `${(s.lines || []).join(" ")} ${b.meaning || ""}`.toLowerCase().includes(q)
    )
  })).filter(b => b.shlokas.length);

  const count = filtered.reduce((n, b) => n + b.shlokas.length, 0);
  document.getElementById("verseCount").textContent =
    q ? `${count} श्लोक मिले` : `इस अध्याय में ${count} श्लोक`;

  let lastSpeaker = null;
  document.getElementById("verseList").innerHTML = filtered.map(b => {
    const showSpeaker = b.speaker && b.speaker !== lastSpeaker;
    if (b.speaker) lastSpeaker = b.speaker;
    return `
    <article class="verse-group">
      ${showSpeaker ? `<div class="verse-top"><span class="speaker">${esc(b.speaker)}</span></div>` : ""}
      <div class="verse-body">
        <div class="sanskrit-group">
          ${b.shlokas.map(s => `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${hn(s.number)} ॥</span>
              <div class="shloka-text">${(s.lines || []).map(line => `<div>${esc(line)}</div>`).join("")}</div>`).join("")}</div>
            </div>`).join("")}
        </div>
        ${showMeaning && b.meaning ? `
          <div class="meaning">
            <div class="meaning-label">हिन्दी अर्थ</div>
            <div>${esc(b.meaning)}</div>
          </div>` : ""}
      </div>
    </article>`;
  }).join("") + (currentChapter.colophon && !q ? `
    <article class="colophon">
      <div class="colophon-sanskrit">${esc(currentChapter.colophon.sanskrit)}</div>
      ${showMeaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div><div>${esc(currentChapter.colophon.meaning)}</div></div>` : ""}
    </article>` : "");

  updateReadingFontSizes();
}
function renderChapters() {
  const box = document.getElementById("chapterList");
  const chapters = book.sections[0].chapters;
  box.innerHTML = chapters.map(c => `
    <button class="chapter-link ${c.number === currentChapter.chapter ? "active":""}" data-id="${c.id}">
      <span>अध्याय ${hn(c.number)}</span>
    </button>`).join("");

  box.querySelectorAll("button").forEach(b => b.onclick = async () => {
    const index = chapters.findIndex(x => x.id === b.dataset.id);
    await goToChapterByIndex(index);
  });
}

function updateChapterPager() {
  const chapters = book.sections[0].chapters;
  const index = chapters.findIndex(c => c.number === currentChapter.chapter);
  const prevBtn = document.getElementById("prevChapterBtn");
  const nextBtn = document.getElementById("nextChapterBtn");

  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index < 0 || index >= chapters.length - 1;

  prevBtn.textContent = index > 0 ? `← अध्याय ${hn(chapters[index - 1].number)}` : "← पिछला अध्याय";
  nextBtn.textContent = index < chapters.length - 1 ? `अध्याय ${hn(chapters[index + 1].number)} →` : "अगला अध्याय →";

  prevBtn.setAttribute("aria-label", index > 0 ? `अध्याय ${hn(chapters[index - 1].number)} पर जाएँ` : "पिछला अध्याय उपलब्ध नहीं");
  nextBtn.setAttribute("aria-label", index < chapters.length - 1 ? `अध्याय ${hn(chapters[index + 1].number)} पर जाएँ` : "अगला अध्याय उपलब्ध नहीं");
}

async function goToChapterByIndex(index) {
  const chapters = book.sections[0].chapters;
  if (index < 0 || index >= chapters.length) return;

  const c = chapters[index];
  currentChapter = await loadJSON(`books/shivamahapurana/mahatmya/${c.id}.json`);
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent = currentChapter.title;
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
  currentChapter = await loadJSON("books/shivamahapurana/mahatmya/chapter-01.json");
  document.getElementById("bookTitle").textContent = book.title;
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent = currentChapter.title;
  renderChapters();
  render(currentChapter.blocks);
  updateChapterPager();
}

document.getElementById("searchInput").oninput = () => render(currentChapter.blocks);

document.getElementById("meaningBtn").onclick = () => {
  showMeaning = !showMeaning;
  document.getElementById("meaningBtn").classList.toggle("active", showMeaning);
  render(currentChapter.blocks);
};

function updateReadingFontSizes() {
  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  const shlokaSizes = isMobile
    ? ["1.28rem", "1.42rem", "1.58rem", "1.76rem"]
    : ["1.28rem", "1.42rem", "1.58rem", "1.76rem"];

  const meaningSizes = isMobile
    ? ["21px", "23px", "25px", "27px"]
    : ["18.24px", "20.16px", "22.40px", "24.96px"];

  const shlokaSize = shlokaSizes[fontStep];
  const meaningSize = meaningSizes[fontStep];

  document.documentElement.style.setProperty("--reading", shlokaSize);
  document.documentElement.style.setProperty("--meaning-size", meaningSize);

  // Apply directly as well as through the CSS variable so desktop browsers
  // cannot override the selected reading size with an older fixed rule.
  document.querySelectorAll(".meaning").forEach(el => {
    el.style.setProperty("font-size", meaningSize, "important");
  });
}
document.getElementById("fontBtn").onclick = () => {
  fontStep = (fontStep + 1) % 4;
  updateReadingFontSizes();
};

window.addEventListener("resize", updateReadingFontSizes);
updateReadingFontSizes();

document.getElementById("menuBtn").onclick = () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
};

document.getElementById("sidebarBackdrop").onclick = closeSidebar;
document.getElementById("closeMenuBtn").onclick = closeSidebar;

document.getElementById("tocBtn").onclick = () =>
  document.getElementById("verseList").scrollIntoView({behavior:"smooth"});

document.getElementById("prevChapterBtn").onclick = async () => {
  const chapters = book.sections[0].chapters;
  const index = chapters.findIndex(c => c.number === currentChapter.chapter);
  if (index > 0) await goToChapterByIndex(index - 1);
};

document.getElementById("nextChapterBtn").onclick = async () => {
  const chapters = book.sections[0].chapters;
  const index = chapters.findIndex(c => c.number === currentChapter.chapter);
  if (index >= 0 && index < chapters.length - 1) await goToChapterByIndex(index + 1);
};

init().catch(e =>
  document.getElementById("verseList").innerHTML =
    `<div class="verse-group"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`
);
