import request = require('../utils/request');
import cancellable = require('../utils/cancellable');

export class Post {
    type: string;
    id: number;
    body: string;
    bodyFormatted: string;
    bumped: boolean;
    createdAt: string;
    ident: string;
    name: string;
    number: number;
    topicId: number;
    path: string;

    constructor(data: any) {
        this.type = data.type;
        this.id = data.id;
        this.body = data.body;
        this.bodyFormatted = data.body_formatted;
        this.bumped = data.bumped;
        this.createdAt = data.created_at;
        this.ident = data.ident;
        this.name = data.name;
        this.number = data.number;
        this.topicId = data.topic_id;
        this.path = data.path;
    }

    static queryAll(
        topicId: number,
        query?: string,
        token?: cancellable.CancellableToken
    ): Promise<Array<Post>> {
        let entryPoint: string;

        if (query) {
            entryPoint = `/api/1.0/topics/${topicId}/posts/${query}/`;
        } else {
            entryPoint = `/api/1.0/topics/${topicId}/posts/`;
        }

        return request.request('GET', entryPoint, token).then(function(resp) {
            return JSON.parse(resp).map(function(data: Object): Post {
                return new Post(data);
            });
        });
    }
}