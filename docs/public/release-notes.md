# Observatory 0.4.0

- Browse a looping, diagonal backdrop reel with drag-and-toss momentum and clearlogos on hover. No automatic scrolling.
- Explore distinct Month and Year reviews: calendar-first browsing, annual artwork, series rankings, and recorded viewing milestones.
- Select a series, busiest day, weekday, or streak to filter the viewing collection.
- Switch the consolidated genre section between overall proportions and changes over time.
- Open a more compact media panel with backdrop, clearlogo, poster, and viewing details.
- Period comparisons require explicitly complete coverage; partial AIOMetadata history does not produce misleading comparisons.

The backdrop reel uses landscape artwork; availability depends on your metadata source.

Docker: `ghcr.io/jeor/observatory:0.4.0` or `ghcr.io/jeor/observatory:latest`.

To update a Compose installation, run `docker compose pull && docker compose up -d`. If pinned to an older image version, change the tag first.
