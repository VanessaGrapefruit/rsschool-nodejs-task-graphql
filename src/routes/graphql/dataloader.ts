import DataLoader = require("dataloader");
import DB from "../../utils/DB/DB";
import { MemberTypeEntity } from "../../utils/DB/entities/DBMemberTypes";
import { PostEntity } from "../../utils/DB/entities/DBPosts";
import { ProfileEntity } from "../../utils/DB/entities/DBProfiles";
import { UserEntity } from "../../utils/DB/entities/DBUsers";

type Loaders = {
    users: DataLoader<string, UserEntity | undefined>,
    profiles: DataLoader<string, ProfileEntity | undefined>,
    posts: DataLoader<string, PostEntity[] | undefined>,
    memberTypes: DataLoader<string, MemberTypeEntity | undefined>,
}

export type ContextType = {
    loaders: Loaders;
}

export function createLoaders(db: DB): Loaders {
    return {
        users: new DataLoader(ids => usersByIds(db, ids)),
        profiles: new DataLoader(userIds => profilesByIds(db, userIds)),
        posts: new DataLoader(userIds => postsByIds(db, userIds)),
        memberTypes: new DataLoader(ids => memberTypesByIds(db, ids)),
    };
}

const usersByIds = async (db: DB, ids: readonly string[]) => {
    const allUsers = await db.users.findMany();
    return ids.map((id) => allUsers.find((user) => user.id === id));
};
  
const profilesByIds = async (db: DB, userIds: readonly string[]) => {
    const allProfiles = await db.profiles.findMany();
    return userIds.map((id) => allProfiles.find((profile) => profile.userId === id));
};

const postsByIds = async (db: DB, userIds: readonly string[]) => {
    const allPosts = await db.posts.findMany();
    return userIds.map((id) => allPosts.filter((post) => post.userId === id));
};

const memberTypesByIds = async (db: DB, userIds: readonly string[]) => {
    const allMemberTypes = await db.memberTypes.findMany();
    return userIds.map((id) => allMemberTypes.find((memberType) => memberType.id === id));
};