// small helpers
export function makeJoinCode(prefix = 'PEP', len = 4) {
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let out = '';
for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() *
