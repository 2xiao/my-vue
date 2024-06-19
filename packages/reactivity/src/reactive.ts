import { isObject } from "@vue/shared";

const mutableHandlers: ProxyHandler<any> = {
  get() {},
  set() {},
};

export function reactive(value) {
  return createReactiveObject(value);
}

function createReactiveObject(target) {
  let proxy = new Proxy(target, mutableHandlers);
}
