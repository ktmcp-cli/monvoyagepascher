![Banner](https://raw.githubusercontent.com/ktmcp-cli/monvoyagepascher/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Mon Voyage Pas Cher CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with Mon-voyage-pas-cher.com.

A production-ready command-line interface for [Mon-voyage-pas-cher.com Public API](https://mon-voyage-pas-cher.com/) — search airports, cities, countries, calculate distances, get sun positions, and more. Access comprehensive travel geography data directly from your terminal.

## Features

- **Airport Search** — Find airports by country, coordinates, or IATA code
- **City Discovery** — Search cities by name, location, or population
- **Country Data** — Get detailed country information and statistics
- **Distance Calculator** — Calculate distances between coordinates or airports
- **Elevation Data** — Get elevation for up to 20 locations at once
- **Sun Positions** — Solar cycle data (sunrise, sunset, golden hour)
- **Timezone Info** — Get timezone and current time for any location
- **Multi-language** — Support for English, French, German, Spanish
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk

## Installation

```bash
npm install -g @ktmcp-cli/monvoyagepascher
```

## Quick Start

```bash
# Set your API key
monvoyagepascher config set --api-key YOUR_API_KEY

# Search airports in France
monvoyagepascher airports --country FR

# Search cities
monvoyagepascher cities search "paris"

# Calculate distance between airports
monvoyagepascher distance CDG JFK --unit miles

# Get sun positions for a location
monvoyagepascher sun "48.8566,2.3522"
```

## Commands

### Config

```bash
monvoyagepascher config set --api-key <key>
monvoyagepascher config set --language fr
monvoyagepascher config show
```

### Airports

```bash
monvoyagepascher airports --country US
monvoyagepascher airports --location "40.7128,-74.0060" --radius 100
monvoyagepascher airports --top --json
```

### Cities

```bash
# Search by name
monvoyagepascher cities search "new york"
monvoyagepascher cities search "paris" --country FR

# Find nearby cities
monvoyagepascher cities nearby --location "48.8566,2.3522" --radius 50
monvoyagepascher cities nearby --country FR --limit 20

# Get significant cities
monvoyagepascher cities significant --country US
monvoyagepascher cities significant --population 80
```

### Countries

```bash
monvoyagepascher countries              # List all countries
monvoyagepascher countries US           # Get specific country
monvoyagepascher countries --json       # All data as JSON
```

### Continents

```bash
monvoyagepascher continents             # List all continents
monvoyagepascher continents EU          # Get specific continent
```

### Distance

```bash
monvoyagepascher distance "40.7128,-74.0060" "48.8566,2.3522"
monvoyagepascher distance JFK CDG --unit miles
monvoyagepascher distance "0,0" "10,10" --json
```

### Elevation

```bash
# Single location
monvoyagepascher elevation "48.8566,2.3522"

# Multiple locations (pipe-separated)
monvoyagepascher elevation "48.8566,2.3522|40.7128,-74.0060|51.5074,-0.1278"
monvoyagepascher elevation "0,0" --unit feet
```

### Sun Positions

```bash
monvoyagepascher sun "48.8566,2.3522"
monvoyagepascher sun CDG --date 2024-06-21
monvoyagepascher sun "40.7128,-74.0060" --json
```

### Timezone

```bash
monvoyagepascher timezone "48.8566,2.3522"
monvoyagepascher timezone JFK
monvoyagepascher timezone "0,0" --json
```

### Ping

```bash
monvoyagepascher ping                   # Health check
```

## JSON Output

All commands support `--json` for structured output:

```bash
monvoyagepascher airports --country US --json | jq '.data[] | select(.iata_code == "JFK")'
monvoyagepascher cities search "paris" --json | jq '.data[0]'
monvoyagepascher distance JFK CDG --json | jq '.data.distance'
```

## Language Support

Set your preferred language globally:

```bash
monvoyagepascher config set --language fr
```

Or override per-command:

```bash
monvoyagepascher cities search "paris" --language de
```

Supported languages: `en` (English), `fr` (French), `de` (German), `es` (Spanish)

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.
