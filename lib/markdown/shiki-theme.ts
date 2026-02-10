import type { ThemeRegistration } from 'shiki';

/**
 * Custom warm dark syntax theme matching the Claude AI-inspired palette.
 * Background: hsl(25 6% 12%) = #201d1a (--secondary)
 */
export const warmDarkTheme: ThemeRegistration = {
  name: 'warm-dark',
  type: 'dark',
  colors: {
    'editor.background': '#201d1a',
    'editor.foreground': '#e6dfd4',
    'editor.lineHighlightBackground': '#2a2622',
    'editor.selectionBackground': '#3d3630',
    'editorCursor.foreground': '#c4704a',
    'editorLineNumber.foreground': '#5c5549',
    'editorLineNumber.activeForeground': '#8a7f72',
  },
  settings: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6b6158', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#c4704a' }, // terracotta (--primary)
    },
    {
      scope: ['string', 'string.quoted'],
      settings: { foreground: '#d4a053' }, // amber / chart-3
    },
    {
      scope: ['entity.name.function', 'support.function'],
      settings: { foreground: '#e6dfd4' }, // cream (--foreground)
    },
    {
      scope: ['variable', 'variable.other'],
      settings: { foreground: '#c9bfb0' },
    },
    {
      scope: ['constant.numeric', 'constant.language'],
      settings: { foreground: '#8fbc7a' }, // muted green
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.type'],
      settings: { foreground: '#d4a053' }, // amber
    },
    {
      scope: ['entity.name.tag'],
      settings: { foreground: '#c4704a' }, // terracotta
    },
    {
      scope: ['entity.other.attribute-name'],
      settings: { foreground: '#d4a053' },
    },
    {
      scope: ['punctuation', 'meta.brace'],
      settings: { foreground: '#8a7f72' },
    },
    {
      scope: ['constant.other.color', 'constant.other'],
      settings: { foreground: '#b89fcc' }, // muted purple
    },
    {
      scope: ['meta.property-name', 'support.type.property-name'],
      settings: { foreground: '#c9bfb0' },
    },
    {
      scope: ['keyword.operator'],
      settings: { foreground: '#8a7f72' },
    },
    {
      scope: ['entity.other.inherited-class'],
      settings: { foreground: '#8fbc7a' },
    },
    {
      scope: ['variable.parameter'],
      settings: { foreground: '#e6dfd4' },
    },
    {
      scope: ['markup.heading'],
      settings: { foreground: '#c4704a', fontStyle: 'bold' },
    },
    {
      scope: ['markup.bold'],
      settings: { fontStyle: 'bold' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic' },
    },
    {
      scope: ['markup.inline.raw', 'markup.raw'],
      settings: { foreground: '#d4a053' },
    },
    {
      scope: ['meta.diff.header', 'markup.inserted'],
      settings: { foreground: '#8fbc7a' },
    },
    {
      scope: ['markup.deleted'],
      settings: { foreground: '#c75050' },
    },
  ],
};
