import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Task } from '../data/schema'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  status: z.string().min(1, 'Please select a status.'),
  label: z.string().min(1, 'Please select a label.'),
  priority: z.string().min(1, 'Please choose a priority.'),
})
type TaskForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const isMobile = useIsMobile()

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow ?? {
      title: '',
      status: '',
      label: '',
      priority: '',
    },
  })

  const onSubmit = (data: TaskForm) => {
    // do something with the form data
    onOpenChange(false)
    form.reset()
    showSubmittedData(data)
  }

  const header = <>{isUpdate ? 'Update' : 'Create'} Task</>

  const description = (
    <>
      {isUpdate
        ? 'Update the task by providing necessary info.'
        : 'Add a new task by providing necessary info.'}
      Click save when you&apos;re done.
    </>
  )

  const formContent = (
    <Form {...form}>
      <form
        id='tasks-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-2 sm:px-6'
      >
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder='Enter a title' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <SelectDropdown
                defaultValue={field.value}
                onValueChange={field.onChange}
                placeholder='Select dropdown'
                items={[
                  { label: 'In Progress', value: 'in progress' },
                  { label: 'Backlog', value: 'backlog' },
                  { label: 'Todo', value: 'todo' },
                  { label: 'Canceled', value: 'canceled' },
                  { label: 'Done', value: 'done' },
                ]}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='label'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='flex flex-col space-y-1'
                >
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='documentation' />
                    </FormControl>
                    <FormLabel className='font-normal'>Documentation</FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='feature' />
                    </FormControl>
                    <FormLabel className='font-normal'>Feature</FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='bug' />
                    </FormControl>
                    <FormLabel className='font-normal'>Bug</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='priority'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className='flex flex-col space-y-1'
                >
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='high' />
                    </FormControl>
                    <FormLabel className='font-normal'>High</FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='medium' />
                    </FormControl>
                    <FormLabel className='font-normal'>Medium</FormLabel>
                  </FormItem>
                  <FormItem className='flex items-center'>
                    <FormControl>
                      <RadioGroupItem value='low' />
                    </FormControl>
                    <FormLabel className='font-normal'>Low</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const footer = (
    <>
      <Button variant='outline' className='w-full sm:w-auto'>
        Close
      </Button>
      <Button form='tasks-form' type='submit' className='w-full sm:w-auto'>
        Save changes
      </Button>
    </>
  )

  if (isMobile) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v)
          form.reset()
        }}
      >
        <DialogContent className='flex max-h-[92svh] flex-col overflow-hidden p-0 sm:max-w-lg'>
          <DialogHeader className='px-4 pt-4 text-start sm:px-6'>
            <DialogTitle>{header}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter className='border-t px-4 py-4 sm:px-6'>
            <DialogClose asChild>{footer.props.children[0]}</DialogClose>
            {footer.props.children[1]}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'flex h-auto max-h-[92svh] rounded-t-2xl border-x-0 border-b-0'
            : 'flex flex-col'
        }
      >
        <SheetHeader className='text-start'>
          <SheetTitle>{header}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {formContent}
        <SheetFooter className='gap-2 border-t'>
          <SheetClose asChild>{footer.props.children[0]}</SheetClose>
          {footer.props.children[1]}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
