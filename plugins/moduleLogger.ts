import { Compilation, Compiler, Module, WebpackError } from 'webpack';
import * as stream from 'stream';
const path = require('path');
const fs = require("fs")
const deglob = require('deglob');
const chalk = require('chalk');


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
            const allDependencies = Array.from(compilation.fileDependencies)
            const sourceDependencies = allDependencies.filter(file => this.sourceDirectories.some(dir => file.indexOf(dir) !== -1))
            // Зависимости внутри sourceDirectories

            const usedModules = sourceDependencies.reduce((obj, item) => Object.assign(obj, { [item]: true }), {})
            // преобразуем в объект c парами {dir: true }
            Promise.all(
                this.sourceDirectories.map(directory => searchFiles(directory, this.exclude, this.useGitIgnore)),
                // обходим все дерево зависимостей и возвращаем массив из массивов:
                // [
                // [usedModule1, зависимость 1.1,  зависимость 1.2...],
                // [usedModule2, зависимость 2.1,  зависимость 2.2...],
                // ]
            )

                .then(files => {
                    // console.log("Files after deglob")
                    // console.log(files.join('\n'))
                    // @ts-ignore
                    return  files.map(array => array.filter(file => !usedModules[file]))
                    // удаляем элементы, которые попали в usedModules
                })
                .then(display.bind(this))
        };

        if (compiler.hooks && compiler.hooks.emit) {
            compiler.hooks.emit.tapAsync('UnusedPlugin', checkUnused);
        }
    }

}

export default ModuleLogger;


// Функция обходит дерево зависимостей и возвращает список директорий
function searchFiles(directory: string, ignoreGlobPatterns: any[] = [], useGitIgnore: boolean = true) {
    const config = { ignore: ignoreGlobPatterns, cwd: directory, useGitIgnore };
    return new Promise((resolve, reject) => {
        deglob('**/*', config, (err: any, files: any) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}


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