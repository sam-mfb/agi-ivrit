/**
 * Console logging utilities with emoji formatting
 */

export const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(`✓ ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  section: (title: string) => {
    console.log(`\n${title}`);
    console.log('='.repeat(title.length));
    console.log('');
  },
  step: (msg: string) => console.log(`  ${msg}`),
  emoji: (emoji: string, msg: string) => console.log(`${emoji} ${msg}`),
  newline: () => console.log(''),
};
