class OS {
  constructor(name) {
    this.name = name
    this.commands = {
      hello: () => {
        this.console.output({ type: 'output', text: 'Hello, world!' })
      },
      clear: () => {
        this.console.node.innerHTML = ''
      },
      ls: () => {
        let contents = ''
        if (this.console.currentDirectory.hasOwnProperty('contents')) {
          contents = Object.keys(this.console.currentDirectory.contents).join("&nbsp;&nbsp;&nbsp;")
        }
        this.console.output({ type: 'content', text: contents })
      },
      cd: (args) => {
        const path = args[1]
        if (path === '../') {
          const pathData = this.fileSystem.getParentDirectory(this.console.currentPath)
          this.console.currentDirectory = pathData.directory
          this.console.currentPath = pathData.path
          return;
        }

        if (path.search('/') === -1) {
          // Single level path
          if (!this.console.currentDirectory.hasOwnProperty('contents') || !this.console.currentDirectory.contents[path]) {
            return this.console.outputError(args, 'No such file or directory')
          }
          
          this.console.currentDirectory = this.console.currentDirectory.contents[path]
          this.console.currentPath += (this.console.currentPath.split('').pop() === '/') ? path : `/${path}`
        } else {
          console.log(path)
        }
      }
    }

    this.fileSystem = new FileSystem()
    this.console = new Console(this, '.console')
  }
}

class FileSystem {
  constructor() {
    this.root = {
      type: 'directory',
      contents: {
        'Documents': {
          type: 'directory'
        },
        'Pictures': {
          type: 'directory',
        },
        'Music': {
          type: 'directory'
        },
        'Code': {
          type: 'directory',
          contents: {
            'eg-ui': {
              type: 'directory'
            },
            'eg-server': {
              type: 'directory'
            },
            'storefront-jotex': {
              type: 'directory'
            }
          }
        }
      }
    }
  }

  getParentDirectory(path) {
    path = path.substr(1, path.length)
    if (!path) return false

    const keys = path.split('/')
    keys.pop()
    
    if (!keys.length) return {
      directory: this.root,
      path: '/'
    }

    let directory = this.root
    keys.forEach(key => {
      if (directory.contents) {
        directory = directory.contents[key]
      }
    })

    return {
      directory: directory,
      path: `/${keys.join('/')}`
    }
  }

  createDirectory(name, path) {
    
  }
}

class Console {
  constructor(OS, selector) {
    // Static props
    this.charlist = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?_-:.,;><^¨*+=)(/&%€#"!°§©@£$∞§|[]≈±´`¿≠}{¶‰¢¥”¡\''
    this.OS = OS
    this.node = document.querySelector(selector)
    this.commands = {}

    // Dynamic props
    this.input = ''
    this.currentPath = '/'
    this.currentDirectory = this.OS.fileSystem.root
    this.history = []

    // Setup method calls
    this.newInputInstance()

    // Set up event listeners
    window.addEventListener('keydown', this.handleKeydown.bind(this))
  }

  handleKeydown(e) {
    if (e.key === 'Tab') return e.preventDefault()
    if (e.key === 'Enter') {
      e.preventDefault()
      if (this.input) return this.evaluateInput()
    }

    if (this.charlist.indexOf(e.key) > -1) {
      this.input += e.key
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      this.input = this.input.substr(0, this.input.length - 1)
    } else if (e.code === 'Space') {
      this.input += ' '
    }

    this.activeInputRow.innerHTML = this.input.split(' ').join('&nbsp;')
  }

  outputError(args, error) {
    if (!Array.isArray(args)) args = [ args ]
    this.output({ type: 'output', text: `-bash: ${args.join(': ')}: ${error}` })
  }

  output(params) {
    const { type = 'input', text = '' } = params || {}

    const row = document.createElement('div')
    row.classList.add('row')
    if (text) row.innerHTML = text

    if (type === 'path') {
      row.classList.add('path')
    } else if (type === 'input') {
      row.classList.add('input')
      this.activeInputRow = row
    }
    
    this.node.appendChild(row)
  }

  evaluateInput() {
    // Extract the arguments by splitting the string between each space.
    const args = this.input.search(/\s/) > -1 ? this.input.split(/\s/) : [ this.input ]
    // Check that the command (first argument) actually exists.
    if (!this.OS.commands.hasOwnProperty(args[0])) {
      this.outputError(args[0], 'command not found')
    } else {
      // Execute the command (first argument) and pass the full argument Array to the method as a prop.
      this.OS.commands[args[0]](args)
    }
    this.newInputInstance()
  }

  newInputInstance() {
    this.input = ''
    this.output({ type: 'path', text: this.currentPath })
    this.output()
    window.scrollTo(0, document.body.offsetHeight - window.innerHeight)
  }
}

const maxOS = new OS('maxOS')