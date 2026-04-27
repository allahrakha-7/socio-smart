import express from 'express';
import { getPosts, createPost, editPost, deletePost, getChats, getResidents, toggleLike, votePoll, addComment, sharePost } from '../controllers/communityController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/posts', protect, getPosts);
router.post('/posts', protect, createPost);
router.put('/posts/:id', protect, editPost);
router.delete('/posts/:id', protect, deletePost);
router.patch('/posts/:id/like', protect, toggleLike);
router.post('/posts/:id/comments', protect, addComment);
router.patch('/posts/:id/share', protect, sharePost);
router.patch('/posts/:id/vote', protect, votePoll);
router.get('/chats', protect, getChats);
router.get('/residents', protect, getResidents);

export default router;
