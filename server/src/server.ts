import express, {Application, Request, Response} from "express"
import * as fs from "node:fs";
import cors, {CorsOptions} from "cors";
import path from 'path'

const app: Application = express()
const port = 3000


app.use(express.urlencoded({extended: true}))

const corsOptions: CorsOptions = {
    origin: "http://localhost:5173" // todo need some kind of env var
}
app.use(cors(corsOptions))

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
    res.send('GET typescript + express')
})

interface File {
    name: string
    parentPath: string
    isDirectory: boolean
}

interface FileStats {
    size: number
    creationDate: Date
    lastModifiedDate: Date
    parentDirectories: File[]
}

type FileResult = File & FileStats

app.get('/api/files',(req: Request, res: Response) => {
    //todo validate path param
    //todo format query param correctly, also in frontend
    console.log("GET /api/files")

    const value = req.query.path as string
    console.log("GET /api/files", value)

    //todo handle errors
    //todo check this is a folder we are trying to get the files from
    //todo see about access levels
    try {
        const files = fs.readdirSync(value, { withFileTypes: true })

        // adding is directory
        const updatedFiles = files.map((file) => (
            {
                name: file.name,
                parentPath: file.parentPath,
                isDirectory: file.isDirectory()
            }
        ))


        res.send(updatedFiles)

    } catch (error) {
        console.log("${Date.now()} GET /api/files ERROR", error)
        res.send(JSON.stringify({ message: "Error getting files", error: error }))
    }
})

const getCurrentDateTime = () => {
    return (new Date()).toLocaleString()
}

// this is not necessary but it was kinda fun to do it
const getParentDirectories = (absPath: string) => {
    const parts = absPath.split(path.sep).filter((c: string) => c !== "")
    const parentPaths: string[] = []
    parentPaths.push(parts[0] + path.sep)
    console.log(parts)
    console.log(parentPaths)

    for (let i = 1; i < parts.length; i++) {
        console.log(parentPaths[i - 1], parts[i])
        const newParentPath = path.join(parentPaths[i - 1], parts[i])
        parentPaths.push(newParentPath)
    }

    return parentPaths.map((p): File => ({
        name: path.basename(p),
        parentPath: path.dirname(p),
        isDirectory: true,
    }))

}

app.get('/api/file',(req: Request, res: Response) => {
    console.log(`${getCurrentDateTime()}  GET /api/file`)
    const value = req.query.path as string
    console.log(`${getCurrentDateTime()}  GET /api/file`, value)

    const parentDirectories = getParentDirectories(value)

    try {
        const stats = fs.statSync(value)
        const result: FileResult = {
            name: path.basename(value),
            parentPath: path.dirname(value), //todo figure it out
            isDirectory: stats.isDirectory(),
            size: stats.size,
            creationDate: stats.ctime,
            lastModifiedDate: stats.mtime,
            parentDirectories: parentDirectories
        }
        res.send(result)
        console.log("${Date.now()} GET /api/files SUCCESS", result)
    } catch (error) {
        console.log(`${getCurrentDateTime()}  GET /api/file ERROR`, error)
        res.send(JSON.stringify({ message: "Error getting file", error: error }))
    }
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})