import { Effect } from "../../../../my-react/packages/react-reconciler/src/fiberHooks";
export function effect(fn, options?) {
  // 创建一个响应式 effect，数据变化后可以重新执行
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler
    _effect.run();
  });
  _effect.run();

  // 用用户传递的覆盖内置的
  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect) as any;
  // 可以在 run 方法上获取到 effect 的引用
  runner.effect = _effect;
  return runner;
}

export let activeEffect;

function preCleanEffect(effect: ReactiveEffect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行 _trackId 都 +1
}

function postCleanEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    // 删除映射表中对应的 effect
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect);
    }
    // 更新依赖列表
    effect.deps.length = effect._depsLength;
  }
}

function cleanDepEffect(dep, effect: ReactiveEffect) {
  dep.delete(effect);
  if (dep.size == 0) {
    dep.cleanup();
  }
}

class ReactiveEffect {
  // 用于记录当前 effect 执行了几次
  _trackId = 0;
  _depsLength = 0;
  // 通过 _running 属性防止递归调用
  _running = 0;

  deps = [] as any[];

  // 创建的 effect 是响应式的
  public active = true;
  constructor(public fn, public scheduler) {}
  run() {
    if (!this.active) return this.fn();

    // 支持 effect 嵌套
    let lastEffect = activeEffect;
    try {
      activeEffect = this;

      // effect 重新执行前，需要将上次的依赖清空
      preCleanEffect(this);

      this._running++;
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
}

// 双向记忆
export function trackEffect(effect: ReactiveEffect, dep) {
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId);
    let oldDep = effect.deps[effect._depsLength];

    // 没有存过
    if (oldDep !== dep) {
      // 删掉旧的
      if (oldDep) {
        cleanDepEffect(oldDep, effect);
      }
      // 存入新的
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }
  }
  // 存放所有与 effect 关联的 dep
  effect[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    // 防止递归调用，正在执行的 effect 不再执行 run
    if (!effect._running) {
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}
