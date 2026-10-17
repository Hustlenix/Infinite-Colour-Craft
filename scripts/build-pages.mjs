// Set the existing Vite Pages base on Windows, macOS and Linux.
process.env.GITHUB_PAGES = 'true';
const { build } = await import('vite');
await build();
