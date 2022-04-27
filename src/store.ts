import { reactive, watchEffect, version } from 'vue'
import * as defaultCompiler from 'vue/compiler-sfc'
import type { Store, SFCOptions, StoreState, OutputModes } from '@vue/repl'
import { compileFile, File } from '@vue/repl'
import { utoa, atou } from './utils/encode'
// import { Snackbar } from '@varlet/ui'

const defaultMainFile = 'App.vue'
const varletReplPlugin = 'varlet-repl-plugin.js'
const varletImports = {
  '@varlet/ui': 'https://unpkg.com/@varlet/ui@1.26.2/es/varlet.esm.js',
  '@varlet/touch-emulator':
    'https://unpkg.com/@varlet/touch-emulator@1.26.2/index.js'
}
const varletCss = 'https://unpkg.com/@varlet/ui@1.26.2/es/style.css'
const devuiImports = {
  'vue-devui': 'https://unpkg.com/vue-devui@1.0.0-rc.7/vue-devui.es.js'
}
const antdesignImports = {
  'ant-design-vue': 'https://unpkg.com/ant-design-vue@3.0.0-beta.2/es/index.js'
}
const elementplusImports = {
  'element-plus': 'https://unpkg.com/element-plus@2.0.4/dist/index.full.min.mjs'
}
const jzzxUtilsImports = {
  'jzzx-utils': 'https://unpkg.com/jzzx-utils@1.0.1/dist/utils.es.min.js'
}
const jzzxLayoutImports = {
  'jzzx-layout': 'https://unpkg.com/@erkelost/layout@2.1.6/dist/index.es.js'
}
const vueuseImports = {
  '@vueuse/core': 'https://unpkg.com/@vueuse/core@8.3.1/index.mjs',
  '@vueuse/shared': 'https://unpkg.com/@vueuse/shared@8.3.1/index.mjs',
  'vue-demi': 'https://unpkg.com/vue-demi/lib/index.mjs'
}
const floatingUiImports = {
  '@floating-ui/dom': 'https://unpkg.com/@floating-ui/dom/dist/floating-ui.dom.esm.min.js',
  '@floating-ui/core': 'https://unpkg.com/@floating-ui/core/dist/floating-ui.core.esm.min.js'
}
const welcomeCode = `\
<script setup lang='ts'>
import { ref } from 'vue'
import { installVarletUI } from './${varletReplPlugin}'

installVarletUI()

const msg = ref('Hello Varlet!')
const active = ref('选项1')
const date = ref('2022-03-10')
</script>
<template>
  <d-button>我是devui</d-button>
  <el-button>我是element-plus</el-button>
  <el-image src="https://w.wallhaven.cc/full/8o/wallhaven-8o6rmo.jpg"></el-image>
  <var-button type="primary">{{ msg }}</var-button>
  <var-date-picker v-model="date" />
  <var-tabs
  elevation
  color="#2979ff"
  active-color="#fff"
  inactive-color="hsla(0, 0%, 100%, .6)"
  v-model:active="active"
>
  <var-tab>选项1</var-tab>
  <var-tab>选项2</var-tab>
  <var-tab>选项3</var-tab>
</var-tabs>

<var-tabs-items v-model:active="active">
  <var-tab-item>
    呜啦啦啦火车笛，随着奔腾的马蹄。
    小妹妹吹着口琴，夕阳下美了剪影。
    我用子弹写日记，介绍完了风景。
    接下来换介绍我自己。
    我虽然是个牛仔，在酒吧只点牛奶。
    为什么不喝啤酒，因为啤酒伤身体。
  </var-tab-item>
  <var-tab-item>
    很多人不长眼睛，嚣张都靠武器。
    赤手空拳就缩成蚂蚁。
    不用麻烦了，不用麻烦了。
    不用麻烦，不用麻烦了，不用麻烦了。
  </var-tab-item>
  <var-tab-item>
    你们一起上，我在赶时间。
    每天决斗观众都累了，英雄也累了。
    不用麻烦了，不用麻烦了。
    副歌不长你们有几个，一起上好了。
    正义呼唤我，美女需要我。
    牛仔很忙的。
  </var-tab-item>
</var-tabs-items>
</template>
`

const varletReplPluginCode = `\
import VarletUI, { Context } from '@varlet/ui'
import ElementPlusUI from 'element-plus'
import {formatDuration} from 'jzzx-utils'
import adnyLayout from 'jzzx-layout'
import DevUI from 'vue-devui'
// import Antd from 'ant-design-vue
import '@varlet/touch-emulator'
import { getCurrentInstance } from 'vue'
console.log(formatDuration(666000))
Context.touchmoveForbid = false
await appendStyle()
export {
  formatDuration
}
console.log(adnyLayout)
export function installVarletUI() {
  const instance = getCurrentInstance()
  instance.appContext.app.use(VarletUI)
  instance.appContext.app.use(DevUI)
  instance.appContext.app.use(ElementPlusUI)
  instance.appContext.app.use(adnyLayout)
  // instance.appContext.app.use(Antd)
}

export function appendStyle() {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '${varletCss}'
    link.onload = resolve
    link.onerror = reject
    document.body.appendChild(link)
    const w = document.createElement('link')
    w.rel = 'stylesheet'
    w.href = 'https://unpkg.com/element-plus@2.0.4/dist/index.css'
    w.onload = resolve
    w.onerror = reject
    document.body.appendChild(w)
    const d = document.createElement('link')
    d.rel = 'stylesheet'
    d.href = 'https://unpkg.com/vue-devui@1.0.0-rc.7/style.css'
    d.onload = resolve
    d.onerror = reject
    document.body.appendChild(d)
    const a = document.createElement('link')
    a.rel = 'stylesheet'
    a.href = 'https://unpkg.com/ant-design-vue@3.0.0-beta.13/dist/antd.css'
    a.onload = resolve
    a.onerror = reject
    document.body.appendChild(a)
  })
}
`

