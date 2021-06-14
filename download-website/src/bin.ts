import glob from 'glob'
import { URL } from 'url'
import slash from 'slash'
import path from 'path'
import fs from 'fs-extra'
import {
    isomorphicDirname,
    readFromUrlOrPath,
    TraversalResultType,
    traverseEsModules,
    urlResolver,
} from 'es-module-traversal'

const ENTRY_NAME = 'index.html'

import cac from 'cac'
const cli = cac()

cli.command('[url]', '').action(async (url, options) => {
    const downloadFilesToDir = new URL(url || '').hostname
    fs.removeSync(downloadFilesToDir)
    // await scrape({ urls: [url], directory: downloadFilesToDir })
    await main({
        baseUrl: url,
        downloadFilesToDir,
    })
})

// Display help message when `-h` or `--help` appears
cli.help()
// Display version number when `-v` or `--version` appears
// It's also used in help message
cli.version('0.0.0')

cli.parse()

async function main({ baseUrl, downloadFilesToDir, root = '/' }) {
    try {
        const res = await traverseEsModules({
            entryPoints: [new URL(ENTRY_NAME, baseUrl).toString()],
            resolver: urlResolver({ root: root, baseUrl }),
            read: readFromUrlOrPath,
            onEntry: makeFilesDownloader({
                root: root,
                downloadFilesToDir,
            }),
        })
    } finally {
    }
}

function makeFilesDownloader({ root, downloadFilesToDir }) {
    return async (url = '', importer) => {
        // console.log('traversed ' + url)
        // recreate server files structure on disk
        const content = await readFromUrlOrPath(url, importer)
        let filePath = url.startsWith('http')
            ? urlToRelativePath(url)
            : path.relative(root, url)

        filePath = path.join(downloadFilesToDir, filePath)

        await fs.createFile(filePath)
        await fs.writeFile(filePath, content)
    }
}

function urlToRelativePath(ctx) {
    let pathname = new URL(ctx).pathname
    pathname = pathname.startsWith('/') ? pathname.slice(1) : pathname
    return pathname
}
