import Error from './Error';
import { Todo } from '../todo';

export default interface PostTodo extends Error {
    data?: Todo
}