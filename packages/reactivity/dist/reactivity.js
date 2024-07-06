// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
function cleanDepEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size == 0) {
    dep.cleanup();
  }
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
  // 用于记录当前 effect 执行了几次
  _trackId = 0;
  _depsLength = 0;
  // 通过 _running 属性防止递归调用
  _running = 0;
  deps = [];
  // 创建的 effect 是响应式的
  active = true;
  run() {
    if (!this.active)
      return this.fn();
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
};
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
  effect2[effect2._depsLength++] = dep;
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (!effect2._running) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value == "object" && value !== null;
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
var createDep = (cleanup) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  return dep;
};
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => depsMap.delete(key)));
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */)
      return true;
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let res = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return res;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target))
    return target;
  if (target["__v_isReactive" /* IS_REACTIVE */])
    return target;
  const existingProxy = reactiveMap.get(target);
  if (existingProxy)
    return existingProxy;
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
function reactive(target) {
  return createReactiveObject(target);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function creatRef(value) {
  return new RefImpl(value);
}
function trackRefValue(ref2) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      ref2.dep = createDep(() => ref2.dep = void 0)
    );
  }
}
function triggerRefValue(ref2) {
  let dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
var RefImpl = class {
  // 用于收集对应的 effect
  constructor(rawValue) {
    this.rawValue = rawValue;
    this._value = toReactive(rawValue);
  }
  __v_isRef = true;
  // 增加 ref 标识
  _value;
  // 用于保存 ref 的值
  dep;
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
    }
    triggerRefValue(this);
  }
};
var ObjectRefImpl = class {
  // 增加 ref 标识
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
  }
  __v_isRef = true;
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function ref(value) {
  return creatRef(value);
}
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object) {
  const res = {};
  for (let key in object) {
    res[key] = toRef(object, key);
  }
  return res;
}
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, reveiver) {
      let r = Reflect.get(target, key, reveiver);
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, reveiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, reveiver);
      }
    }
  });
}
export {
  activeEffect,
  effect,
  proxyRefs,
  reactive,
  ref,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
