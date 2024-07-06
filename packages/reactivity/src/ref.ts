import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

function creatRef(value) {
  return new RefImpl(value);
}

// 依赖收集
function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined)))
    );
  }
}

// 触发更新
function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}

class RefImpl {
  public __v_isRef = true; // 增加 ref 标识
  public _value; // 用于保存 ref 的值
  public dep; // 用于收集对应的 effect

  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

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
}

class ObjectRefImpl {
  public __v_isRef = true; // 增加 ref 标识

  constructor(public _object, public _key) {}

  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function ref(value) {
  return creatRef(value);
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function toRefs(object) {
  const res = {};
  for (let key in object) {
    res[key] = toRef(object, key);
  }
  return res;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, reveiver) {
      let r = Reflect.get(target, key, reveiver);
      // 自动脱 Ref
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, reveiver) {
      const oldValue = target[key];
      // 如果老值是 Ref ，需要给 Ref 赋值
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, reveiver);
      }
    },
  });
}
