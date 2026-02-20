# AGENT.md — Mon Voyage Pas Cher CLI for AI Agents

This document explains how to use the Mon Voyage Pas Cher CLI as an AI agent.

## Overview

The `monvoyagepascher` CLI provides access to travel geography data including airports, cities, countries, distances, elevations, sun positions, and timezones via the Mon-voyage-pas-cher.com Public API.

## Prerequisites

```bash
monvoyagepascher config set --api-key <key>
```

Optional: Set default language (en, fr, de, es):
```bash
monvoyagepascher config set --language fr
```

## All Commands

### Config

```bash
monvoyagepascher config set --api-key <key>
monvoyagepascher config set --language fr
monvoyagepascher config show
```

### Airports

```bash
# Search by country
monvoyagepascher airports --country US --json

# Search by location and radius (max 500km)
monvoyagepascher airports --location "40.7128,-74.0060" --radius 100 --json

# Top airports only
monvoyagepascher airports --top --json
```

### Cities

```bash
# Search by name (minimum 3 characters)
monvoyagepascher cities search "paris" --json
monvoyagepascher cities search "new" --country US --json

# Find nearby cities (max radius 200km)
monvoyagepascher cities nearby --location "48.8566,2.3522" --radius 50 --json
monvoyagepascher cities nearby --country FR --limit 20 --json

# Get significant cities by population
monvoyagepascher cities significant --country US --json
monvoyagepascher cities significant --population 80 --json
```

### Countries

```bash
# List all countries
monvoyagepascher countries --json

# Get specific country
monvoyagepascher countries US --json
```

### Continents

```bash
# List all continents
monvoyagepascher continents --json

# Get specific continent
monvoyagepascher continents EU --json
```

### Distance

```bash
# Between coordinates
monvoyagepascher distance "40.7128,-74.0060" "48.8566,2.3522" --json

# Between airports (IATA codes)
monvoyagepascher distance JFK CDG --unit miles --json

# Units: kms (default) or miles
```

### Elevation

```bash
# Single location
monvoyagepascher elevation "48.8566,2.3522" --json

# Multiple locations (up to 20, pipe-separated)
monvoyagepascher elevation "48.8566,2.3522|40.7128,-74.0060|51.5074,-0.1278" --json

# Units: meters (default) or feet
monvoyagepascher elevation "0,0" --unit feet --json
```

### Sun Positions

```bash
# Get solar cycle data for today
monvoyagepascher sun "48.8566,2.3522" --json

# For a specific date
monvoyagepascher sun CDG --date 2024-06-21 --json

# Can use coordinates or IATA codes
```

### Timezone

```bash
# Get timezone and current time
monvoyagepascher timezone "48.8566,2.3522" --json
monvoyagepascher timezone JFK --json
```

### Ping

```bash
# Health check
monvoyagepascher ping --json
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. The API supports English (en), French (fr), German (de), and Spanish (es)
3. Coordinates format: "latitude,longitude" (e.g., "48.8566,2.3522")
4. Multiple locations for elevation: pipe-separated "lat1,long1|lat2,long2"
5. Distance/timezone/sun commands accept both coordinates and IATA codes
6. Maximum radius for airports: 500km
7. Maximum radius for cities: 200km
8. City search requires minimum 3 characters
9. All responses include `status`, `message`, `count`, and `data` fields
10. Use `data.data` array to access the actual results in most responses

## Common Use Cases

**Find airports near a location:**
```bash
monvoyagepascher airports --location "48.8566,2.3522" --radius 100 --json | jq '.data[]'
```

**Search for a city and get its timezone:**
```bash
monvoyagepascher cities search "tokyo" --json | jq '.data[0]'
```

**Calculate flight distance:**
```bash
monvoyagepascher distance JFK NRT --unit miles --json | jq '.data.distance'
```

**Get sunrise/sunset times:**
```bash
monvoyagepascher sun "35.6762,139.6503" --json | jq '.data'
```
