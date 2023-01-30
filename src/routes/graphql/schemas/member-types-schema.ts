import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, GraphQLInt } from 'graphql';

type MemberTypesArgs = {
    memberTypeId: string;
}
type MemberTypesFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, MemberTypesArgs> };

export const MemberTypeType = new GraphQLObjectType({
    name: 'MemberType',
    fields: () => ({
        id: { type: GraphQLString },
        discount: { type: GraphQLInt },
        monthPostsLimit: { type: GraphQLInt },
        profileIds: { type: new GraphQLList(GraphQLString) },
    })
});

export function getMemberTypeFields(db: DB): MemberTypesFields {
    return {
        memberTypes: {
            type: new GraphQLList(MemberTypeType),
            resolve: () => {
                return db.memberTypes.findMany();
            }
        },
        memberType: {
            type: MemberTypeType,
            args: {
                memberTypeId: { type: GraphQLString }
            },
            resolve: (_, args) => {
                const { memberTypeId } = args;
                return db.posts.findOne({ key: 'id', equals: memberTypeId });
            }
        }
    }
}