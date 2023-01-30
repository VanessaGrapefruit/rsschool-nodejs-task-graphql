import DBMemberTypes, { MemberTypeEntity } from './entities/DBMemberTypes';
import DBPosts, { PostEntity } from './entities/DBPosts';
import DBProfiles, { ProfileEntity } from './entities/DBProfiles';
import DBUsers, { UserEntity } from './entities/DBUsers';
import * as lodash from 'lodash';

export default class DB {
  users = new DBUsers();
  profiles = new DBProfiles();
  memberTypes = new DBMemberTypes();
  posts = new DBPosts();

  constructor() {
    const deepCopyResultTrap: ProxyHandler<any> = {
      get: (target, prop) => {
        if (typeof target[prop] === 'function') {
          return (...args: any[]) => {
            const result = target[prop](...args);
            if (result instanceof Promise) {
              return result.then((v) => lodash.cloneDeep(v));
            }
            return lodash.cloneDeep(result);
          };
        } else {
          return target[prop];
        }
      },
    };
    for (const [k, v] of Object.entries(this)) {
      this[k as keyof typeof this] = new Proxy(v, deepCopyResultTrap);
    }
  }

  async onUserDelete(userId: string): Promise<void> {
    await Promise.all([
      this.posts.onUserDelete(userId),
      this.profiles.onUserDelete(userId)
    ]);
  }

  async onPostCreate(post: PostEntity): Promise<void> {
    const user = await this.users.findOne({ key: 'id', equals: post.userId });
    if (user) {
      const changed: UserEntity = { ...user, postIds: [...user?.postIds || [], post.id ]};
      await this.users.change(user.id, changed);
    }
  }

  async onPostDelete(post: PostEntity): Promise<void> {
    const user = await this.users.findOne({ key: 'id', equals: post.userId });
    if (user) {
      const changed: UserEntity = { ...user, postIds: user.postIds.filter(id => id !== post.id)};
      await this.users.change(user.id, changed);
    }
  }

  async onProfileCreate(profile: ProfileEntity): Promise<{ error: string} | void> {
    const [changeUserResult] = await Promise.all([
      this.users.onProfileCreate(profile),
      this.memberTypes.onProfileCreate(profile)
    ]);
    return changeUserResult;
  }

  async onProfileChange(prevProfile: ProfileEntity, currProfile: ProfileEntity): Promise<void> {
    await Promise.all([
      this.memberTypes.onProfileChanged(prevProfile, currProfile)
    ]);
  }

  async onProfileDelete(profile: ProfileEntity): Promise<void> {
    await Promise.all([
      this.users.onProfileDelete(profile),
      this.memberTypes.onProfileDelete(profile)
    ]);
  }
}
