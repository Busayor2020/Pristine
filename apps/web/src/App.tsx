import { en } from '@pristine/ui';

/**
 * Scaffold entry point, not a screen.
 *
 * It exists to prove the wiring end to end: copy resolves from
 * @pristine/ui, every value below is a token custom property, and the PWA
 * shell mounts. Screens replace this.
 */
export function App() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--pr-layout-screen-padding-x)',
        gap: 'var(--pr-space-3)',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 'var(--pr-font-size-xl)',
          fontWeight: 'var(--pr-font-weight-extrabold)',
          letterSpacing: 'var(--pr-letter-spacing-tighter)',
        }}
      >
        {en['app.name']}
      </h1>
      <p
        style={{
          margin: 0,
          color: 'var(--pr-color-text-tertiary)',
          fontSize: 'var(--pr-font-size-sm)',
        }}
      >
        {en['firstRun.reassurance']}
      </p>
    </main>
  );
}
