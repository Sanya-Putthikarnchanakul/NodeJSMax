import { Router } from 'express';

const router = Router();

import { Todo } from '../models/todo';
import {
    getTodos,
    addTodo,
    updateTodoById,
    deleteTodoById
} from '../data';

import GetTodos from '../models/Response/GetTodos';
router.get('/', (req, res, next) => {
    try {
        let resObj: GetTodos = {
            isError: false,
            errCode: '0000',
            data: getTodos() 
        }

        res.status(200).json(resObj);
    } catch (err) {
        let resObj: GetTodos = {
            isError: true,
            errCode: '9999',
            errMessage: err.message
        }

        res.status(500).json(resObj);
    }
});

import PostTodo from '../models/Request/PostTodo';
import PostTodoResponse from '../models/Response/PostTodo';
router.post('/todo', (req, res, next) => {
    try {
        const body = req.body as PostTodo;

        const newTodo: Todo = {
            id: new Date().toISOString(),
            text: body.text
        };

        addTodo(newTodo);

        let responseObj: PostTodoResponse = {
            isError: false,
            errCode: '0000',
            data: newTodo
        };

        res.status(200).json(responseObj);
    } catch (err) {
        let responseObj: PostTodoResponse = {
            isError: true,
            errCode: '9999',
            errMessage: err.message
        };

        res.status(500).json(responseObj);
    }
});

router.put('/todo/:todoId', (req, res, next) => {
    try {
        const todoId = req.params.todoId;
        const newText = req.body.text;
        
        updateTodoById(todoId, newText);

        res.status(200).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.delete('/todo/:todoId', (req, res, next) => {
    try {
        const todoId = req.params.todoId;
        
        deleteTodoById(todoId);

        res.status(200).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;