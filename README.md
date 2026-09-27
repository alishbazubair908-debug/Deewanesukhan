# دیوانِ سخن — Dewaan-e-Sukhan

**A sanctuary for Urdu poetry — where words transcend time.**

🔗 Live site: [dewaanesukhan.netlify.app](https://dewaanesukhan.netlify.app)

---

## About

Dewaan-e-Sukhan is a single-page archive built for lovers of Urdu poetry — a space to discover legendary poets, read their most iconic ashaar, test your literary knowledge, and identify the poet behind any couplet using a live AI agent.

It started as a personal project during a summer spent learning API integrations, tool-based RAG, and real-time AI agents — and became a place to point that learning toward something I actually love.

## Features

- **Poet Gallery** — a curated collection of poets across classical, early modern, and contemporary Urdu literature, each with a short biography and their defining themes.
- **Ashaar Showcase** — a rotating display of famous couplets, complete with a one-click **copy to clipboard** so you can save or share a sher instantly.
- **Sher Finder (AI Agent)** — paste in any couplet, and a live AI agent identifies the most likely poet, the era, the context, and explains its meaning — powered by a real-time Groq integration.
- **Literary Check** — a short interactive quiz to test your knowledge of Urdu poetry.
- **Behind the Ink** — the story of why this project was built.
- **Contact** — a working mailbox so visitors can share feedback or get in touch directly.
- **Fully responsive** — including a slide-in mobile navigation menu for smaller screens.

## Tech Stack

- **Frontend:** HTML, CSS, and vanilla JavaScript — no framework, single self-contained page.
- **AI Agent:** Groq API, called through a serverless function so the API key never reaches the browser.
- **Backend:** Netlify Functions (Node.js) acting as a secure proxy between the client and the AI provider.
- **Contact form:** Web3Forms for serverless email delivery.
- **Hosting:** Netlify, with the free `.netlify.app` domain.

## Architecture: Why a Serverless Function?

The AI agent originally called the model provider directly from the browser — which meant the API key was visible to anyone who viewed the page source. To fix this properly:

- All AI requests now go through `netlify/functions/identify-sher.js`, which runs entirely on Netlify's servers.
- The real API key lives only as a Netlify environment variable (`GEMINI_API_KEY`), read via `process.env` — it is never bundled into any file sent to the browser.
- The function includes a fast-fail/fallback strategy across models with a hard per-request timeout, tuned to stay safely within Netlify's free-tier 10-second function execution limit.

```
Browser  →  /.netlify/functions/identify-sher  →  Model Provider API
   (no key)         (holds the real key)              
```

## Project Structure

```
.
├── index.html                          # The entire site — HTML, CSS, and JS in one file
├── netlify.toml                        # Tells Netlify where to find the serverless functions
└── netlify/
    └── functions/
        └── identify-sher.js            # Serverless proxy for the AI agent
```

## Running It Yourself

1. Clone this repo.
2. Set an environment variable for your API key (name it to match whatever `identify-sher.js` reads).
3. Deploy to Netlify — either by connecting the repo for continuous deployment, or by dragging the project folder into Netlify Drop.
4. Add your API key under **Site configuration → Environment variables** on Netlify.
5. Redeploy so the function can read the new variable.

## Feedback

There's a contact form built right into the site — if you spot something that could be better, I'd genuinely love to hear it. This project is very much a living, evolving space.

## A Note

This project was built as a labour of love for Urdu poetry — from choosing a color palette that feels warm and literary, to writing a serverless AI agent that treats every couplet with the same curiosity a reader would.

*زبان، یاد، اور عشق*
*(Language, memory, and love.)*
