import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig } from 'graphql';

type PostsArgs = {
    postId: string;
}
type PostsFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, PostsArgs> };

export const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
        userId: { type: GraphQLString },
    })
});

export function getPostFields(db: DB): PostsFields {
    return {
        posts: {
            type: new GraphQLList(PostType),
            resolve: () => {
                return db.posts.findMany();
            }
        },
        post: {
            type: PostType,
            args: {
                postId: { type: GraphQLString }
            },
            resolve: (_, args) => {
                const { postId } = args;
                return db.posts.findOne({ key: 'id', equals: postId });
            }
        }
    }
}