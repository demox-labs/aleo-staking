import { creditsProgram } from '../../../src/contracts/credits';
import { arc_0038Program } from '../../../src/contracts/arc_0038';

const args = process.argv.slice(2);
const [balance, pending, deposit, shares] = args.map(x => BigInt(x.replace(/[,_]/g, '')));
const program = new arc_0038Program(new creditsProgram());
const result = program.inline_calculate_new_shares(balance, pending, deposit, shares);
console.log(result.toLocaleString());