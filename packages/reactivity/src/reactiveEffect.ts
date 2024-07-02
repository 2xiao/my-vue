import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 构建映射表
// { name: 'erxiao', age: 18 }: {
//   name: { effect: 0 },
//   age: { effect: 1, effect: 1 }
// }
const targetMap = new WeakMap();

export const createDep = (cleanup) => {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  return dep;
};

export function track(target, key) {
  // 通过 activeEffect 属性判断 key 属性是否在 effect 中访问
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key))));
    }
    trackEffect(activeEffect, dep);
  }
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
