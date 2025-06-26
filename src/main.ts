import './style.css'
import { fromEvent, merge, map, scan, startWith, filter, tap } from 'rxjs'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface Model {
  todos: Todo[]
  input: string
  nextId: number
}

const view = (model: Model) => `
  <div>
    <form id="todo-form">
      <input id="new-todo" type="text" placeholder="Add Todo" value="${model.input}" />
      <button type="submit">Add</button>
    </form>
    <ul id="todo-list">
      ${model.todos
        .map(
          (t) => `
        <li data-id="${t.id}">
          <input type="checkbox" class="toggle" ${t.completed ? 'checked' : ''} />
          <span class="text">${t.text}</span>
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </li>
      `
        )
        .join('')}
    </ul>
  </div>
`

const app = document.querySelector<HTMLDivElement>('#app')!

const initialModel: Model = { todos: [], input: '', nextId: 1 }

const input$ = fromEvent<InputEvent>(app, 'input').pipe(
  filter((e: InputEvent) => (e.target as HTMLElement).id === 'new-todo'),
  map((e: InputEvent) => (state: Model): Model => ({ ...state, input: (e.target as HTMLInputElement).value }))
)

const add$ = fromEvent<SubmitEvent>(app, 'submit').pipe(
  tap((e: SubmitEvent) => e.preventDefault()),
  map(
    () =>
      (state: Model): Model => {
        const text = state.input.trim()
        if (!text) return state
        const todo: Todo = { id: state.nextId, text, completed: false }
        return {
          ...state,
          todos: [...state.todos, todo],
          nextId: state.nextId + 1,
          input: ''
        }
      }
  )
)

const delete$ = fromEvent<MouseEvent>(app, 'click').pipe(
  filter((e: MouseEvent) => (e.target as HTMLElement).classList.contains('delete')),
  map((e: MouseEvent) => parseInt((e.target as HTMLElement).closest('li')!.dataset.id!)),
  map(
    (id: number) =>
      (state: Model): Model => ({
        ...state,
        todos: state.todos.filter((t) => t.id !== id)
      })
  )
)

const toggle$ = fromEvent<MouseEvent>(app, 'change').pipe(
  filter((e: MouseEvent) => (e.target as HTMLElement).classList.contains('toggle')),
  map((e: MouseEvent) => parseInt((e.target as HTMLElement).closest('li')!.dataset.id!)),
  map(
    (id: number) =>
      (state: Model): Model => ({
        ...state,
        todos: state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      })
  )
)

const edit$ = fromEvent<MouseEvent>(app, 'click').pipe(
  filter((e: MouseEvent) => (e.target as HTMLElement).classList.contains('edit')),
  map((e: MouseEvent) => parseInt((e.target as HTMLElement).closest('li')!.dataset.id!)),
  map(
    (id: number) =>
      (state: Model): Model => {
        const current = state.todos.find((t) => t.id === id)
        const text = prompt('Edit todo', current?.text) ?? current?.text ?? ''
        return {
          ...state,
          todos: state.todos.map((t) => (t.id === id ? { ...t, text } : t))
        }
      }
  )
)

const reducer$ = merge(input$, add$, delete$, toggle$, edit$)

const state$ = reducer$.pipe(
  startWith((s: Model) => s),
  scan((state: Model, reducer: (s: Model) => Model) => reducer(state), initialModel)
)

state$.subscribe((model: Model) => {
  app.innerHTML = view(model)
})

