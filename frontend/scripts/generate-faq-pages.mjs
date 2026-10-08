import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const css = `<style>
    :root {
      --ink: #0f172a; --ink-body: #334155; --muted: #64748b;
      --line: rgba(6, 78, 59, 0.12); --line-neutral: #e2e8f0;
      --surface: #ffffff; --surface-tint: #f8fffc;
      --canvas-top: #ecfdf5; --canvas-mid: #f8fafc; --canvas-bottom: #f0fdf9;
      --hero: #064e3b; --accent: #047857; --accent-soft: #d1fae5; --accent-muted: #6ee7b7;
      --r: 8px;
      --font: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      --space-1: 8px; --space-2: 16px; --space-3: 24px; --space-4: 32px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0; font-family: var(--font); font-size: 15px; line-height: 1.65; color: var(--ink-body);
      background: linear-gradient(165deg, var(--canvas-top) 0%, var(--canvas-mid) 38%, var(--canvas-bottom) 100%);
      min-height: 100vh; -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 46rem; margin: 0 auto; padding: var(--space-3) var(--space-2) var(--space-4); }
    .hero {
      background: var(--hero); color: #f9fafb; padding: var(--space-3); margin-bottom: var(--space-2); border-radius: var(--r);
    }
    .eyebrow {
      display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--accent-muted); margin: 0 0 var(--space-1);
    }
    .hero h1 {
      margin: 0 0 10px; font-size: clamp(1.35rem, 3.5vw, 1.65rem); font-weight: 700; letter-spacing: -0.025em;
      line-height: 1.25; color: #fff;
    }
    .hero .lede { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(249, 250, 251, 0.88); max-width: 40em; }
    .hero .lede em { font-style: normal; font-weight: 600; color: #fff; }
    .toolbar { position: sticky; top: 0; z-index: 40; padding-top: var(--space-1); margin-bottom: var(--space-3); }
    .toolbar-card {
      background: rgba(255, 255, 255, 0.92); border: 1px solid var(--line); border-radius: var(--r);
      padding: var(--space-2); box-shadow: 0 1px 3px rgba(6, 78, 59, 0.06);
    }
    .toolbar label[for="faq-search"] { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
    .search-wrap { position: relative; }
    .search-wrap::before {
      content: ""; position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; opacity: 0.4;
      background: no-repeat center / contain;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' d='M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z'/%3E%3C/svg%3E");
      pointer-events: none;
    }
    #faq-search {
      width: 100%; height: 44px; padding: 0 14px 0 40px; border: 1px solid var(--line-neutral); border-radius: var(--r);
      font: inherit; font-size: 14px; color: var(--ink); background: var(--surface-tint);
      transition: border-color 0.12s, background 0.12s;
    }
    #faq-search:focus { outline: none; background: var(--surface); border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    #search-status { margin: 8px 0 0; font-size: 12px; color: var(--muted); min-height: 1.3em; line-height: 1.45; }
    .table-wrap { overflow-x: auto; margin: 10px 0; -webkit-overflow-scrolling: touch; }
    .faq-table { width: 100%; min-width: 540px; border-collapse: collapse; font-size: 13px; line-height: 1.45; }
    .faq-table th, .faq-table td { border: 1px solid var(--line-neutral); padding: 9px 11px; vertical-align: top; text-align: left; }
    .faq-table thead th { background: #f8fafc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .faq-table tbody td:first-child { font-weight: 600; color: var(--ink); }
    main { margin: 0; }
    .platform { margin-bottom: var(--space-4); scroll-margin-top: 100px; }
    article.card {
      background: linear-gradient(180deg, #ffffff 0%, var(--surface-tint) 100%); border: 1px solid var(--line);
      border-radius: var(--r); padding: var(--space-2) 18px; margin-bottom: var(--space-2); box-shadow: 0 1px 2px rgba(6, 78, 59, 0.04);
    }
    article.card h3 { margin: 0 0 10px; font-size: 14px; font-weight: 700; letter-spacing: -0.01em; color: var(--hero); line-height: 1.35; }
    article.card p { margin: 8px 0; color: var(--ink-body); font-size: 14px; }
    article.card p strong { color: var(--ink); font-weight: 600; }
    article.card .subhead { margin: var(--space-2) 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
    article.card ol, article.card ul { margin: 4px 0 8px; padding-left: 1.2em; color: var(--ink-body); font-size: 14px; }
    article.card li { margin: 6px 0; padding-left: 2px; }
    article.card li::marker { color: var(--accent); font-weight: 600; }
    .ui-quote { font-weight: 700; color: var(--ink); }
    .hint {
      margin-top: var(--space-2); padding: 12px 14px 12px 16px; background: var(--accent-soft);
      border: 1px solid rgba(6, 78, 59, 0.12); border-left: 4px solid var(--accent); border-radius: var(--r);
      font-size: 13px; line-height: 1.55; color: var(--ink-body);
    }
    .hint-quote { display: block; font-weight: 700; font-size: 14px; line-height: 1.55; color: #064e3b; }
    footer { margin-top: var(--space-4); padding-top: var(--space-2); border-top: 1px solid var(--line-neutral); text-align: center; font-size: 12px; color: var(--muted); }
    footer p { margin: 0; }
    @media (min-width: 480px) {
      .page { padding-left: var(--space-3); padding-right: var(--space-3); }
      .hero { padding: var(--space-3) 28px; }
      article.card { padding-left: 20px; padding-right: 20px; }
    }
    @media print {
      body { background: #fff; }
      .hero { color: #000; background: #f3f4f6; border: 1px solid var(--line); }
      .toolbar { position: static; }
      #faq-search, #search-status { display: none !important; }
      article.card { break-inside: avoid; }
    }
  </style>`;

