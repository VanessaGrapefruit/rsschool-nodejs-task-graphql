import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, GraphQLInt } from 'graphql';

type ProfilesArgs = {
    profileId: string;
    avatar: string;
    sex: string;
    birthday: number;
    country: string;
    street: string;
    city: string;
    memberTypeId: string;
    userId: string;
}
type ProfilesFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, ProfilesArgs> };
type ProfilesFieldsType = {
    query: ProfilesFields;
    mutations: ProfilesFields
}

const profileFields: ProfilesFields = {
    id: { type: GraphQLString },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
}

export const ProfileType = new GraphQLObjectType({
    name: 'Profile',
    fields: profileFields
});

export function getProfileFields(db: DB): ProfilesFieldsType {

    const query: ProfilesFields = {
        profiles: {
            type: new GraphQLList(ProfileType),
            resolve: () => {
                return db.profiles.findMany();
            }
        },
        profile: {
            type: ProfileType,
            args: {
                profileId: { type: GraphQLString }
            },
            resolve: (_, args) => {
                const { profileId } = args;
                return db.profiles.findOne({ key: 'id', equals: profileId });
            }
        }
    }

    const profileArgs = {
        ...profileFields,
        profileId: { type: GraphQLString }
    }

    const mutations: ProfilesFields = {
        createProfile: {
            type: ProfileType,
            args: profileArgs,
            resolve: async (_, args) => {
                const profile = await db.profiles.create(args);
                const result = await db.onProfileCreate(profile);
                return result || profile;
            }
        },
        updateProfile: {
            type: ProfileType,
            args: profileArgs,
            resolve: async (_, args) => {
                const { profileId, ...dto } = args;
                const [prevProfile, currProfile] = await Promise.all([
                    db.profiles.findOne({ key: 'id', equals: profileId }),
                    db.profiles.change(profileId, dto).catch(() => null)
                ]);
                if (prevProfile && currProfile) {
                    await db.onProfileChange(prevProfile, currProfile);
                }

                return currProfile;
            }
        }
    };

    return { query, mutations };
}