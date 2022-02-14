import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
	state = {
		title: '',
		author: '',
		date: '',
		image: '',
		content: ''
	};

	async componentDidMount() {
		try {
			const postId = this.props.match.params.postId;

			const response = await fetch(`http://localhost:8080/feed/post/${postId}`, {
				headers: { Authorization: `Bearer ${this.props.token}` }
			});

			const data = await response.json();

			if (response.status !== 200) throw new Error(data.message);
		
			console.log(data.post);

			this.setState({
				title: data.post.title,
				author: data.post.creator.name,
				image: `http://localhost:8080/${data.post.imageUrl}`,
				date: new Date(data.post.createdAt).toLocaleDateString('en-US'),
				content: data.post.content
			});
		} catch (err) {
			console.log(err);
		}
	}

	render() {
		return (
			<section className="single-post">
				<h1>{this.state.title}</h1>
				<h2>
					Created by {this.state.author} on {this.state.date}
				</h2>
				<div className="single-post__image">
					<Image contain imageUrl={this.state.image} />
				</div>
				<p>{this.state.content}</p>
			</section>
		);
	}
}

export default SinglePost;
