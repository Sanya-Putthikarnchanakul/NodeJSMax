const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const isAuth = require('../utils/is-auth');
const { 
    getPosts,
    postCreatePost,
    getPost,
    putPost,
    deletePost,
    getStatus,
    putStatus
} = require('../controllers/feed');

router.get('/posts', isAuth, getPosts);

router.post('/post', isAuth, [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
], postCreatePost);

router.get('/post/:postId', isAuth, getPost);

router.put('/post/:postId', isAuth, [
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
], putPost);

router.delete('/post/:postId', isAuth, deletePost);

router.get('/status', isAuth, getStatus);

router.put('/status', [
    body('status').trim().not().isEmpty().isLength({ max: 20 })
], isAuth, putStatus);

module.exports = router;