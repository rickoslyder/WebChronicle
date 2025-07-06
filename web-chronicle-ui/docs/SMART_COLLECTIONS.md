# Smart Collections Guide

Smart Collections automatically organize your browsing activities into meaningful groups based on patterns, making it easy to review and analyze your web habits.

## What are Smart Collections?

Smart Collections are intelligent groups that automatically categorize your activities based on:
- Domain patterns
- Content tags
- Time spent
- Visit frequency
- Activity type

## Default Collections

WebChronicle comes with 8 predefined collections:

### 💼 Work & Research
Professional development and research activities
- **Includes**: GitHub, GitLab, StackOverflow, documentation sites
- **Tags**: programming, development, documentation, API, tutorial

### 📚 Learning & Education
Educational content and online courses
- **Includes**: Coursera, Udemy, EdX, Khan Academy, YouTube tutorials
- **Tags**: tutorial, course, learn, education, guide
- **Time**: More than 5 minutes per session

### ⚡ Quick Reads
Short articles and quick references
- **Time**: Between 30 seconds and 5 minutes
- **Tags**: article, blog, news

### 🏊 Deep Dives
Long-form content and focused sessions
- **Time**: More than 15 minutes per session

### 💬 Social Media
Social networking and communication
- **Includes**: Twitter/X, Facebook, LinkedIn, Reddit, Instagram

### 🎮 Entertainment
Videos, games, and leisure content
- **Includes**: YouTube, Netflix, Twitch, Spotify
- **Tags**: video, game, entertainment, music

### 🛒 Shopping & Commerce
Online shopping and product research
- **Includes**: Amazon, eBay, Etsy, AliExpress
- **Tags**: shopping, product, review, price

### 🔄 Frequent Visits
Sites you visit most often
- **Frequency**: Visited more than 10 times

## How Collections Work

### Automatic Categorization
Activities are automatically sorted into collections based on matching rules:
1. Domain matching (e.g., github.com → Work & Research)
2. Tag matching (e.g., "tutorial" → Learning)
3. Time thresholds (e.g., >15min → Deep Dives)
4. Frequency analysis (e.g., 10+ visits → Frequent Visits)

### Multiple Collections
An activity can belong to multiple collections. For example:
- A 20-minute GitHub tutorial would appear in both "Work & Research" and "Deep Dives"

## Suggested Collections

WebChronicle analyzes your browsing patterns and suggests new collections based on:

### Frequent Domains
If you visit a specific domain more than 5 times, it may suggest a dedicated collection

### Common Tags
Tags that appear in 10+ activities may warrant their own collection

### Time Patterns
Consistent browsing patterns (e.g., morning news reading) may trigger suggestions

## Using Collections

### Viewing Collections
1. Navigate to the Collections page
2. Click on any collection card to see its activities
3. View the rules that define each collection

### Collection Details
Each collection shows:
- Total number of activities
- Collection rules
- Recent activities
- Time distribution

### Filtering by Collection
Collections act as powerful filters for your activity timeline, helping you focus on specific types of content.

## Future Features

### Custom Collections (Coming Soon)
- Create your own collections with custom rules
- Combine multiple criteria
- Set custom icons and colors

### Collection Analytics
- Time trends for each collection
- Productivity insights
- Collection overlap analysis

### Smart Recommendations
- AI-powered collection suggestions
- Pattern detection
- Habit insights

## Tips for Better Collections

1. **Review Suggestions**: Check suggested collections weekly
2. **Tag Consistently**: Good tagging improves collection accuracy
3. **Monitor Patterns**: Use collections to understand your browsing habits
4. **Focus Time**: Use Deep Dives collection to find your most focused work

## Privacy Note

All collection processing happens locally in your browser or on your private Cloudflare Worker. No browsing data is shared with third parties.