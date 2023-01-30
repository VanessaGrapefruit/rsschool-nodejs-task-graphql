import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig } from 'graphql';
import { PostType } from "./post-schema";
import { UserEntity } from "../../../utils/DB/entities/DBUsers";
import { ProfileType } from "./profiles-schema";

type UsersArgs = {
    userId: string
}
type UserFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, UsersArgs> };

const userFields: UserFields = {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    profileId: { type: GraphQLString },
    userSubscribedToIds: { type: new GraphQLList(GraphQLString) },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
    postIds: { type: new GraphQLList(GraphQLString) },
}

export const UserType = new GraphQLObjectType({
    name: 'User',
    fields: userFields
});

export function getUserFields(db: DB): UserFields {
    const UserExtension = new GraphQLObjectType({
        name: 'UserExtension',
        fields: {
            ...userFields,
            posts: {
                type: new GraphQLList(PostType),
                resolve: (source: UserEntity) => {
                    const { id } = source;
                    return db.posts.findMany({ key: 'userId', equals: id });
                }
            },
            profile: {
                type: ProfileType,
                resolve: (source: UserEntity) => {
                    const { id } = source;
                    return db.profiles.findOne({key: 'userId', equals: id });
                }
            }
        }
    });
    
    return {
        users: {
            type: new GraphQLList(UserExtension),
            resolve: () => {
                return db.users.findMany();
            }
        },
        user: {
            type: UserExtension,
            args: {
                userId: { type: GraphQLString }
            },
            resolve: (_, args) => {
                const { userId } = args;
                return db.users.findOne({ key: 'id', equals: userId });
            }
        },
    }
}