const script = `<script>
    (function () {
      var input = document.getElementById("faq-search");
      var status = document.getElementById("search-status");
      var cards = document.querySelectorAll("article.card");
      var platforms = document.querySelectorAll(".platform");
      function norm(s) {
        return String(s || "").toLowerCase().replace(/\\s+/g, " ").trim();
      }
      function run() {
        var q = norm(input.value);
        var tokens = q ? q.split(" ").filter(Boolean) : [];
        var shown = 0;
        cards.forEach(function (card) {
          var kw = norm(card.getAttribute("data-keywords") || "");
          var body = norm(card.textContent || "");
          var hay = kw + " " + body;
          var match = tokens.length === 0 || tokens.some(function (t) { return hay.indexOf(t) !== -1; });
          card.style.display = match ? "" : "none";
          if (match) shown++;
        });
        platforms.forEach(function (plat) {
          var any = false;
          plat.querySelectorAll("article.card").forEach(function (c) {
            if (c.style.display !== "none") any = true;
          });
          plat.style.display = any ? "" : "none";
        });
        if (tokens.length === 0) {
          status.textContent = "All topics visible — type to filter.";
        } else if (shown === 0) {
          status.textContent = "No matches. Try shorter words.";
        } else {
          status.textContent = "Showing " + shown + " topic" + (shown === 1 ? "" : "s") + " matching your search.";
        }
      }
      input.addEventListener("input", run);
      input.addEventListener("search", run);
      run();
    })();
  </script>`;

function shellPage(title, description, heroTitle, ledeHtml, placeholder, mainInner) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#064e3b" />
  <meta name="description" content="${description}" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
  ${css}
</head>
<body>
  <div class="page">
    <div class="hero">
      <span class="eyebrow">Community Impact Challenge</span>
      <h1>${heroTitle}</h1>
      <p class="lede">${ledeHtml}</p>
    </div>
    <div class="toolbar">
      <div class="toolbar-card">
        <label for="faq-search">Search</label>
        <div class="search-wrap">
          <input type="search" id="faq-search" placeholder="${placeholder}" autocomplete="off" enterkeyhint="search" spellcheck="false" />
        </div>
        <p id="search-status" aria-live="polite"></p>
      </div>
    </div>
    <main>
      <section class="platform" id="all-topics">