export class ReplStore implements Store {
  state: StoreState

  compiler = defaultCompiler

  options?: SFCOptions

  initialShowOutput: boolean

  initialOutputMode: OutputModes = 'preview'

  private readonly defaultVueRuntimeURL: string

  constructor({
    serializedState = '',
    defaultVueRuntimeURL = `https://unpkg.com/@vue/runtime-dom@${version}/dist/runtime-dom.esm-browser.js`,
    showOutput = false,
    outputMode = 'preview'
  }: {
    serializedState?: string
    showOutput?: boolean
    // loose type to allow getting from the URL without inducing a typing error
    outputMode?: OutputModes | string
    defaultVueRuntimeURL?: string
  }) {
    let files: StoreState['files'] = {}

    if (serializedState) {
      const saved = JSON.parse(atou(serializedState))
      // eslint-disable-next-line no-restricted-syntax
      for (const filename of Object.keys(saved)) {
        files[filename] = new File(filename, saved[filename])
      }
    } else {
      files = {
        [defaultMainFile]: new File(defaultMainFile, welcomeCode)
      }
    }

    this.defaultVueRuntimeURL = defaultVueRuntimeURL
    this.initialShowOutput = showOutput
    this.initialOutputMode = outputMode as OutputModes

    let mainFile = defaultMainFile
    if (!files[mainFile]) {
      mainFile = Object.keys(files)[0]
    }
    this.state = reactive({
      mainFile,
      files,
      activeFile: files[mainFile],
      errors: [],
      vueRuntimeURL: this.defaultVueRuntimeURL
    })

    this.initImportMap()

    // varlet inject
    this.state.files[varletReplPlugin] = new File(
      varletReplPlugin,
      varletReplPluginCode,
      !import.meta.env.DEV
    )

    watchEffect(() => compileFile(this, this.state.activeFile))

    // eslint-disable-next-line no-restricted-syntax
    for (const file in this.state.files) {
      if (file !== defaultMainFile) {
        compileFile(this, this.state.files[file])
      }
    }
  }

  setActive(filename: string) {
    this.state.activeFile = this.state.files[filename]
  }

  addFile(fileOrFilename: string | File) {
    const file =
      typeof fileOrFilename === 'string'
        ? new File(fileOrFilename)
        : fileOrFilename
    this.state.files[file.filename] = file
    if (!file.hidden) this.setActive(file.filename)
  }

  deleteFile(filename: string) {
    if (filename === varletReplPlugin) {
      // Snackbar.warning('Varlet depends on this file')
      return
    }

    // eslint-disable-next-line no-alert
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      if (this.state.activeFile.filename === filename) {
        this.state.activeFile = this.state.files[this.state.mainFile]
      }
      delete this.state.files[filename]
    }
  }

  serialize() {
    return '#' + utoa(JSON.stringify(this.getFiles()))
  }

  getFiles() {
    const exported: Record<string, string> = {}
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const filename in this.state.files) {
      exported[filename] = this.state.files[filename].code
    }
    return exported
  }

  async setFiles(newFiles: Record<string, string>, mainFile = defaultMainFile) {
    const files: Record<string, File> = {}
    if (mainFile === defaultMainFile && !newFiles[mainFile]) {
      files[mainFile] = new File(mainFile, welcomeCode)
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const [filename, file] of Object.entries(newFiles)) {
      files[filename] = new File(filename, file)
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const file of Object.values(files)) {
      await compileFile(this, file)
    }
    this.state.mainFile = mainFile
    this.state.files = files
    this.initImportMap()
    this.setActive(mainFile)
  }

  private initImportMap() {
    const map = this.state.files['import-map.json']
    if (!map) {
      this.state.files['import-map.json'] = new File(
        'import-map.json',
        JSON.stringify(
          {
            imports: {
              vue: this.defaultVueRuntimeURL,
              ...varletImports,
              ...devuiImports,
              // ...antdesignImports,
              ...jzzxUtilsImports,
              ...elementplusImports,
              ...jzzxLayoutImports,
              ...vueuseImports,
              ...floatingUiImports
            }
          },
          null,
          2
        )
      )
    } else {
      try {
        const json = JSON.parse(map.code)
        if (!json.imports.vue) {
          json.imports.vue = this.defaultVueRuntimeURL
          map.code = JSON.stringify(json, null, 2)
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }

  getImportMap() {
    try {
      console.log(JSON.parse(this.state.files['import-map.json'].code))
      return JSON.parse(this.state.files['import-map.json'].code)
    } catch (e) {
      this.state.errors = [
        `Syntax error in import-map.json: ${(e as Error).message}`
      ]
      return {}
    }
  }
}
