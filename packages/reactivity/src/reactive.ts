import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";

// 用于记录代理后的结果，方便复用
const reactiveMap = new WeakMap();

// 响应式对象
function createReactiveObject(target: any) {
  // 不是对象，直接返回
  if (!isObject(target)) return target;

  // target 已经被代理过了，直接返回
  if (target[ReactiveFlags.IS_REACTIVE]) return target;

  // target 命中缓存，返回缓存的代理对象
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) return existingProxy;

  // 新增代理对象并缓存
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

export function reactive(target: any) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
