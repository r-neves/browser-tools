let currentVideoId = null;

function injectSummarizeButton() {
  const videoId = new URLSearchParams(window.location.search).get('v');

  if (!videoId) {
    const existing = document.getElementById('ext-summarize-btn');
    if (existing) existing.remove();
    currentVideoId = null;
    return;
  }

  if (videoId !== currentVideoId) {
    const existing = document.getElementById('ext-summarize-btn');
    if (existing) existing.remove();
  }

  if (document.getElementById('ext-summarize-btn')) return;

  const topLevelButtons = document.querySelector('ytd-watch-metadata #top-level-buttons-computed');
  if (!topLevelButtons) return;

  currentVideoId = videoId;

  const btn = document.createElement('button');
  btn.id = 'ext-summarize-btn';
  btn.textContent = 'Summarize';
  btn.style.cssText = `
    background-color: #065fd4;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 18px;
    padding: 0 16px;
    height: 36px;
    font-size: 14px;
    font-weight: 500;
    font-family: "Roboto","Arial",sans-serif;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
  `;

  btn.addEventListener('click', () => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const prompt = encodeURIComponent(`Summarize this YouTube video: ${videoUrl}`);
    window.open(`https://claude.ai/new?q=${prompt}`, '_blank');
  });

  topLevelButtons.insertBefore(btn, topLevelButtons.firstChild);
}

const observer = new MutationObserver(() => {
  injectSummarizeButton();
});

observer.observe(document.body, { childList: true, subtree: true });
injectSummarizeButton();
