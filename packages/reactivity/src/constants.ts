export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export enum DirtyLevels {
  Dirty = 4, // 脏值，意味着取值时要运行计算属性
  NoDirty = 0, // 不脏，直接返回上一次的缓存结果
}
