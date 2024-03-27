import { convertLeoToTs } from '../src/utils/leoToTSConverter';

const prefix = '../aleo-programs';
const programPaths = [
  '/ale',
  '/axel',
  '/core_protocol',
  '/oracle',
  '/delegators/delegator1',
  '/delegators/delegator2',
  '/delegators/delegator3',
  '/delegators/delegator4',
  '/delegators/delegator5'
];
const suffix = '/src/main.leo';

for (const programPath of programPaths) {
  await convertLeoToTs(prefix + programPath + suffix);
}