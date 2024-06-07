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
  user_id: string
}
export type LikedPosts = {
  post_id: string
  user_id: string
  created_at: Generated<Timestamp>
}
export type Post = {
  id: string
  title: string | null
  content: string
  content_html: string
  author_id: string
  images: string[]
  parent_post_id: string | null
  created_at: Generated<Timestamp>
  updated_at: Generated<Timestamp>
  deleted_at: Timestamp | null
}
export type User = {
  id: string
  name: string | null
  username: string | null
  email: string | null
  email_verified: Timestamp | null
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
