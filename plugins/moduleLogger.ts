import { Compilation, Compiler, Module, WebpackError } from 'webpack';
import * as stream from 'stream';
const path = require('path');
const fs = require("fs")
const deglob = require('deglob');
const chalk = require('chalk');

function searchFiles(directory: string, ignoreGlobPatterns: any[] = [], useGitIgnore: boolean = true) {
    const config = { ignore: ignoreGlobPatterns, cwd: directory, useGitIgnore };
    return new Promise((resolve, reject) => {
        deglob('**/*', config, (err: any, files: any) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

class ModuleLogger{
    sourceDirectories:string[]
    root: string
    exclude: string[]
    useGitIgnore: boolean = true;

    constructor(options: { directories?: string[], root: string, exclude?:string[]}) {
        this.sourceDirectories = options.directories || []
        this.root = options.root;
        this.exclude = options.exclude || [];
    }



    apply(compiler: Compiler){

        const checkUnused = (compilation: Compilation) => {
            // Files used by Webpack during compilation
            const usedModules = Array.from(compilation.fileDependencies)
                .filter(file => this.sourceDirectories.some(dir => file.indexOf(dir) !== -1))
                .reduce((obj, item) => Object.assign(obj, { [item]: true }), {});
            // Go through sourceDirectories to find all source files
            Promise.all(
                this.sourceDirectories.map(directory => searchFiles(directory, this.exclude, this.useGitIgnore)),
            )
                // Find unused source files
                // @ts-ignore
                .then(files => files.map(array => array.filter(file => !usedModules[file])))
                .then(display.bind(this))
        };

        if (compiler.hooks && compiler.hooks.emit) {
            compiler.hooks.emit.tapAsync('UnusedPlugin', checkUnused);
        }
    }

}

export default ModuleLogger;

function display(filesByDirectory: string[][]) {
    const allFiles = filesByDirectory.reduce(
        (array: any[], item) => array.concat(item),
        [],
    );
    //удаляем корневой файл из массива
    allFiles.shift()

    process.stdout.write(chalk.green('\n*** Unused Plugin ***\n\n'));
    process.stdout.write(chalk.red([...allFiles]));

    fs.writeFileSync('./unused', JSON.stringify(allFiles))

    return allFiles;
}