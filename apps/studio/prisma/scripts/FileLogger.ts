import fs from "node:fs"
import path from "node:path"

export class FileLogger {
  private readonly logFilePath: string

  constructor(logFilePath: string) {
    this.logFilePath = logFilePath

    // Ensure the directory for the log file exists
    const logDir = path.dirname(logFilePath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  private formatLog(level: string, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
  }

  private writeLog(logMessage: string): void {
    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) {
        console.error("Failed to write log:", err)
      }
    })
  }

  log(level: string, message: string): void {
    const logMessage = this.formatLog(level, message)
    this.writeLog(logMessage)
  }

  info(message: string): void {
    this.log("info", message)
  }

  error(message: string): void {
    this.log("error", message)
  }

  debug(message: string): void {
    this.log("debug", message)
  }
}
