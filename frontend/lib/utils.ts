import { twMerge } from "tailwind-merge"

type ClassValue = string | number | boolean | undefined | null | ClassValue[] | { [key: string]: boolean | undefined | null }

function toVal(mix: ClassValue): string {
  let str = ""
  
  if (typeof mix === "string" || typeof mix === "number") {
    str += mix
  } else if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) {
      for (let i = 0; i < mix.length; i++) {
        if (mix[i]) {
          const val = toVal(mix[i])
          if (val) {
            str && (str += " ")
            str += val
          }
        }
      }
    } else {
      for (const key in mix) {
        if ((mix as Record<string, boolean | undefined | null>)[key]) {
          str && (str += " ")
          str += key
        }
      }
    }
  }
  
  return str
}

export function cn(...inputs: ClassValue[]) {
  let str = ""
  for (let i = 0; i < inputs.length; i++) {
    const val = toVal(inputs[i])
    if (val) {
      str && (str += " ")
      str += val
    }
  }
  return twMerge(str)
}

interface CVAConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
}

export function cva(config: CVAConfig) {
  return function (props?: Record<string, string | undefined>) {
    const classes: string[] = []
    
    if (config.base) {
      classes.push(config.base)
    }
    
    if (config.variants) {
      for (const [variantKey, variantOptions] of Object.entries(config.variants)) {
        const variantValue = props?.[variantKey] || config.defaultVariants?.[variantKey]
        if (variantValue && variantOptions[variantValue]) {
          classes.push(variantOptions[variantValue])
        }
      }
    }
    
    return classes.join(" ")
  }
}
