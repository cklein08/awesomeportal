---
name: generate-sample-agent-repo
description: Generate a LangGraph sample agent repo using the create-myapp CLI. Use when the user asks to generate a sample agent repo, run create-myapp, or generate a repo from the LangGraph template, generate agent
---

# Generate Sample Agent Repo

## Quick Start

When the user wants to generate a sample agent repo, run a non-interactive command
using the Artifactory package. Default to the values below unless the user provides
overrides.

```
uvx --index-url https://artifactory.corp.adobe.com/artifactory/api/pypi/pypi-ai-dev-kit-snapshot/simple create-myapp \
  --app-name sample-agent \
  --python-version 3.12 \
  --model-provider azure-openai \
  --ai-registry
```

If the user explicitly asks for **anthropic**, override the model provider:

```
uvx --index-url https://artifactory.corp.adobe.com/artifactory/api/pypi/pypi-ai-dev-kit-snapshot/simple create-myapp \
  --app-name sample-agent \
  --python-version 3.12 \
  --model-provider anthropic \
  --ai-registry
```

If the user explicitly asks for **openai**, override the model provider:

```
uvx --index-url https://artifactory.corp.adobe.com/artifactory/api/pypi/pypi-ai-dev-kit-snapshot/simple create-myapp \
  --app-name sample-agent \
  --python-version 3.12 \
  --model-provider openai \
  --ai-registry
```

## Behavior

- Check `uvx` first (e.g., `uvx --version` or `command -v uvx`). If missing, install `uv`, then proceed with `uvx`:
  - macOS: `brew install uv`
  - Linux/Windows or if Homebrew is unavailable: `python -m pip install uv`
- Run the command in the directory the user wants the repo created in; if not specified, use the current workspace root.
- Prefer the non-interactive defaults above unless the user asks for different values.
- Override flags based on user-provided values when present:
  - `--app-name`: use the requested app name.
  - `--python-version`: use the requested version.
  - `--model-provider`: accept `azure-openai` (default), `anthropic`, or `openai`.
  - `--ai-registry`: include by default; omit if the user explicitly asks to disable it.

## Example Trigger Phrases

- "generate sample agent repo"
- "run create-myapp"
