import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";
import { ReactiveFlags } from "./constants";

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;
    // 依赖收集
    // 取值的时候，让响应式属性和对应的 effect 映射起来
    track(target, key);

    // proxy 需要搭配 Reflect 来使用，让 this 指向代理对象
    let res = Reflect.get(target, key, receiver);

    // 递归代理，当取得值也是对象的时候，对这个对象再进行代理
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
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
