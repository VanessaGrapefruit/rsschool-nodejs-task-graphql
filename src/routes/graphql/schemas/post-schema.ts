import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig } from 'graphql';

type PostsArgs = {
    postId: string;
    title: string;
    content: string;
    userId: string;
}
type PostsFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, PostsArgs> };
type PostsFieldsType = {
    query: PostsFields;
    mutations: PostsFields
};

const postsFields: PostsFields = {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
}

export const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: postsFields
});

export function getPostFields(db: DB): PostsFieldsType {
    const query: PostsFields = {
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

    const postArgs = {
        ...postsFields,
        postId: { type: GraphQLString }
    }

    const mutations: PostsFields = {
        createPost: {
            type: PostType,
            args: postArgs,
            resolve: async (_, args) => {
                const post = await db.posts.create(args);
                await db.onPostCreate(post);
                return post;
            }
        },
        updatePost: {
            type: PostType,
            args: postArgs,
            resolve: async (_, args) => {
                const { postId, ...dto } = args;
                return db.posts.change(postId, dto);
            }
        }
    }

    return { query, mutations };
}