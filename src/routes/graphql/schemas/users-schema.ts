import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, Source } from 'graphql';
import { PostType } from "./post-schema";
import { UserEntity } from "../../../utils/DB/entities/DBUsers";
import { ProfileType } from "./profiles-schema";
import { MemberTypeType } from "./member-types-schema";
import { ContextType } from "../dataloader";

type UsersArgs = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    updateSubscriptionsUserId: string;
}
type UserFields = { [key: string]: GraphQLFieldConfig<unknown, ContextType, UsersArgs> };
type UserFieldsType = {
    query: UserFields,
    mutations: UserFields
}

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

export function getUserFields(db: DB): UserFieldsType {
    const UserExtension = new GraphQLObjectType({
        name: 'UserExtension',
        fields: {
            ...userFields,
            posts: {
                type: new GraphQLList(PostType),
                resolve: (user: UserEntity, _, { loaders }: ContextType) => {
                    const { id } = user;
                    return loaders.posts.load(id);
                }
            },
            profile: {
                type: ProfileType,
                resolve: (user: UserEntity, _, { loaders }: ContextType) => {
                    const { id } = user;
                    return loaders.profiles.load(id);
                }
            },
            memberType: {
                type: MemberTypeType,
                resolve: async (source: UserEntity, _, { loaders }: ContextType) => {
                    const { id } = source;
                    const profile = await loaders.profiles.load(id);
                    if (profile) {
                        return loaders.memberTypes.load(profile.memberTypeId);
                    } else {
                        return null;
                    }
                }
            },
            userSubscribedTo: {
                type: new GraphQLList(UserType),
                resolve: (source: UserEntity) => {
                    const { userSubscribedToIds } = source;
                    return db.users.findMany({ key: 'id', equalsAnyOf: userSubscribedToIds });
                }
            },
            subscribedToUser: {
                type: new GraphQLList(UserType),
                resolve: (source: UserEntity) => {
                    const { subscribedToUserIds } = source;
                    return db.users.findMany({ key: 'id', equalsAnyOf: subscribedToUserIds });
                }
            }
        }
    });
    
    const query: UserFields = {
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

    const userArgs = {
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        userId: { type: GraphQLString },
    }

    const mutations: UserFields = {
        createUser: {
            type: UserType,
            args: userArgs,
            resolve: (_, args) => {
                return db.users.create(args);
            }
        },
        updateUser: {
            type: UserType,
            args: userArgs,
            resolve: (_, args) => {
                const { userId, ...dto } = args;
                return db.users.change(userId, dto);
            }
        },
        subscribeTo: {
            type: UserType,
            args: {
                updateSubscriptionsUserId: { type: GraphQLString },
                userId: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                const { userId: subscriberId, updateSubscriptionsUserId: followedId } = args;

                const [subscriber, followed] = await Promise.all([
                    db.users.findOne({ key: 'id', equals: subscriberId }),
                    db.users.findOne({ key: 'id', equals: followedId })
                ]);

                if (subscriber && followed) {
                    const changedSubscriber: UserEntity = { ...subscriber, userSubscribedToIds: [...subscriber.userSubscribedToIds, followedId ]};
                    const changedFollowed: UserEntity = { ...followed, subscribedToUserIds: [...followed.subscribedToUserIds, subscriberId] };
                
                    await db.users.change(followedId, changedFollowed);
                    return await db.users.change(subscriberId, changedSubscriber);
                }
            }
        },
        unsubscribeFrom: {
            type: UserType,
            args: {
                updateSubscriptionsUserId: { type: GraphQLString },
                userId: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                const { userId: subscriberId, updateSubscriptionsUserId: followedId } = args;

                const [subscriber, followed] = await Promise.all([
                    db.users.findOne({ key: 'id', equals: subscriberId }),
                    db.users.findOne({ key: 'id', equals: followedId })
                ]);

                if (subscriber && followed) {
                    const changedSubscriber: UserEntity = { ...subscriber, userSubscribedToIds: subscriber?.userSubscribedToIds.filter(id => id !== followedId) };
                    const changedFollowed: UserEntity = { ...followed, subscribedToUserIds: followed.subscribedToUserIds.filter(id => id !== subscriberId) };
                
                    await db.users.change(followedId, changedFollowed);
                    return await db.users.change(subscriberId, changedSubscriber);
                }
            }
        }
    };

    return { query, mutations };
}