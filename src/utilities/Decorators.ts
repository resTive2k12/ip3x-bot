import stringify from 'json-stringify-safe';

export function log(target: Record<string, any>, key: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]): any {
    const a = args.map(a => stringify(a)).join();
    const result = originalMethod.apply(this, args);
    const r = stringify(result);
    console.log(`Call: ${key}(${a}) => ${r}`);
    return result;
  };

  return descriptor;
}

export function debug(target: Record<string, any>, key: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]): any {
    console.debug('>>>>>>>>>>>>>>>>>> ' + originalMethod.name);
    const result = originalMethod.apply(this, args);
    console.debug('<<<<<<<<<<<<<<<<<< ' + originalMethod.name);
    return result;
  };

  return descriptor;
}