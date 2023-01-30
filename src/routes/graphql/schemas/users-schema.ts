import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, Source } from 'graphql';
import { PostType } from "./post-schema";
import { UserEntity } from "../../../utils/DB/entities/DBUsers";
import { ProfileType } from "./profiles-schema";
import { MemberTypeType } from "./member-types-schema";

type UsersArgs = {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    updateSubscriptionsUserId: string;
}
type UserFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, UsersArgs> };
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
                resolve: (source: UserEntity) => {
                    console.log(source);
                    const { id } = source;
                    return db.posts.findMany({ key: 'userId', equals: id });
                }
            },
            profile: {
                type: ProfileType,
                resolve: (source: UserEntity) => {
                    const { id } = source;
                    return db.profiles.findOne({ key: 'userId', equals: id });
                }
            },
            memberType: {
                type: MemberTypeType,
                resolve: async (source: UserEntity) => {
                    const { id } = source;
                    const profile = await db.profiles.findOne({ key: 'userId', equals: id });
                    if (profile) {
                        return db.memberTypes.findOne({ key: 'id', equals: profile?.memberTypeId });
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