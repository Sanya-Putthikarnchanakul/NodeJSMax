import Error from './Error';
import { Todo } from '../todo';

export default interface GetTodos extends Error {
    data?: Todo[]
}