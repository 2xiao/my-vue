import { Effect } from "../../../../my-react/packages/react-reconciler/src/fiberHooks";
export function effect(fn, options?) {
  // 创建一个响应式 effect，数据变化后可以重新执行
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler
    _effect.run();
  });
  _effect.run();
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
  deps = [] as any[];
  _depsLength = 0;

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
      return this.fn();
    } finally {
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
    if (effect.scheduler) {
      effect.scheduler();
    }
  }
}
