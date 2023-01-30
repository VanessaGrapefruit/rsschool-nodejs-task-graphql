import DB from "../../../utils/DB/DB";
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFieldConfig, GraphQLInt } from 'graphql';

type MemberTypesArgs = {
    memberTypeId: string;
    discount: number;
    monthPostsLimit: number;
    profileIds: string[];
}
type MemberTypesFields = { [key: string]: GraphQLFieldConfig<unknown, unknown, MemberTypesArgs> };
type MemberTypesFieldsType = {
    query: MemberTypesFields;
    mutations: MemberTypesFields;
}

const memberTypeFields: MemberTypesFields = {
    id: { type: GraphQLString },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
    profileIds: { type: new GraphQLList(GraphQLString) },
}

export const MemberTypeType = new GraphQLObjectType({
    name: 'MemberType',
    fields: memberTypeFields
});

export function getMemberTypeFields(db: DB): MemberTypesFieldsType {
    const query: MemberTypesFields = {
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

    const memberTypeArgs = {
        ...memberTypeFields,
        memberTypeId: { type: GraphQLString }
    }

    const mutations: MemberTypesFields = {
        updateMemberType: {
            type: MemberTypeType,
            args: memberTypeArgs,
            resolve: (_, args) => {
                const { memberTypeId, ...dto } = args;
                return db.memberTypes.change(memberTypeId, dto);
            }
        }
    }

    return { query, mutations };
}