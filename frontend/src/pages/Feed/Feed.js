import React, { Component, Fragment } from 'react';
import openSocket from 'socket.io-client';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
	state = {
		isEditing: false,
		posts: [],
		totalPosts: 0,
		editPost: null,
		status: '',
		postPage: 1,
		postsLoading: true,
		editLoading: false
	};

	async componentDidMount() {
		try {
			const loadStatus = fetch('http://localhost:8080/feed/status', { headers: { Authorization: `Bearer ${this.props.token}` } });

			const [t1] = await Promise.all([loadStatus, this.loadPosts()]);

			const data = await t1.json();

			if (t1.status !== 200) throw new Error(t1.message);

			this.setState({ status: data.status });

			const socket = openSocket('http://localhost:8080');
			socket.on('posts', data => {

				console.log(data);

				if (data.action === 'create') {
					this.addpost(data.post);
					return;
				}

				if (data.action === 'update') {
					this.updatePost(data.post);
					return;
				}

				if (data.action === 'delete') {
					this.loadPosts();
					return;
				}
			});
		} catch (err) {
			this.catchError(err);
		}
	}

	addpost = post => {
		this.setState(prevState => {
			const updatedPosts = [...prevState.posts];
			if (prevState.postPage === 1) {
				if (prevState.posts.length >= 2) {
					updatedPosts.pop();
				}
				updatedPosts.unshift(post);
			}
			return {
				posts: updatedPosts,
				totalPosts: prevState.totalPosts + 1
			};
		});
	};

	updatePost = post => {
		this.setState(prevState => {
			const updatedPosts = [...prevState.posts];
			
			const updatedPostsIndex = updatedPosts.findIndex(p => p._id === post._id);

			if (updatedPostsIndex > -1) {
				updatedPosts[updatedPostsIndex] = post;
			}

			return { posts: updatedPosts };
		});
	};

	loadPosts = async direction => {
		try {
			if (direction) {
				this.setState({ postsLoading: true, posts: [] });
			}

			let page = this.state.postPage;
			if (direction === 'next') {
				page++;
				this.setState({ postPage: page });
			}

			if (direction === 'previous') {
				page--;
				this.setState({ postPage: page });
			}

			const response = await fetch(
				`http://localhost:8080/feed/posts?page=${page}`,
				//{ headers: { Authorization: `Bearer abcdefghijk` } }
				{ headers: { Authorization: `Bearer ${this.props.token}` } }
			);

			const fetchedPosts = await response.json();

			if (response.status !== 200) throw new Error(fetchedPosts.message);

			this.setState({
				posts: fetchedPosts.posts.map(post => {
					return {
						...post,
						imagePath: post.imageUrl
					};
				}),
				totalPosts: fetchedPosts.totalItems,
				postsLoading: false
			});
		} catch (err) {
			this.catchError(err);
		}
	};

	statusUpdateHandler = async event => {
		try {
			event.preventDefault();

			const res = await fetch('http://localhost:8080/feed/status', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.props.token}`
				},
				body: JSON.stringify({
					status: this.state.status
				})
			});

			const data = await res.json();

			if (res.status !== 200) throw new Error(data.message);

			this.setState({ status: data.status });
		} catch (err) {
			this.catchError(err);
		}
	};

	newPostHandler = () => {
		this.setState({ isEditing: true });
	};

	startEditPostHandler = postId => {
		this.setState(prevState => {
			const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

			return {
				isEditing: true,
				editPost: loadedPost
			};
		});
	};

	cancelEditHandler = () => {
		this.setState({ isEditing: false, editPost: null });
	};

	finishEditHandler = async postData => {
		try {
			this.setState({ editLoading: true });

			let url = 'http://localhost:8080/feed/post';
			let method = 'POST';
			if (this.state.editPost) {
				url += `/${this.state.editPost._id}`;
				method = 'PUT';
			}

			const formData = new FormData();
			formData.append('title', postData.title);
			formData.append('content', postData.content);
			formData.append('image', postData.image);

			const response = await fetch(url, {
				method: method,
				headers: {
					//'Content-Type': 'application/json',
					Authorization: `Bearer ${this.props.token}`
				},
				/*body: JSON.stringify({
					title: postData.title,
					content: postData.content
				})*/
				body: formData
			});

			const data = await response.json();

			if (response.status !== 200 && response.status !== 201) throw new Error(data.message);

			/*const post = {
				_id: data.post._id,
				title: data.post.title,
				content: data.post.content,
				creator: data.post.creator,
				createdAt: data.post.createdAt
			};*/

			this.setState(prevState => {
				return {
					isEditing: false,
					editPost: null,
					editLoading: false
				};
			});
		} catch (err) {
			this.setState({
				isEditing: false,
				editPost: null,
				editLoading: false,
				error: err
			});

			this.catchError(err);
		}
	};

	statusInputChangeHandler = (input, value) => {
		this.setState({ status: value });
	};

	deletePostHandler = async postId => {
		try {
			this.setState({ postsLoading: true });

			const res = await fetch(`http://localhost:8080/feed/post/${postId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${this.props.token}` }
			});

			const data = await res.json();

			if (res.status !== 200 && res.status !== 201) throw new Error(data.message);

			this.loadPosts();

			/*this.setState(prevState => {
				const updatedPosts = prevState.posts.filter(p => p._id !== postId);
				return { posts: updatedPosts, postsLoading: false };
			});*/
		} catch (err) {
			this.setState({ postsLoading: false });
			this.catchError(err);
		}
	};

	errorHandler = () => {
		this.setState({ error: null });
	};

	catchError = error => {
		this.setState({ error: error });
	};

	render() {
		return (
			<Fragment>
				<ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
				<FeedEdit
					editing={this.state.isEditing}
					selectedPost={this.state.editPost}
					loading={this.state.editLoading}
					onCancelEdit={this.cancelEditHandler}
					onFinishEdit={this.finishEditHandler}
				/>
				<section className="feed__status">
					<form onSubmit={this.statusUpdateHandler}>
						<Input
							type="text"
							placeholder="Your status"
							control="input"
							onChange={this.statusInputChangeHandler}
							value={this.state.status}
						/>
						<Button mode="flat" type="submit">
							Update
            </Button>
					</form>
				</section>
				<section className="feed__control">
					<Button mode="raised" design="accent" onClick={this.newPostHandler}>
						New Post
          </Button>
				</section>
				<section className="feed">
					{this.state.postsLoading && (
						<div style={{ textAlign: 'center', marginTop: '2rem' }}>
							<Loader />
						</div>
					)}
					{this.state.posts.length <= 0 && !this.state.postsLoading ? (
						<p style={{ textAlign: 'center' }}>No posts found.</p>
					) : null}
					{!this.state.postsLoading && (
						<Paginator
							onPrevious={this.loadPosts.bind(this, 'previous')}
							onNext={this.loadPosts.bind(this, 'next')}
							lastPage={Math.ceil(this.state.totalPosts / 2)}
							currentPage={this.state.postPage}
						>
							{this.state.posts.map(post => (
								<Post
									key={post._id}
									id={post._id}
									author={post.creator.name}
									date={new Date(post.createdAt).toLocaleDateString('en-US')}
									title={post.title}
									image={post.imageUrl}
									content={post.content}
									onStartEdit={this.startEditPostHandler.bind(this, post._id)}
									onDelete={this.deletePostHandler.bind(this, post._id)}
								/>
							))}
						</Paginator>
					)}
				</section>
			</Fragment>
		);
	}
}

export default Feed;
