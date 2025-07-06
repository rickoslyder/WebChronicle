# Advanced Search Syntax Guide

WebChronicle supports powerful search queries to help you find exactly what you're looking for in your browsing history.

## Search Modes

WebChronicle offers three search modes:

1. **Semantic Search** - AI-powered search that understands context and meaning
2. **Full-Text Search** - Traditional keyword search with exact matching
3. **Advanced Query** - Powerful field-based search with operators

## Advanced Query Syntax

### Field Searches

Search within specific fields using the `field:value` syntax:

- `domain:github.com` - Find all activities from github.com
- `title:"React hooks"` - Search for exact phrase in titles
- `tag:javascript` - Find activities tagged with "javascript"

### Supported Fields

| Field | Description | Example |
|-------|-------------|---------|
| `domain:` | Website domain | `domain:stackoverflow.com` |
| `title:` | Page title | `title:tutorial` |
| `tag:` | Activity tags | `tag:programming` |
| `url:` | Full URL | `url:docs` |

### Date Filters

Filter by date using relative or absolute dates:

- `after:7d` - Last 7 days
- `before:30d` - Older than 30 days
- `after:2024-01-01` - After January 1, 2024
- `since:month` - Last month
- `after:yesterday` - Since yesterday

### Time Spent Filters

Filter by time spent on page:

- `time:>300` - More than 5 minutes (300 seconds)
- `time:<60` - Less than 1 minute
- `time:60-300` - Between 1 and 5 minutes

### Boolean Operators

Combine search terms with operators:

- `javascript AND tutorial` - Both terms must be present
- `react OR vue` - Either term
- `python NOT django` - Exclude results with "django"

### Complex Queries

Combine multiple filters for precise searches:

```
domain:github.com AND tag:javascript after:7d
```

```
(tag:tutorial OR tag:guide) AND time:>300 after:month
```

```
domain:youtube.com time:>600 NOT tag:music
```

## Search Tips

1. **Use quotes for exact phrases**: `"machine learning"`
2. **Field names are case-insensitive**: `DOMAIN:` works like `domain:`
3. **Combine filters for precision**: Mix domains, tags, and dates
4. **Use parentheses for grouping**: `(react OR vue) AND tutorial`

## Examples

### Find long reading sessions
```
time:>900 tag:article
```

### Find recent work-related activities
```
(domain:github.com OR domain:gitlab.com) after:7d
```

### Find educational content from last month
```
(tag:tutorial OR tag:course OR tag:education) after:30d
```

### Exclude social media from results
```
NOT (domain:twitter.com OR domain:facebook.com OR domain:instagram.com)
```

## Field Aliases

For convenience, some fields have aliases:

- `site:` = `domain:`
- `website:` = `domain:`
- `heading:` = `title:`
- `label:` = `tag:`
- `since:` = `after:`
- `until:` = `before:`