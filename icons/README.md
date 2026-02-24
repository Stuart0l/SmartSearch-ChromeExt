# Icons Directory

This directory should contain the extension icons in the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

For now, you can create simple placeholder icons or use any icon generator.

Recommended icon themes:
- A globe with a routing arrow
- A switch/toggle symbol
- Google and Baidu logos combined
- A network/connectivity symbol

You can use tools like:
- https://www.favicon-generator.org/
- Adobe Illustrator/Photoshop
- Figma
- GIMP

Or use this simple SVG as a base (save as PNG at different sizes):

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#667eea" rx="24"/>
  <circle cx="45" cy="64" r="20" fill="white"/>
  <circle cx="83" cy="64" r="20" fill="white"/>
  <path d="M 55 64 L 73 64" stroke="white" stroke-width="4" marker-end="url(#arrow)"/>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="white"/>
    </marker>
  </defs>
</svg>
```
