import { Todo } from './models/todo';

let todos: Todo[] = [];

export const getTodos = () => {
    return todos;
}

export const addTodo = (todo: Todo) => {
    todos.push(todo);
}

export const updateTodoById = (todoId: string, text: string) => {
    todos.forEach(todo => {
        if (todo.id === todoId) {
            todo.text = text;
        }
    });
}

export const deleteTodoById = (todoId: string) => {
    todos = todos.filter(t => t.id !== todoId);
}