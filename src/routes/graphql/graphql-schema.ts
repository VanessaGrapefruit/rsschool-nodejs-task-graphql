import { GraphQLString, GraphQLObjectType, GraphQLSchema, GraphQLInt } from 'graphql';
import DB from '../../utils/DB/DB';
import { getMemberTypeFields } from './schemas/member-types-schema';
import { getPostFields } from './schemas/post-schema';
import { getProfileFields } from './schemas/profiles-schema';
import { getUserFields } from './schemas/users-schema';

export function buildSchema(db: DB) {
    const AppQueryRootType = new GraphQLObjectType({
        name: 'AppSchema',
        fields: {
            ...getUserFields(db),
            ...getProfileFields(db),
            ...getPostFields(db),
            ...getMemberTypeFields(db)
        }
    });
    
    const AppSchema = new GraphQLSchema({
        query: AppQueryRootType
    });

    return AppSchema;
}