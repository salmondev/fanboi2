/// <reference path="../typings/dom4/dom4.d.ts" />

import vdom = require('virtual-dom');
import dateFormatter = require('../utils/date_formatter');

import board = require('../models/board');
import topic = require('../models/topic');
import post = require('../models/post');


class InlineBoardView {
    board: board.Board;

    constructor(board: board.Board) {
        this.board = board;
    }

    render(): vdom.VNode {
        return vdom.h('div',
            {className: 'js-inline-board'},
            [
                vdom.h('div', {className: 'cascade'}, [
                    vdom.h('div', {className: 'container'}, [
                        InlineBoardView.renderTitle(this.board),
                        InlineBoardView.renderDescription(this.board),
                    ])
                ])
            ]
        );
    }

    private static renderTitle(board: board.Board): vdom.VNode {
        return vdom.h('div', {className: 'cascade-header'}, [
            String(board.title)
        ]);
    }

    private static renderDescription(board: board.Board): vdom.VNode {
        return vdom.h('div', {className: 'cascade-body'}, [
            String(board.description)
        ]);
    }
}


class InlineTopicView {
    topic: topic.Topic;

    constructor(topic: topic.Topic) {
        this.topic = topic;
    }

    render(): vdom.VNode {
        return vdom.h('div',
            {className: 'js-inline-topic'},
            [
                vdom.h('div', {className: 'topic-header'}, [
                    vdom.h('div', {className: 'container'}, [
                        InlineTopicView.renderTitle(this.topic),
                        InlineTopicView.renderDate(this.topic),
                        InlineTopicView.renderCount(this.topic),
                    ])
                ])
            ]
        );
    }

    private static renderTitle(topic: topic.Topic): vdom.VNode {
        return vdom.h('h3', {className: 'topic-header-title'}, [
            String(topic.title)
        ]);
    }

    private static renderDate(topic: topic.Topic): vdom.VNode {
        let postedAt = new Date(topic.postedAt);
        let formatter = new dateFormatter.DateFormatter(postedAt);
        return vdom.h('p', {className: 'topic-header-item'}, [
            String('Last posted '),
            vdom.h('strong', {}, [String(formatter)]),
        ]);
    }

    private static renderCount(topic: topic.Topic): vdom.VNode {
        return vdom.h('p', {className: 'topic-header-item'}, [
            String('Total of '),
            vdom.h('strong', {}, [String(`${topic.postCount} posts`)]),
        ]);
    }
}


class InlinePostsView {
    posts: post.Post[];

    constructor(posts: post.Post[]) {
        this.posts = posts;
    }

    render(): vdom.VNode {
        return vdom.h('div',
            {className: 'js-inline-post'},
            this.posts.map(function(post: post.Post): vdom.VNode {
                return InlinePostsView.renderPost(post);
            })
        );
    }

    private static renderPost(post: post.Post): vdom.VNode {
        return vdom.h('div', {className: 'container'}, [
            InlinePostsView.renderHeader(post),
            InlinePostsView.renderBody(post),
        ]);
    }

    private static renderHeader(post: post.Post): vdom.VNode {
        return vdom.h('div', {className: 'post-header'}, [
            InlinePostsView.renderHeaderNumber(post),
            InlinePostsView.renderHeaderName(post),
            InlinePostsView.renderHeaderDate(post),
            InlinePostsView.renderHeaderIdent(post),
        ]);
    }

    private static renderHeaderNumber(post: post.Post): vdom.VNode {
        let classList = ['post-header-item', 'number'];
        if (post.bumped) { classList.push('bumped'); }
        return vdom.h('span', {
            className: classList.join(' '),
        }, [String(post.number)]);
    }

    private static renderHeaderName(post: post.Post): vdom.VNode {
        return vdom.h('span', {
            className: 'post-header-item name'
        }, [String(post.name)]);
    }

    private static renderHeaderDate(post: post.Post): vdom.VNode {
        let createdAt = new Date(post.createdAt);
        let formatter = new dateFormatter.DateFormatter(createdAt);
        return vdom.h('span', {
            className: 'post-header-item date'
        }, [String(`Posted ${formatter}`)]);
    }

    private static renderHeaderIdent(post: post.Post): vdom.VNode | string {
        if (post.ident) {
            return vdom.h('span', {
                className: 'post-header-item ident'
            }, [String(`ID:${post.ident}`)]);
        } else {
            return String(null);
        }
    }

    private static renderBody(post: post.Post): vdom.VNode {
        return vdom.h('div', {
            className: 'post-body',
            innerHTML: post.bodyFormatted,
        }, []);
    }
}


class InlineQuoteHandler {
    targetElement: Element;
    quoteElement: Element;

    constructor(element: Element) {
        this.targetElement = element;
    }

    attach(): void {
        let self = this;
        this.render().then(function(node: vdom.VNode | void) {
            if (node) {
                self.quoteElement = vdom.create(<vdom.VNode>node);
                document.body.insertBefore(self.quoteElement, null);
            }
        });
    }

    detach(): void {
        if (this.quoteElement) {
            this.quoteElement.parentElement.removeChild(this.quoteElement);
        }
    }

    private render(): Promise<vdom.VNode | void> {
        let targetElement = this.targetElement;
        let boardSlug = targetElement.getAttribute('data-board');
        let topicId = parseInt(targetElement.getAttribute('data-topic'), 10);
        let number = targetElement.getAttribute('data-number');

        if (boardSlug && !topicId && !number) {
            return board.Board.querySlug(boardSlug).then(function(
                board: board.Board
            ): vdom.VNode {
                if (board) {
                    return new InlineBoardView(board).render();
                }
            });
        } else if (topicId && !number) {
            return topic.Topic.queryId(topicId).then(function(
                topic: topic.Topic
            ): vdom.VNode {
                if (topic) {
                    return new InlineTopicView(topic).render();
                }
            });
        } else if (topicId && number) {
            return post.Post.queryAll(topicId, number).then(
                function(posts: Array<post.Post>) {
                    if (posts && posts.length) {
                        return new InlinePostsView(posts).render();
                    }
                }
            );
        }
    }
}


export class InlineQuote {
    targetSelector: string;

    constructor(targetSelector: string) {
        this.targetSelector = targetSelector;
        this.attachSelf();
    }

    private attachSelf(): void {
        let self = this;

        document.addEventListener('mouseover', function(e: Event): void {
            if ((<Element>e.target).matches(self.targetSelector)) {
                e.preventDefault();
                InlineQuote.eventQuoteMouseOver(<Element>e.target);
            }
        });
    }

    private static eventQuoteMouseOver(element: Element): void {
        let handler = new InlineQuoteHandler(element);
        handler.attach();
    }
}