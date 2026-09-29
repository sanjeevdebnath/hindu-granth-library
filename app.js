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

function render(verses) {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const filtered = verses.filter(v => !q || `${v.sanskrit} ${v.meaning} ${v.speaker}`.toLowerCase().includes(q));
  document.getElementById("verseCount").textContent =
    q ? `${filtered.length} श्लोक मिले` : `इस अध्याय में ${filtered.length} श्लोक`;

  document.getElementById("verseList").innerHTML = filtered.map(v => `
    <article class="verse" id="shloka-${v.number}">
      <div class="verse-top"><span class="verse-number">${hn(v.number)}</span><span class="speaker">${esc(v.speaker)}</span></div>
      <div class="verse-body">
        <div class="sanskrit">${esc(v.sanskrit)}</div>
        ${showMeaning ? `<div class="meaning"><div class="meaning-label">हिन्दी अर्थ</div>${esc(v.meaning)}</div>` : ""}
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
    render(currentChapter.verses);
    window.scrollTo({top:0, behavior:"smooth"});
  });
}

async function init() {
  book = await loadJSON("books/shivamahapurana/metadata.json");
  currentChapter = await loadJSON("books/shivamahapurana/mahatmya/chapter-01.json");
  document.getElementById("bookTitle").textContent = book.title;
  document.getElementById("chapterTitle").textContent = `अध्याय ${hn(currentChapter.chapter)}`;
  document.getElementById("chapterDescription").textContent = currentChapter.title;
  renderChapters();
  render(currentChapter.verses);
}

document.getElementById("searchInput").oninput = () => render(currentChapter.verses);
document.getElementById("meaningBtn").onclick = () => {
  showMeaning = !showMeaning;
  document.getElementById("meaningBtn").classList.toggle("active", showMeaning);
  render(currentChapter.verses);
};
document.getElementById("fontBtn").onclick = () => {
  fontStep = (fontStep + 1) % 4;
  document.documentElement.style.setProperty("--reading", ["1.28rem","1.42rem","1.58rem","1.76rem"][fontStep]);
};
document.getElementById("menuBtn").onclick = () => document.getElementById("sidebar").classList.toggle("open");
document.getElementById("tocBtn").onclick = () => document.getElementById("verseList").scrollIntoView({behavior:"smooth"});
init().catch(e => document.getElementById("verseList").innerHTML = `<div class="verse"><div class="verse-body">सामग्री लोड नहीं हो सकी।</div></div>`);
