import fs from 'fs';
import { convertWH6ToiFinD } from './src/utils/convert';

const code = fs.readFileSync('test_user.txt', 'utf-8');
const result = convertWH6ToiFinD(code);
console.log(result);
