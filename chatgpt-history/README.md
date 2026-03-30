# ChatGPT History Summarizer

This folder contains a repeatable process to convert a ChatGPT account export into Git-tracked summaries and transcripts.

## What it does

- Reads either a ChatGPT export ZIP or a raw `conversations.json`
- Generates per-conversation markdown summaries
- Generates per-conversation markdown transcripts
- Builds an `output/index.md`, `output/summary.csv`, and `output/manifest.json`
- Includes a GitHub Actions workflow that rebuilds summaries whenever you update the export input

## Recommended source of truth

Use the official ChatGPT export ZIP from your account settings. Put it in one of these locations:

- `data/raw/latest-export.zip`
- `data/raw/conversations.json`

The workflow will prefer the ZIP if both exist.

## Local usage

```bash
python3 scripts/summarize_export.py data/raw/latest-export.zip output
```

Or with raw JSON:

```bash
python3 scripts/summarize_export.py data/raw/conversations.json output
```

## Repository layout

```text
chatgpt-history/
  README.md
  scripts/
    summarize_export.py
  data/
    raw/
      .gitkeep
  output/
    .gitkeep
  .github/
    workflows/
      rebuild-summaries.yml
```

## Notes

This implementation is deterministic and does not call an LLM. That makes it cheap and repeatable, but the summaries are heuristic rather than model-written.

The GitHub Actions workflow cannot directly log into ChatGPT and scrape your private history. The reliable pattern is:

1. export your ChatGPT data
2. place the export file into `chatgpt-history/data/raw/`
3. push that change
4. let the workflow regenerate `chatgpt-history/output/`

## Next possible improvement

Add an API-backed summarization mode for higher quality summaries while keeping the same repo and workflow structure.