${mainInner}
      </section>
    </main>
    <footer><p>Community Impact Challenge — Digital Detox</p></footer>
  </div>
  ${script}
</body>
</html>`;
}

const baselineMain = `
        <article class="card" data-keywords="before start once estimate zero devices baseline introduction overview">
          <h3>Baseline FAQs</h3>
          <p>This FAQ helps participants complete the <strong>Baseline Assessment</strong> page. The baseline is your starting point and should capture your current digital habits and device usage before the challenge begins.</p>
          <p class="subhead">Before you start</p>
          <ul>
            <li>Complete the baseline once only.</li>
            <li>Use the same devices and accounts whenever possible.</li>
            <li>If an exact number is not available, a reasonable estimate is fine.</li>
            <li>If a field does not apply, enter 0.</li>
          </ul>
        </article>

        <article class="card" data-keywords="table fields reference phones storage computer tablet cloud screen streaming chatgpt downloads llm baseline columns">
          <h3>Baseline fields (quick reference)</h3>
          <div class="table-wrap">
            <table class="faq-table">
              <thead><tr><th>Field name</th><th>What to enter</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td>Phones Owned</td><td>Number of smartphones actively used</td><td>Do not count old or unused phones.</td></tr>
                <tr><td>Storage Used on Phone (GB)</td><td>Used storage on your main phone</td><td>Check your phone's storage settings.</td></tr>
                <tr><td>Computers Owned (Laptops/Desktops)</td><td>Number of laptops/desktops regularly used</td><td>Count computers you actively use.</td></tr>
                <tr><td>Storage Used on Computer (GB)</td><td>Used storage on your main computer</td><td>Check the main drive used space.</td></tr>
                <tr><td>Tablets Owned</td><td>Number of tablets actively used</td><td>Count tablets you currently use.</td></tr>
                <tr><td>Storage Used on Tablet (GB)</td><td>Used storage on your main tablet</td><td>Check your tablet storage settings.</td></tr>
                <tr><td>Active Cloud Storage Accounts</td><td>Number of active cloud services used</td><td>For example Google Drive, iCloud, OneDrive, Dropbox.</td></tr>
                <tr><td>Cloud Storage Used (GB)</td><td>Total storage used across active cloud accounts</td><td>Add storage used across all active services.</td></tr>
                <tr><td>Average Daily Screen Time (hours)</td><td>Average screen time per day</td><td>Use device activity tools where available.</td></tr>
                <tr><td>Video Streaming (hours/week)</td><td>Weekly time spent on streaming apps</td><td>Add up the last week's viewing time.</td></tr>
                <tr><td>Number of prompts/questions asked per week to ChatGPT (and similar AI tools)</td><td>Typical number of prompts/messages sent in a week</td><td>A reasonable estimate is fine.</td></tr>
                <tr><td>Estimated Weekly Downloads (GB)</td><td>Typical weekly download volume</td><td>Include apps, files, media, and updates.</td></tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card" data-keywords="phones owned smartphone count active devices">
          <h3>Phones Owned</h3>
          <p>Enter the number of smartphones you actively use. Do not count unused, broken, or old devices.</p>
        </article>

        <article class="card" data-keywords="android iphone storage phone gb settings general iphone storage used">
          <h3>Storage Used on Phone (GB)</h3>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Storage</strong>.</li>
            <li>On some phones, this may be under <em>Device care</em>, <em>Device maintenance</em>, or <em>About phone &gt; Storage</em>.</li>
            <li>Note the <strong>Used</strong> or <strong>Used space</strong> amount in GB.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>General</strong>.</li>
            <li>Tap <strong>iPhone Storage</strong>.</li>
            <li>Note the used amount shown at the top.</li>
          </ol>
        </article>

        <article class="card" data-keywords="computers laptops desktops owned count">
          <h3>Computers Owned (Laptops/Desktops)</h3>
          <p>Enter the number of laptops or desktops you use regularly.</p>
        </article>

        <article class="card" data-keywords="windows mac storage computer gb system c drive about this mac">
          <h3>Storage Used on Computer (GB)</h3>
          <p class="subhead">Windows</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>System</strong>.</li>
            <li>Tap <strong>Storage</strong>.</li>
            <li>Open the main drive, usually <strong>C:</strong>.</li>
            <li>Note the <strong>Used space</strong> in GB.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Click the <strong>Apple</strong> menu.</li>
            <li>Click <strong>About This Mac</strong>.</li>
            <li>Open <strong>Storage</strong>.</li>
            <li>Note the <strong>Used</strong> amount in GB.</li>
          </ol>
        </article>

        <article class="card" data-keywords="tablets owned ipad android tablet count">
          <h3>Tablets Owned</h3>
          <p>Enter the number of tablets you actively use.</p>
        </article>

        <article class="card" data-keywords="tablet storage ipad android settings general ipad storage">
          <h3>Storage Used on Tablet (GB)</h3>
          <p class="subhead">Android tablet</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Storage</strong>.</li>
            <li>Note the used storage in GB.</li>
          </ol>
          <p class="subhead">iPad</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>General</strong>.</li>
            <li>Tap <strong>iPad Storage</strong>.</li>
            <li>Note the used storage in GB.</li>
          </ol>
        </article>

        <article class="card" data-keywords="cloud accounts google drive icloud onedrive dropbox active services count">
          <h3>Active Cloud Storage Accounts</h3>
          <p>Enter the number of cloud services you actively use, for example Google Drive, iCloud, OneDrive, or Dropbox.</p>
        </article>

        <article class="card" data-keywords="cloud storage gb google one onedrive dropbox icloud android iphone add total">
          <h3>Cloud Storage Used (GB)</h3>
          <p>Add together the storage used across your active cloud accounts.</p>
          <p class="subhead">Android — Google Drive / Google One</p>
          <ol>
            <li>Open <strong>Google Drive</strong> or <strong>Google One</strong>.</li>
            <li>Tap your <strong>profile icon</strong>.</li>
            <li>Tap <strong>Storage</strong> or <strong>Storage used</strong>.</li>
            <li>Note the GB used.</li>
          </ol>
          <p class="subhead">Android — OneDrive</p>
          <ol>
            <li>Open <strong>OneDrive</strong>.</li>
            <li>Tap <strong>Me</strong> or your profile icon.</li>
            <li>Note the storage used.</li>
          </ol>
          <p class="subhead">Android — Dropbox</p>
          <ol>
            <li>Open <strong>Dropbox</strong>.</li>
            <li>Tap <strong>Menu</strong>, <strong>Account</strong>, or your profile icon.</li>
            <li>Look for <strong>Space used</strong>.</li>
          </ol>
          <p class="subhead">iPhone — iCloud</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap your name / <strong>Apple ID</strong>.</li>
            <li>Tap <strong>iCloud</strong>.</li>
            <li>Note the storage bar or iCloud Storage number.</li>
          </ol>
          <p class="subhead">iPhone — Google Drive / Google One</p>
          <ol>
            <li>Open <strong>Google Drive</strong> or <strong>Google One</strong>.</li>
            <li>Tap your <strong>profile icon</strong>.</li>
            <li>Tap <strong>Storage</strong>.</li>
            <li>Note the GB used.</li>
          </ol>
          <p class="subhead">iPhone — OneDrive / Dropbox</p>
          <p>Use the same approach in the app and add the numbers across services.</p>
        </article>

        <article class="card" data-keywords="screen time daily average hours digital wellbeing iphone settings last 7 days">
          <h3>Average Daily Screen Time (hours)</h3>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Digital Wellbeing &amp; parental controls</strong>.</li>
            <li>Tap the chart/dashboard.</li>
            <li>Use <strong>Last 7 days</strong> if available.</li>
            <li>Note the daily average screen time.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Screen Time</strong>.</li>
            <li>Tap <strong>See All App &amp; Website Activity</strong> if needed.</li>
            <li>Use <strong>Last 7 Days</strong>.</li>
            <li>Note the <strong>Daily Average</strong>.</li>
          </ol>
          <p>If needed, convert minutes to hours, for example 5h 30m = 5.5 hours.</p>
        </article>

        <article class="card" data-keywords="video streaming youtube netflix prime disney hours week digital wellbeing screen time">
          <h3>Video Streaming (hours/week)</h3>
          <p>Use the total time spent on streaming apps over the last week.</p>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Digital Wellbeing &amp; parental controls</strong>.</li>
            <li>Tap the usage chart.</li>
            <li>Switch to <strong>Last 7 days</strong>.</li>
            <li>Add up time spent in streaming apps such as YouTube, Netflix, Prime Video, Disney+, or similar.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Screen Time</strong>.</li>
            <li>Tap <strong>See All App &amp; Website Activity</strong>.</li>
            <li>Choose <strong>Last 7 Days</strong>.</li>
            <li>Under <strong>Most Used</strong>, add the time spent on streaming apps.</li>
          </ol>
        </article>

        <article class="card" data-keywords="chatgpt claude gemini perplexity copilot llm prompts ai questions week baseline">
          <h3>Number of prompts/questions asked per week to ChatGPT (and similar AI tools)</h3>
          <p>Estimate how many prompts or follow-up messages you send in a typical week.</p>
          <p>Include tools such as:</p>
          <ul>
            <li>ChatGPT</li>
            <li>Claude</li>
            <li>Gemini</li>
            <li>Perplexity</li>
            <li>Copilot</li>
          </ul>
          <p>If you do not use AI tools, enter 0.</p>
        </article>

        <article class="card" data-keywords="downloads weekly gb data usage mobile network android iphone windows mac cellular">
          <h3>Estimated Weekly Downloads (GB)</h3>
          <p>This is a rough estimate of how much data you download in a typical week, including apps, files, media, updates, and large attachments.</p>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Network &amp; Internet</strong>, <strong>Connections</strong>, or <strong>SIM &amp; Network</strong>.</li>
            <li>Tap <strong>Data usage</strong> or <strong>Mobile data usage</strong>.</li>
            <li>Set the range to last 7 days if available.</li>
            <li>Use the total shown in GB as your weekly estimate.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Mobile Data</strong> or <strong>Cellular</strong>.</li>
            <li>Review the <strong>Current Period</strong> usage.</li>
            <li>If statistics were recently reset, use that as your guide.</li>
            <li>If not, estimate a weekly average from recent usage.</li>
          </ol>
          <p class="subhead">Windows</p>
          <ol>
            <li>Check your browser download history, for example Chrome &gt; Downloads or Edge &gt; Downloads.</li>
            <li>Review large files, app downloads, media, or software updates from a typical week.</li>
            <li>If available, check <strong>Settings &gt; Network &amp; Internet &gt; Data usage</strong>.</li>
            <li>Enter a reasonable weekly estimate in GB.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Check your browser download history, for example Safari &gt; Downloads or Chrome &gt; Downloads.</li>
            <li>Review large files, app downloads, media, or software updates from a typical week.</li>
            <li>If you use Activity Monitor or another network tracking tool, use it as a rough guide.</li>
            <li>Enter a reasonable weekly estimate in GB.</li>
          </ol>
        </article>
