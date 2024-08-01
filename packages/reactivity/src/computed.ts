import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性依赖的值变化时，触发渲染 effect 重新执行
        triggerRefValue(this);
      }
    );
  }

  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();

      // 在 effect 中访问计算属性时，计算属性要收集 effect
      trackRefValue(this);
    }
    return this._value;
  }
  set value(value) {
    this.setter(value);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);

  let getter, setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
