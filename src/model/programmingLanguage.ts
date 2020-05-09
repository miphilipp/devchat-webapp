import {fetchJson} from '@/rest'

class ProgrammingLanguage {
    public static async fetchAll(): Promise<readonly ProgrammingLanguage[]> {
        const res = await fetchJson('/programmingLanguages')
        const languages: ProgrammingLanguage[] = []
        for (const l of res) {
            languages.push(new ProgrammingLanguage(l.name, l.isRunnable))
        }
        return Object.freeze(languages)
    }

    public name: string
    public runnable: boolean

    constructor(name: string, runnable: boolean) {
        this.name = name
        this.runnable = runnable
    }
}

export default ProgrammingLanguage
