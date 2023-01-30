import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, GraphQLInt } from 'graphql';

type ProfilesArgs = {
    profileId: string;
}
type ProfilesFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, ProfilesArgs> };

export const ProfileType = new GraphQLObjectType({
    name: 'Profile',
    fields: () => ({
        id: { type: GraphQLString },
        avatar: { type: GraphQLString },
        sex: { type: GraphQLString },
        birthday: { type: GraphQLInt },
        country: { type: GraphQLString },
        street: { type: GraphQLString },
        city: { type: GraphQLString },
        memberTypeId: { type: GraphQLString },
        userId: { type: GraphQLString },
    })
});

export function getProfileFields(db: DB): ProfilesFields {

    return {
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
}