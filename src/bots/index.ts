import {IP3XAssistant} from './ip3x-assistant/ip3x-assistant';

// remove the first two arguments since it is the executing and application file-path
// 1const myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

new IP3XAssistant().start();
