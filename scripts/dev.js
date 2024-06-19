// 打包 packages 下的模块，生成 js 文件
import minimist from "minimist";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// node 中的命令参数
const args = minimist(process.argv.slice(2));
const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

// 使用 esbuild 打包
esbuild
  .context({
    entryPoints: [entry], // 入口
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
    bundle: true, // 引用会打包到一起
    platform: "browser", // 打包后给浏览器使用
    sourcemap: true, // 可以调试源代码
    format, // cjs esm iife
    globalName: pkg.buildOptions?.name,
  })
  .then((ctx) => {
    console.log("start dev");
    return ctx.watch(); // 监控入口文件持续打包
  });
