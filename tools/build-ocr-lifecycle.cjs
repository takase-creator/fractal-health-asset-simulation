/* Usage: node tools/build-ocr-lifecycle.cjs /path/to/node_modules */
const fs=require('fs'),path=require('path');
const deps=path.resolve(process.argv[2]);const esbuild=require(path.join(deps,'esbuild'));
const pkg=path.join(deps,'tesseract.js');if(require(path.join(pkg,'package.json')).version!=='5.1.1')throw Error('Expected official Tesseract.js 5.1.1');
const assets=path.join(__dirname,'../nippn/assets/ocr');
esbuild.build({entryPoints:[path.join(pkg,'src/index.js')],bundle:true,platform:'browser',format:'iife',globalName:'Tesseract',target:['es2020'],minify:true,legalComments:'eof',outfile:path.join(assets,'tesseract-lifecycle.min.js'),banner:{js:'/* Tesseract.js 5.1.1, Apache-2.0. BODY PALETTE lifecycle recovery patch; see lifecycle/README.md. */'},footer:{js:"Tesseract.BP_LIFECYCLE='20261124.2';"},plugins:[{name:'bp-lifecycle',setup(build){build.onLoad({filter:/tesseract\.js[/\\]src[/\\]createWorker\.js$/},()=>({contents:fs.readFileSync(path.join(assets,'lifecycle/createWorker.js'),'utf8'),loader:'js',resolveDir:path.join(pkg,'src')}));}}]}).catch(e=>{console.error(e);process.exitCode=1});
