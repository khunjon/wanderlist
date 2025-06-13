import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value = [], onChange, placeholder = "Add tags...", className, disabled, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")
    const [isInputFocused, setIsInputFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    const addTag = (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase()
      if (trimmedTag && !value.includes(trimmedTag)) {
        onChange([...value, trimmedTag])
      }
      setInputValue("")
    }

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter(tag => tag !== tagToRemove))
    }

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        }
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1])
      }
    }

    const handleInputBlur = () => {
      setIsInputFocused(false)
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }

    const handleContainerClick = () => {
      inputRef.current?.focus()
    }

    return (
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap gap-1 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "dark:bg-input/30",
          className
        )}
        onClick={handleContainerClick}
      >
        {value.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            <span>{tag}</span>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0 hover:bg-secondary-foreground/20"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
              >
                <X className="h-2 w-2" />
                <span className="sr-only">Remove {tag} tag</span>
              </Button>
            )}
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={handleInputBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
          disabled={disabled}
          {...props}
        />
      </div>
    )
  }
)

TagInput.displayName = "TagInput"

export { TagInput } 