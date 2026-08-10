/**
 * Experiments harness.
 *
 * A place to run the encoder and the token system from a terminal, against
 * real files, without a browser in the way. Not shipped: nothing in apps/ or
 * packages/ may import from here.
 *
 *   pnpm --filter @pristine/experiments start tokens
 *   pnpm --filter @pristine/experiments start fit 4032 3024 crop
 */
import { STATUS_FRAME, fitToFrame, partsRequired } from '@pristine/encoder';
import { toCssVariables } from '@pristine/tokens';

type Command = (args: readonly string[]) => void;

const commands: Record<string, Command> = {
  /** Dumps every generated custom property, to eyeball the built stylesheet. */
  tokens() {
    for (const [name, value] of toCssVariables()) console.log(`${name}: ${value}`);
  },

  /** Shows how a source frame lands inside the Status frame. */
  fit(args) {
    const [rawWidth, rawHeight, rawMode = 'fit'] = args;
    const width = Number(rawWidth);
    const height = Number(rawHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new TypeError('usage: fit <width> <height> [fit|crop]');
    }
    if (rawMode !== 'fit' && rawMode !== 'crop') {
      throw new TypeError('mode must be "fit" or "crop"');
    }
    const drawn = fitToFrame({ width, height }, rawMode);
    console.log(`source ${width}x${height} ${rawMode}`);
    console.log(`frame  ${STATUS_FRAME.width}x${STATUS_FRAME.height}`);
    console.log(`drawn  ${drawn.width}x${drawn.height}`);
  },

  /** Shows how a clip of N seconds splits across Status posts. */
  split(args) {
    const seconds = Number(args[0]);
    const partLength = Number(args[1]);
    if (!Number.isFinite(seconds) || !Number.isFinite(partLength)) {
      throw new TypeError('usage: split <seconds> <partLength>');
    }
    console.log(`${seconds}s needs ${partsRequired(seconds, partLength)} part(s)`);
  },
};

function main(argv: readonly string[]): number {
  const [name, ...args] = argv;
  if (name === undefined || !(name in commands)) {
    console.error(`usage: start <${Object.keys(commands).join('|')}>`);
    return 1;
  }
  commands[name]?.(args);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
