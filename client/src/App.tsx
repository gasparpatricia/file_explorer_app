import { type ChangeEvent, useCallback, useState } from "react"
import "./App.css"
import { Box, Breadcrumbs, Chip, Fab, List, ListItem, Paper, TextField, Typography } from "@mui/material"

interface File {
    name: string
    parentPath: string
    isDirectory: boolean
    size?: number
    creationDate?: Date
    lastModifiedDate?: Date
    parentDirectories: { name: string; parentPath: string; isDirectory: boolean }[] //todo get better types for poor client
}
const WINDOWS_REGEXP = new RegExp(/^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/)
const UNIX_REGEXP = new RegExp(/^(\/[^\\/ ]*)+\/?$|^\.(\/[^\\/ ]*)+\/?$|^\.\.\/([^\\/ ]*\/)*[^\\/ ]*$/)

const isPathValid = (path: string) => {
    return WINDOWS_REGEXP.test(path) || UNIX_REGEXP.test(path)
}

const buildAbsolutePath = (parentPath: string, fileName: string) => {
    const isWindowsPath = WINDOWS_REGEXP.test(parentPath)
    if (isWindowsPath) return parentPath + "\\" + fileName
    else return parentPath + "/" + fileName
}

interface FileListItemProps {
    file: File
    onSelectFile: (file: File) => Promise<void>
}

const FileListItem = ({ file, onSelectFile }: FileListItemProps) => {
    const handleFileSelection = () => {
        void onSelectFile(file)
    }
    return <ListItem onClick={handleFileSelection}>{file.name}</ListItem>
}

const App = () => {
    const [files, setFiles] = useState<File[]>([])
    const [inputPathValue, setInputPathValue] = useState<string>("")
    const [selectedPath, setSelectedPath] = useState<File | undefined>(undefined) //todo plang
    const [inputValidationError, setInputValidationError] = useState<string | undefined>(undefined)

    const updateFiles = useCallback(async (path: string) => {
        const params = new URLSearchParams({
            path: path,
        })
        const url = `http://localhost:3000/api/files?${params.toString()}`
        console.log(url)
        const response = await fetch(url)
        const result = await response.json()
        if (!result.error) {
            console.log("files?", result)
            setFiles(result)
        } else {
            console.log("some error?", response.status)
        }
    }, [])

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newPath = event.target.value
        setInputPathValue(newPath)
        setFiles([])

        //todo trigger changes on enter instead

        if (newPath === "") {
            setInputValidationError(undefined)
            return
        }

        console.log(isPathValid(newPath))
        if (isPathValid(newPath)) {
            void updateFiles(newPath)
            setInputValidationError(undefined)
        } else {
            setInputValidationError("Directory path is not valid")
        }
    }

    const handleFileSelection = async (file: File) => {
        const path = buildAbsolutePath(file.parentPath, file.name)
        const params = new URLSearchParams({
            path: path,
        })
        const url = `http://localhost:3000/api/file?${params.toString()}`
        console.log(url)
        const response = await fetch(url)
        const result = await response.json()
        if (!result.error) {
            console.log("file?", result) //todo create a better type or smth
            setSelectedPath(result)
        } else {
            console.log("some error on file select?", response.status)
        }
    }

    return (
        <Box>
            <Box>
                <TextField
                    error={!!inputValidationError}
                    helperText={inputValidationError ?? ""}
                    aria-errormessage={inputValidationError}
                    id="outlined-basic"
                    label="Path"
                    variant="outlined"
                    value={inputPathValue}
                    onChange={handleInputChange}
                />
                <Fab>{/*<SearchIcon />*/}</Fab>
            </Box>

            <Breadcrumbs aria-label="breadcrumb">
                {selectedPath?.parentDirectories?.map((p) => {
                    return (
                        <Chip
                            label={p.name || p.parentPath}
                            clickable={true}
                            onClick={() => {
                                setSelectedPath(p as File)
                            }}
                        />
                    )
                })}
            </Breadcrumbs>
            {files.length === 0 ? (
                <Paper>Search for directory</Paper>
            ) : (
                <List>
                    {files.map((file) => {
                        return (
                            <FileListItem
                                key={file.name}
                                file={file}
                                onSelectFile={handleFileSelection}
                            />
                        )
                    })}
                </List>
            )}
            {selectedPath && (
                <Paper>
                    <Typography>Name {selectedPath.name}</Typography>
                    <Typography>Size {selectedPath.size}</Typography>
                    <Typography>Type {selectedPath.isDirectory ? "directory" : "file"}</Typography>
                    <Typography>Creation date {selectedPath.creationDate?.toString()}</Typography>
                    <Typography>Last modified date {selectedPath.lastModifiedDate?.toString()}</Typography>
                </Paper>
            )}
        </Box>
    )
}

export default App
