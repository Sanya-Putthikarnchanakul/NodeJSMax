const { validationResult } = require("express-validator");

const Post = require('../models/post');
const User = require('../models/user');

const { deleteImageFromServer } = require('../utils/fileUtils');
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
    try {
        const itemPerPage = 2;
        const currentPage = req.query.page || 1;

        const totalItem = await Post.find().countDocuments();

        const posts = await Post.find().populate('creator').sort({ createdAt: -1 }).skip((currentPage - 1) * itemPerPage).limit(itemPerPage);

        res.status(200).json({ posts, totalItems: totalItem });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.postCreatePost = async (req, res, next) => {
    try {
        //#region Server Validation

        const errors = validationResult(req);

		if (!errors.isEmpty()) {
            const error = new Error('Invalid Input');
            error.statusCode = 422;

            throw error;
        }    
        
        if (!req.file) {
            const error = new Error('No Image');
            error.statusCode = 422;

            throw error;
        } 
        
        //#endregion       

        /*let check = true;
        if (check) throw new Error('Dummy Error');*/

        const imageUrl = req.file.path.replace("\\" ,"/");
        const title = req.body.title;
        const content = req.body.content;

        const post = new Post({
            title: title,
            imageUrl: imageUrl,
            content: content,
            creator: req.userId,
        });

        const createdPost = await post.save();

        const createPostUser = await User.findById(req.userId);
        createPostUser.posts.push(createdPost);
        await createPostUser.save();

        io.getIO().emit('posts', { 
            action: 'create', 
            post: {
                ...createdPost._doc,
                creator: {
                    _id: req.userId,
                    name: createPostUser.name
                }
            }
        });

        res.status(201).json({
            message: "Created Post Success.",
            post: createdPost,
            creator: { _id: createPostUser._id, name: createPostUser.name }
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const postId = req.params.postId;

        const post = await Post.findById(postId);

        if (!post) {
            const postNotFoundErr = new Error(`Post Id = ${postId} was not Found`);
            postNotFoundErr.statusCode = 404;
            throw postNotFoundErr;
        }

        res.status(200).json({ post });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.putPost = async (req, res, next) => {
    try {
        //#region Server Validation

        const errors = validationResult(req);

		if (!errors.isEmpty()) {
            const error = new Error('Invalid Input');
            error.statusCode = 422;

            throw error;
        } 

        //#endregion

        const postId = req.params.postId;

        const updatedTitle = req.body.title;
        const updatedContent = req.body.content;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = req.file.path.replace("\\" ,"/");
        }

        if (!imageUrl) {
            const error = new Error('No Image Picked');
            error.statusCode = 422;

            throw error;
        }    
        
        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const postNotFoundErr = new Error(`Post Id = ${postId} was not Found`);
            postNotFoundErr.statusCode = 404;
            throw postNotFoundErr;
        }

        if (post.creator._id.toString() !== req.userId) {
            const authorizeError = new Error(`Not Authorization.`);
            authorizeError.statusCode = 403;
            throw authorizeError;
        }

        if (imageUrl !== post.imageUrl) {
            deleteImageFromServer(post.imageUrl);
        }

        post.title = updatedTitle;
        post.content = updatedContent;
        post.imageUrl = imageUrl;

        const updatedPost = await post.save();

        // Push Updated Post to Client
        io.getIO().emit('posts', { 
            action: 'update', 
            post: updatedPost
        });

        res.status(200).json({
            message: 'Post Updated.',
            post: updatedPost
        });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const postId = req.params.postId;

        const fetchedPost = await Post.findById(postId);

        //#region Validation

        if (!fetchedPost) {
            const postNotFoundErr = new Error(`Post Id = ${postId} was not Found`);
            postNotFoundErr.statusCode = 404;
            throw postNotFoundErr;
        }

        if (fetchedPost.creator.toString() !== req.userId) {
            const authorizeError = new Error(`Not Authorization.`);
            authorizeError.statusCode = 403;
            throw authorizeError;
        }

        //#endregion

        deleteImageFromServer(fetchedPost.imageUrl);

        const deletePost = Post.findByIdAndRemove(postId);
        const queryUser = User.findById(req.userId);

        const [t1, t2] = await Promise.all([deletePost, queryUser]);

        t2.posts.pull(postId);
        await t2.save();

        io.getIO().emit('posts', { 
            action: 'delete', 
            post: postId
        });

        res.status(200).json({ message: 'Deleted Post.' });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.getStatus = async (req, res, next) => {
    let error;
    try {
        const queryUser = await User.findById(req.userId);

        if (!queryUser) {
            error = new Error('User not Found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ status: queryUser.status });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};

exports.putStatus = async (req, res, next) => {
    let error;
    try {
        const errors = validationResult(req);
		if (!errors.isEmpty()) {
            error = new Error('Invalid Input');
            error.statusCode = 422;
            throw error;
        } 

        const queryUser = await User.findById(req.userId);
        if (!queryUser) {
            error = new Error('User not Found.');
            error.statusCode = 404;
            throw error;
        }

        const enteredStatus = req.body.status;
        queryUser.status = enteredStatus;
        const savedUser = await queryUser.save();

        res.status(200).json({ status: savedUser.status });
    } catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
};