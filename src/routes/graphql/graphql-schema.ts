import { GraphQLString, GraphQLObjectType, GraphQLSchema, GraphQLInt, GraphQLInputObjectType } from 'graphql';
import DB from '../../utils/DB/DB';
import { getMemberTypeFields } from './schemas/member-types-schema';
import { getPostFields } from './schemas/post-schema';
import { getProfileFields } from './schemas/profiles-schema';
import { getUserFields } from './schemas/users-schema';

export function buildSchema(db: DB) {
    const userFields = getUserFields(db);
    const postFields = getPostFields(db);
    const profileFields = getProfileFields(db);
    const memberTypeFields = getMemberTypeFields(db);

    const AppQueryRootType = new GraphQLObjectType({
        name: 'AppQuerySchema',
        fields: {
            ...userFields.query,
            ...postFields.query,
            ...profileFields.query,
            ...memberTypeFields.query
        }
    });

    const AppMutationRootType = new GraphQLObjectType({
        name: 'AppMutationSchema',
        fields: {
            ...userFields.mutations,
            ...postFields.mutations,
            ...profileFields.mutations,
            ...memberTypeFields.mutations
        }
    })
    
    const AppSchema = new GraphQLSchema({
        query: AppQueryRootType,
        mutation: AppMutationRootType
    });

    return AppSchema;
}