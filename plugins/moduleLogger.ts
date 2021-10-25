import { Compilation, Compiler } from 'webpack';
import { keys } from 'lodash';
const fs = require("fs")
const deglob = require('deglob');
const chalk = require('chalk');


class ModuleLogger{
    sourceDirectories:string[]
    root: string
    exclude: string[]
    useGitIgnore: boolean = true

    constructor(options: any) {
        this.sourceDirectories = options.directories || []
        this.root = options.root
        this.exclude = options.exclude || []
    }



    apply(compiler: Compiler){

        const checkUnused = (compilation: Compilation) => {
            // Files used by Webpack during compilation
            const allDependencies = Array.from(compilation.fileDependencies)
            const sourceDependencies = allDependencies
                .filter(file => this.sourceDirectories.some(dir => file.indexOf(dir) !== -1))
            // Зависимости файлов внутри sourceDirectories

            const usedModules: {[key: string]: boolean} = sourceDependencies.reduce((obj, item) =>
                Object.assign(obj, { [item]: true }), {})
            // преобразуем в объект c парами {dir: true }

            let promisesArray: Promise<string[]>[] = this.sourceDirectories.map(directory =>
                    searchFiles(directory, this.exclude, this.useGitIgnore))
            // обходим все дерево зависимостей и возвращаем массив из массивов:
            // [
            // [usedModule1, зависимость 1.1,  зависимость 1.2...],
            // [usedModule2, зависимость 2.1,  зависимость 2.2...],
            // ]

            Promise.all(promisesArray).then(files =>
                   files.map(array => array.filter(file => !usedModules[file]))
            )// удаляем элементы, которые попали в usedModules
                .then(writeUnused.bind(this))
        };

        if (compiler.hooks && compiler.hooks.emit) {
            compiler.hooks.emit.tapAsync('ModuleLogger', checkUnused);
        }
    }

}

export default ModuleLogger;


// Функция обходит дерево зависимостей и возвращает список директорий
function searchFiles(directory: string, ignoreGlobPatterns: string[], useGitIgnore: boolean = true): Promise<string[]> {
    const config = { ignore: ignoreGlobPatterns, cwd: directory, useGitIgnore };
    return new Promise((resolve, reject) => {
        deglob('**/*', config, (err: any, files: any) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}


function writeUnused(filesByDirectory: string[][]) {
    const allFiles: string[] = filesByDirectory.reduce(
        (array: string[], item) => array.concat(item),
        [],
    );

    // process.stdout.write(chalk.green('\n*** ModuleLogger ***\n\n'));
    // process.stdout.write(chalk.red([...allFiles]));
    fs.writeFileSync('./unused', JSON.stringify(allFiles.filter(f => !this.exclude.includes(f))))

    return allFiles;
}