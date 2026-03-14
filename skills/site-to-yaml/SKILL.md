---
name: site-to-yaml
description: Generate YAML URL lists from websites using agent-browser headless crawling
metadata:
  tags: crawl, sitemap, yaml, agent-browser, wayback
---

## When to use

Use this skill whenever you need to collect URLs from a website and produce a YAML file for wayback-cli.

## Setup

For prerequisites and installation of agent-browser, load the [./rules/setup.md](./rules/setup.md) file.

## Crawling

When crawling a site to collect internal links, load the [./rules/crawling.md](./rules/crawling.md) file for the crawl strategy and link extraction techniques.

## URL filtering

When needing to filter, normalize, or deduplicate collected URLs, load the [./rules/filtering.md](./rules/filtering.md) file for more information.

## YAML output

When generating the output YAML file, load the [./rules/output.md](./rules/output.md) file for the schema and formatting rules.

## How to use

Read individual rule files for detailed explanations:

- [rules/setup.md](rules/setup.md) - agent-browser installation and environment setup
- [rules/crawling.md](rules/crawling.md) - BFS crawl strategy, depth control, concurrency, SPA handling
- [rules/filtering.md](rules/filtering.md) - Same-origin checks, glob patterns, static asset exclusion, URL normalization
- [rules/output.md](rules/output.md) - wayback-cli compatible YAML schema and metadata headers
- [rules/integration.md](rules/integration.md) - Piping output into wayback-cli for Wayback Machine registration