`;

const weeklyMain = `
        <article class="card" data-keywords="weekly tracker introduction monday sunday timing overview">
          <h3>Weekly Tracker FAQs</h3>
          <p>This FAQ helps participants complete the <strong>Weekly Tracker</strong> page.</p>
          <p>The Weekly Tracker asks for weekly changes and reductions, not your full current footprint. Enter what changed during that specific challenge week compared with your baseline or usual habit.</p>
          <p class="subhead">Important timing note</p>
          <p>Each weekly tracker entry covers <strong>Monday to Sunday</strong> for that week. It does not use a rolling 7-day period.</p>
          <p class="subhead">Before you start</p>
          <ul>
            <li>Compare this week's activity against your baseline or your usual weekly pattern.</li>
            <li>Use the same devices and same method each week where possible.</li>
            <li>If an exact number is not available, a reasonable estimate is fine.</li>
            <li>For reductions, enter the amount reduced during that week's Monday–Sunday period.</li>
          </ul>
        </article>

        <article class="card" data-keywords="weekly fields table storage downloads screen streaming llm ritual community engagement touchpoints">
          <h3>Weekly tracker fields (quick reference)</h3>
          <div class="table-wrap">
            <table class="faq-table">
              <thead><tr><th>Field name</th><th>What to enter</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td>Storage Removed (GB)</td><td>Total storage deleted this week</td><td>Include deletion across phone, tablet, computer, or cloud storage.</td></tr>
                <tr><td>Estimated Downloads Avoided (GB)</td><td>Download volume avoided this week</td><td>Compare with a normal week and estimate what was avoided.</td></tr>
                <tr><td>Screen Time Reduction (minutes)</td><td>Total minutes less screen time this week</td><td>Same idea as streaming: fewer minutes across the whole Monday–Sunday week vs your usual week (not a separate “daily average” field).</td></tr>
                <tr><td>Streaming Time Reduction (minutes)</td><td>Reduction in streaming time this week</td><td>Compare this week's streaming total with your baseline/usual week.</td></tr>
                <tr><td>Fewer prompts/questions this week to ChatGPT (and similar AI tools)</td><td>Number of fewer AI prompts this week</td><td>Compare this week's usage with your normal weekly usage.</td></tr>
                <tr><td>Completed Digital Detox Ritual</td><td>Yes/No for whether you completed the ritual this week</td><td>This is a self-check, not a device metric.</td></tr>
                <tr><td>Community Engagement (Interactions)</td><td>Number of meaningful interactions this week</td><td>Count challenge-related conversations, encouragement, or invitations.</td></tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card" data-keywords="storage removed deleted gb phone cloud compare baseline week">
          <h3>Storage Removed (GB)</h3>
          <p>This is the amount of storage you deleted this week across your phone, computer, tablet, or cloud storage.</p>
          <p class="subhead">How to calculate it</p>
          <ul>
            <li>Check your current storage used.</li>
            <li>Compare it with your baseline or your previous week's number.</li>
            <li>Enter the amount deleted during Monday to Sunday of that week.</li>
          </ul>
          <p class="subhead">Android</p>
          <ul>
            <li>Phone: <strong>Settings &gt; Storage</strong></li>
            <li>Cloud apps: Google Drive / Google One / OneDrive / Dropbox &gt; Storage</li>
          </ul>
          <p class="subhead">iPhone</p>
          <ul>
            <li>Phone: <strong>Settings &gt; General &gt; iPhone Storage</strong></li>
            <li>Cloud: <strong>Settings &gt; Apple ID &gt; iCloud</strong>, or your cloud app's Storage page</li>
          </ul>
          <p class="subhead">Windows</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>System</strong>.</li>
            <li>Tap <strong>Storage</strong>.</li>
            <li>Open the main drive, usually <strong>C:</strong>.</li>
            <li>Compare current used storage with your baseline or last week's number.</li>
            <li>Enter the amount deleted during that week.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Click the <strong>Apple</strong> menu.</li>
            <li>Click <strong>About This Mac</strong>.</li>
            <li>Open <strong>Storage</strong>.</li>
            <li>Compare current used storage with your baseline or last week's number.</li>
            <li>Enter the amount deleted during that week.</li>
          </ol>
        </article>

        <article class="card" data-keywords="downloads avoided gb estimate network data usage android iphone windows mac">
          <h3>Estimated Downloads Avoided (GB)</h3>
          <p>This is the amount of downloading you avoided this week compared with your normal habit.</p>
          <p>Examples include:</p>
          <ul>
            <li>not downloading films or episodes,</li>
            <li>not downloading large files,</li>
            <li>postponing non-essential app or software downloads,</li>
            <li>reducing media downloads.</li>
          </ul>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Network &amp; Internet</strong>, <strong>Connections</strong>, or <strong>SIM &amp; Network</strong>.</li>
            <li>Tap <strong>Data usage</strong> or <strong>Mobile data usage</strong>.</li>
            <li>Review the usage for that week where possible.</li>
            <li>Compare it with a normal week and estimate what was avoided.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Mobile Data</strong> or <strong>Cellular</strong>.</li>
            <li>Review the relevant weekly usage if available, or estimate from your recent pattern.</li>
            <li>Estimate how much less you downloaded than usual that week.</li>
          </ol>
          <p class="subhead">Windows</p>
          <ol>
            <li>Check your browser download history, for example Chrome &gt; Downloads or Edge &gt; Downloads.</li>
            <li>Review large files, app downloads, media, or software updates for that week.</li>
            <li>If available, check <strong>Settings &gt; Network &amp; Internet &gt; Data usage</strong>.</li>
            <li>Compare with a normal week and estimate what was avoided.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Check your browser download history, for example Safari &gt; Downloads or Chrome &gt; Downloads.</li>
            <li>Review large files, app downloads, media, or software updates for that week.</li>
            <li>If you use Activity Monitor or another network tool, use it as a rough guide.</li>
            <li>Compare with a normal week and estimate what was avoided.</li>
          </ol>
        </article>

        <article class="card" data-keywords="screen time reduction minutes weekly monday sunday digital wellbeing usual week baseline total">
          <h3>Screen Time Reduction (minutes)</h3>
          <p>The form asks for <strong>total minutes less screen time</strong> for that challenge week (Monday–Sunday), compared with your <strong>usual week</strong> — the same kind of “whole week” comparison as streaming reduction, not a separate daily-average field.</p>
          <p class="subhead">How to estimate</p>
          <ol>
            <li>Use <strong>Digital Wellbeing</strong> or <strong>Screen Time</strong> and open the view for the <strong>relevant calendar week</strong> (Mon–Sun).</li>
            <li>Note your <strong>total screen time for that week</strong> (or estimate from the daily average × 7 if only a daily figure is shown).</li>
            <li>Compare to a <strong>typical week</strong> (for example, your baseline daily average × 7, or last week's total).</li>
            <li>Enter the difference in <strong>minutes</strong> (how many fewer minutes you used the screen that week).</li>
          </ol>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Digital Wellbeing &amp; parental controls</strong>.</li>
            <li>Tap the usage chart.</li>
            <li>Review the relevant week (Mon–Sun).</li>
            <li>Estimate total screen time for that week vs your usual week; enter the reduction in minutes.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Screen Time</strong>.</li>
            <li>Tap <strong>See All App &amp; Website Activity</strong>.</li>
            <li>Review the relevant week.</li>
            <li>Estimate total time for that week vs your usual week; enter the reduction in minutes.</li>
          </ol>
          <p class="subhead">Windows</p>
          <ol>
            <li>If you use Microsoft Family Safety, RescueTime, Clockify, or another time-tracking tool, review device usage for that week.</li>
            <li>If not, estimate based on your work and leisure usage that week.</li>
            <li>Compare this week's total with your usual weekly total; enter the reduction in minutes.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Open <strong>System Settings</strong>.</li>
            <li>Tap <strong>Screen Time</strong> if you use it on Mac, or review browser/app usage.</li>
            <li>Review usage for the relevant week.</li>
            <li>Compare with your usual week and enter the reduction in minutes.</li>
          </ol>
        </article>

        <article class="card" data-keywords="streaming reduction minutes youtube netflix baseline week android iphone windows mac">
          <h3>Streaming Time Reduction (minutes)</h3>
          <p>This is how much less time you spent on streaming this week compared with your baseline or usual weekly habit.</p>
          <p class="subhead">Android</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Digital Wellbeing &amp; parental controls</strong>.</li>
            <li>Tap the usage chart.</li>
            <li>Review the relevant week.</li>
            <li>Add the time spent in streaming apps.</li>
            <li>Compare that total with your baseline weekly streaming time.</li>
          </ol>
          <p class="subhead">iPhone</p>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Tap <strong>Screen Time</strong>.</li>
            <li>Tap <strong>See All App &amp; Website Activity</strong>.</li>
            <li>Review the relevant week.</li>
            <li>Add up the time spent on streaming apps.</li>
            <li>Compare with your baseline weekly streaming time.</li>
          </ol>
          <p class="subhead">Windows</p>
          <ol>
            <li>Review streaming usage from your browser history or streaming app history for that week.</li>
            <li>Add up time spent on YouTube, Netflix, Prime Video, Disney+, or other streaming services.</li>
            <li>Compare that total with your baseline weekly streaming time.</li>
            <li>Enter the reduction in minutes.</li>
          </ol>
          <p class="subhead">Mac</p>
          <ol>
            <li>Open <strong>System Settings &gt; Screen Time</strong> if you use Screen Time on Mac, or review browser/app history.</li>
            <li>Add up your streaming time for that week.</li>
            <li>Compare it with your baseline weekly streaming time.</li>
            <li>Enter the reduction in minutes.</li>
          </ol>
        </article>

        <article class="card" data-keywords="chatgpt fewer prompts ai claude gemini copilot baseline estimate zero">
          <h3>Fewer prompts/questions this week to ChatGPT (and similar AI tools)</h3>
          <p>This is how many fewer AI prompts or follow-up questions you asked this week compared with your usual weekly usage.</p>
          <p class="subhead">How to estimate</p>
          <ul>
            <li>Think about your normal weekly AI usage from baseline.</li>
            <li>Estimate how many prompts you sent this week.</li>
            <li>Subtract this week's number from your baseline number.</li>
          </ul>
          <p>If you used more than usual, enter <strong>0</strong>.</p>
        </article>

        <article class="card" data-keywords="digital detox ritual checkbox completed self-check week">
          <h3>Completed Digital Detox Ritual</h3>
          <p>Tick Yes if you completed the challenge ritual for that week.</p>
          <p>This is a self-check and does not come from a device setting.</p>
        </article>

        <article class="card" data-keywords="community engagement interactions touchpoints invite encouragement participants manual count">
          <h3>Community Engagement (Interactions)</h3>
          <p>Enter the number of meaningful challenge-related interactions you had that week.</p>
          <p>This may include:</p>
          <ul>
            <li>encouraging another participant,</li>
            <li>sharing your progress,</li>
            <li>inviting someone to join,</li>
            <li>having a meaningful exchange about the challenge,</li>
            <li>joining a challenge-related discussion.</li>
          </ul>
          <p>This is a manual count.</p>
        </article>
`;

const baselineHtml = shellPage(
  "Baseline Assessment FAQ — Digital Detox Challenge",
  "Baseline Assessment FAQ for the Digital Detox Challenge: devices, storage, cloud, screen time, streaming, AI prompts, and weekly downloads.",
  "Baseline Assessment FAQ",
  "Helps you complete the <em>Baseline Assessment</em> page. Search by keyword — e.g. <em>iCloud</em>, <em>Screen Time</em>, <em>OneDrive</em>, <em>streaming</em>.",
  "Phone storage, cloud, screen time, streaming, ChatGPT, downloads…",
  baselineMain
);

const weeklyHtml = shellPage(
  "Weekly Tracker FAQ — Digital Detox Challenge",
  "Weekly Tracker FAQ for the Digital Detox Challenge: storage removed, downloads avoided, screen time, streaming, AI prompts, ritual, and community engagement.",
  "Weekly Tracker FAQ",
  "Helps you complete the <em>Weekly Tracker</em> (Monday–Sunday weeks). Search by keyword — e.g. <em>storage</em>, <em>streaming</em>, <em>Screen Time</em>.",
  "Storage removed, downloads avoided, screen time, streaming, ritual…",
  weeklyMain
);

fs.writeFileSync(path.join(publicDir, "baseline-assessment-faq.html"), baselineHtml, "utf8");
fs.writeFileSync(path.join(publicDir, "weekly-tracker-faq.html"), weeklyHtml, "utf8");
console.log("Wrote baseline-assessment-faq.html and weekly-tracker-faq.html");
