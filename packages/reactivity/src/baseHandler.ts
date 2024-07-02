import { track, trigger } from "./reactiveEffect";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;
    // 依赖收集
    // 取值的时候，让响应式属性和对应的 effect 映射起来
    track(target, key);

    // proxy 需要搭配 Reflect 来使用，让 this 指向代理对象
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    // 触发更新
    // 找到响应式属性，让对应的 effect 重新执行
    let oldValue = target[key];
    let res = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return res;
  },
};
