// packages/reactivity/src/effect.ts
function effect() {
}

// packages/reactivity/src/reactive.ts
var mutableHandlers = {
  get() {
  },
  set() {
  }
};
function reactive(value) {
  return createReactiveObject(value);
}
function createReactiveObject(target) {
  let proxy = new Proxy(target, mutableHandlers);
}
export {
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
