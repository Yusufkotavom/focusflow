import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  buttonClassName?: string
  contentClassName?: string
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'Pick a date',
  buttonClassName,
  contentClassName,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className={cn(
            'w-60 justify-start text-start font-normal data-[empty=true]:text-muted-foreground',
            buttonClassName
          )}
        >
          {selected ? (
            format(selected, 'MMM d, yyyy')
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-0', contentClassName)}>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={(date: Date) => date < new Date('1900-01-01')}
        />
      </PopoverContent>
    </Popover>
  )
}
