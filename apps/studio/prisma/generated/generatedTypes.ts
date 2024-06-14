import type { ColumnType } from "kysely"
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>
export type Timestamp = ColumnType<Date, Date | string, Date | string>

export type Accounts = {
  id: string
  provider: string
  providerAccountId: string
  userId: string
}
export type LikedPosts = {
  postId: string
  userId: string
  createdAt: Generated<Timestamp>
}
export type Post = {
  id: string
  title: string | null
  content: string
  contentHtml: string
  authorId: string
  images: string[]
  parentPostId: string | null
  createdAt: Generated<Timestamp>
  updatedAt: Generated<Timestamp>
  deletedAt: Timestamp | null
}
export type User = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  emailVerified: Timestamp | null
  image: string | null
  bio: string | null
}
export type VerificationToken = {
  identifier: string
  token: string
  attempts: Generated<number>
  expires: Timestamp
}
export type DB = {
  Accounts: Accounts
  LikedPosts: LikedPosts
  Post: Post
  User: User
  VerificationToken: VerificationToken
}
