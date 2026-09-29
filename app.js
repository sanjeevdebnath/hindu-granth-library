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

function render(groups) {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();

  const filtered = groups.map(g => ({
    ...g,
    shlokas: g.shlokas.filter(s =>
      !q || `${s.sanskrit} ${g.meaning || ""} ${g.speaker || ""}`.toLowerCase().includes(q)
    )
  })).filter(g => g.shlokas.length);

  const count = filtered.reduce((n, g) => n + g.shlokas.length, 0);
  document.getElementById("verseCount").textContent =
    q ? `${count} श्लोक मिले` : `इस अध्याय में ${count} श्लोक`;

  document.getElementById("verseList").innerHTML = filtered.map(g => `
    <article class="verse-group">
      <div class="verse-top">
        <span class="verse-number">${hn(g.shlokas[0].number)}</span>
        <span class="speaker">${esc(g.speaker || "")}</span>
        ${g.shlokas.length > 1 ? `<span class="group-range">श्लोक ${hn(g.shlokas[0].number)}–${hn(g.shlokas[g.shlokas.length - 1].number)}</span>` : ""}
      </div>
      <div class="verse-body">
        <div class="sanskrit-group">
          ${g.shlokas.map(s => `
            <div class="shloka" id="shloka-${s.number}">
              <span class="shloka-number">॥ ${hn(s.number)} ॥</span>
              <div>${esc(s.sanskrit)}</div>
            </div>`).join("")}
        </div>
        ${showMeaning ? `
          <div class="meaning">
            <div class="meaning-label">हिन्दी अर्थ</div>
            <div>${esc(g.meaning || "")}</div>
          </div>` : ""}
      </div>
    </article>`).join("");
}

function renderChapters() {
  const box = document.getElementById("chapterList");
  const chapters = book.sections[0].chapters;
  box.innerHTML = chapters.map(c => `
    <button class="chapter-link ${c.number === currentChapter.chapter ? "active":""}" data-id="${c.id}">
      <span>${hn(c.number)}</span><span>अध्याय ${hn(c.number)}</span>
    </button>`).join("");

  box.querySelectorAll("button").forEach(b => b.onclick = async () => {
    const c = chapters.find(x => x.id === b.dataset.id);
    currentChapter = await loadJSON(`books/shivamahapurana/mahatmya/${c.id}.json`);
    document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
    document.getElementById("chapterDescription").textContent = currentChapter.title;
    renderChapters();
    render(currentChapter.groups);
    closeSidebar();
    window.scrollTo({top:0, behavior:"smooth"});
  });
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
  render(currentChapter.groups);
}

document.getElementById("searchInput").oninput = () => render(currentChapter.groups);

document.getElementById("meaningBtn").onclick = () => {
  showMeaning = !showMeaning;
  document.getElementById("meaningBtn").classList.toggle("active", showMeaning);
  render(currentChapter.groups);
};

document.getElementById("fontBtn").onclick = () => {
  fontStep = (fontStep + 1) % 4;
  document.documentElement.style.setProperty("--reading", ["1.28rem","1.42rem","1.58rem","1.76rem"][fontStep]);
};

document.getElementById("menuBtn").onclick = () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
};

document.getElementById("sidebarBackdrop").onclick = closeSidebar;
document.getElementById("closeMenuBtn").onclick = closeSidebar;

document.getElementById("tocBtn").onclick = () =>
  document.getElementById("verseList").scrollIntoView({behavior:"smooth"});

init().catch(e =>
  document.getElementById("verseList").innerHTML =
    `<div class="verse-group"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`
);
