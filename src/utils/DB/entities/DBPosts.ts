import * as crypto from 'node:crypto';
import DBEntity from './DBEntity';

export type PostEntity = {
  id: string;
  title: string;
  content: string;
  userId: string;
};
type CreatePostDTO = Omit<PostEntity, 'id'>;
type ChangePostDTO = Partial<Omit<PostEntity, 'id' | 'userId'>>;

export default class DBPosts extends DBEntity<
  PostEntity,
  ChangePostDTO,
  CreatePostDTO
> {
  async create(dto: CreatePostDTO) {
    const created = {
      ...dto,
      id: crypto.randomUUID(),
    };
    this.entities.push(created);
    return created;
  }

  async onUserDelete(userId: string) {
    const posts = await this.findMany({ key: 'userId', equals: userId });
    await Promise.all(posts.map(post => {
      return this.delete(post.id);
    }))
  }
}
